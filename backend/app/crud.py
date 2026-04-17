from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas

DEFAULT_MILESTONES = [
    "DISPATCH_ASSIGNED",
    "EN_ROUTE_TO_PICKUP",
    "ARRIVED_AT_PICKUP",
    "LOADING_STARTED",
    "LOADING_FINISHED",
    "DISPATCHED",
    "EN_ROUTE_TO_DESTINATION",
    "ARRIVED_AT_DESTINATION",
    "UNLOADING_STARTED",
    "UNLOADING_FINISHED",
    "COMPLETED",
]


def calculate_le(actual: float, planned: float) -> float:
    if planned <= 0:
        raise ValueError("Planned lead time must be greater than zero.")
    return round((actual / planned) * 100, 2)


def ensure_reference_data(db: Session) -> None:
    if db.query(models.DispatchMilestone).count():
        return
    milestones = [models.DispatchMilestone(name=name, order_index=index) for index, name in enumerate(DEFAULT_MILESTONES, start=1)]
    db.add_all(milestones)
    db.flush()
    completed = next(item for item in milestones if item.name == "COMPLETED")
    policy = models.PolicyRule(
        policy_code="DISPATCH_COMPLETION_REQUIRES_APPROVAL",
        scope=models.PolicyScope.dispatch,
        action=models.PolicyAction.require_approval,
        applies_to_milestone_id=completed.id,
        condition={"requires_reason": True, "minimum_actors": 1},
        description="Completion requires an approval record before the final milestone is committed.",
    )
    db.add(policy)
    db.flush()
    db.add(models.MilestonePolicyBinding(milestone_id=completed.id, policy_id=policy.id))
    db.commit()


def get_milestones(db: Session):
    return db.query(models.DispatchMilestone).order_by(models.DispatchMilestone.order_index).all()


def create_dispatch(db: Session, payload: schemas.DispatchCreate):
    dispatch = models.Dispatch(**payload.model_dump())
    db.add(dispatch)
    db.commit()
    db.refresh(dispatch)
    return _serialize_dispatch(dispatch)


def get_dispatch(db: Session, dispatch_id: str):
    return db.query(models.Dispatch).filter(models.Dispatch.id == dispatch_id).first()


def list_dispatches(
    db: Session,
    page: int,
    limit: int,
    origin: str | None,
    destination: str | None,
    carrier: str | None,
    phase: str | None,
    governance_status: str | None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
):
    query = db.query(models.Dispatch)
    if origin:
        query = query.filter(models.Dispatch.origin_code == origin)
    if destination:
        query = query.filter(models.Dispatch.destination_code == destination)
    if carrier:
        query = query.filter(models.Dispatch.carrier_name == carrier)
    if phase:
        query = query.filter(models.Dispatch.phase == phase)
    if governance_status:
        query = query.filter(models.Dispatch.governance_status == governance_status)
    size = min(max(limit, 1), 50)
    total = query.count()
    sort_column = getattr(models.Dispatch, sort_by, models.Dispatch.created_at)
    ordering = sort_column.desc() if sort_dir.lower() == "desc" else sort_column.asc()
    rows = query.order_by(ordering).offset((max(page, 1) - 1) * size).limit(size).all()
    return {"data": [_serialize_dispatch(row) for row in rows], "total_count": total, "page": max(page, 1), "limit": size}


def get_dashboard_metrics(db: Session):
    active = db.query(func.count(models.Dispatch.id)).filter(models.Dispatch.completed_at.is_(None)).scalar() or 0
    avg_le = db.query(func.avg(models.Dispatch.actual_lead_time_minutes / models.Dispatch.planned_lead_time_minutes * 100)).filter(
        models.Dispatch.actual_lead_time_minutes.isnot(None), models.Dispatch.planned_lead_time_minutes.isnot(None)
    ).scalar()
    statuses = {status.name.upper(): 0 for status in models.GovernanceStatus if status is not models.GovernanceStatus.clear}
    counts = db.query(models.Dispatch.governance_status, func.count(models.Dispatch.id)).group_by(models.Dispatch.governance_status).all()
    for status, count in counts:
        if status and status != models.GovernanceStatus.clear:
            statuses[status.name.upper()] = count
    return {"total_active_dispatches": active, "average_lead_time_efficiency": round(float(avg_le), 2) if avg_le else None, "status_counts": statuses}


def update_dispatch_status(db: Session, dispatch_id: str, payload: schemas.DispatchUpdate, actor_id: str):
    dispatch = get_dispatch(db, dispatch_id)
    if not dispatch:
        return None
    _validate_sequence(db, dispatch, payload.current_milestone_id)
    policy = db.query(models.PolicyRule).join(models.MilestonePolicyBinding, models.PolicyRule.id == models.MilestonePolicyBinding.policy_id).filter(
        models.MilestonePolicyBinding.milestone_id == payload.current_milestone_id,
        models.PolicyRule.action == models.PolicyAction.require_approval,
        models.PolicyRule.is_active.is_(True),
    ).first()
    if policy and not _approved_request_exists(db, dispatch.id, policy.id):
        approval = _materialize_pending_approval(db, dispatch, actor_id, policy, payload.reason or "Approval requested during dispatch transition.")
        raise ValueError(f"Approval required before completing this milestone. Request {approval.id} is pending.")
    if payload.actual_lead_time_minutes is not None:
        dispatch.actual_lead_time_minutes = Decimal(str(payload.actual_lead_time_minutes))
    dispatch.current_milestone_id = payload.current_milestone_id
    dispatch.completed_at = payload.completed_at or dispatch.completed_at
    dispatch.governance_status = models.GovernanceStatus.clear
    dispatch.active_approval_id = None
    db.add(models.AuditLog(dispatch_id=dispatch.id, milestone_id=payload.current_milestone_id, updater_id=actor_id, override_type=models.OverrideType.manual_complete, reason=payload.reason, snapshot=payload.model_dump(mode="json")))
    db.commit()
    db.refresh(dispatch)
    return _serialize_dispatch(dispatch)


def list_transshipment_legs(db: Session, dispatch_id: str):
    return db.query(models.TransshipmentLeg).filter(models.TransshipmentLeg.dispatch_id == dispatch_id).order_by(models.TransshipmentLeg.leg_order).all()


def create_transshipment_leg(db: Session, dispatch_id: str, payload: schemas.TransshipmentLegCreate, actor_id: str):
    dispatch = get_dispatch(db, dispatch_id)
    if not dispatch:
        return None
    _validate_leg_timestamps(payload.arrived_at, payload.sailed_at)
    leg = models.TransshipmentLeg(dispatch_id=dispatch_id, created_by=actor_id, **payload.model_dump())
    db.add(leg)
    db.flush()
    db.add(models.AuditLog(dispatch_id=dispatch_id, transshipment_leg_id=leg.id, updater_id=actor_id, override_type=models.OverrideType.transshipment_update, reason="Recursive transshipment leg created.", snapshot=payload.model_dump(mode="json")))
    db.commit()
    db.refresh(leg)
    return leg


def _serialize_dispatch(dispatch: models.Dispatch) -> dict:
    planned = float(dispatch.planned_lead_time_minutes) if dispatch.planned_lead_time_minutes is not None else None
    actual = float(dispatch.actual_lead_time_minutes) if dispatch.actual_lead_time_minutes is not None else None
    lead_time = calculate_le(actual, planned) if planned and actual is not None else None
    return {
        "id": dispatch.id,
        "identifier": dispatch.identifier,
        "current_milestone_id": dispatch.current_milestone_id,
        "current_milestone_name": dispatch.current_milestone.name if dispatch.current_milestone else None,
        "origin_code": dispatch.origin_code,
        "destination_code": dispatch.destination_code,
        "carrier_name": dispatch.carrier_name,
        "phase": dispatch.phase,
        "governance_status": dispatch.governance_status,
        "planned_lead_time_minutes": planned,
        "actual_lead_time_minutes": actual,
        "lead_time_efficiency": lead_time,
        "current_lat": dispatch.current_lat,
        "current_lng": dispatch.current_lng,
        "pos_is_manual": dispatch.pos_is_manual,
        "active_approval_id": dispatch.active_approval_id,
        "completed_at": dispatch.completed_at,
        "created_at": dispatch.created_at,
        "updated_at": dispatch.updated_at,
    }


def _validate_sequence(db: Session, dispatch: models.Dispatch, target_milestone_id: str) -> None:
    target = db.query(models.DispatchMilestone).filter(models.DispatchMilestone.id == target_milestone_id).first()
    if not target:
        raise ValueError("Target milestone was not found.")
    if not dispatch.current_milestone_id and target.order_index != 1:
        raise ValueError("New dispatch must start at the first milestone.")
    if dispatch.current_milestone_id:
        current = db.query(models.DispatchMilestone).filter(models.DispatchMilestone.id == dispatch.current_milestone_id).first()
        if current and target.order_index != current.order_index + 1:
            raise ValueError(f"Invalid transition. Milestones must be completed sequentially (from {current.order_index} to {current.order_index + 1}).")


def _approved_request_exists(db: Session, dispatch_id: str, policy_id: str) -> bool:
    return db.query(models.ApprovalRequest).filter_by(dispatch_id=dispatch_id, policy_id=policy_id, status=models.ApprovalStatus.approved).first() is not None


def _materialize_pending_approval(db: Session, dispatch: models.Dispatch, actor_id: str, policy: models.PolicyRule, reason: str):
    approval = db.query(models.ApprovalRequest).filter_by(dispatch_id=dispatch.id, policy_id=policy.id, status=models.ApprovalStatus.pending).first()
    if approval:
        return approval
    approval = models.ApprovalRequest(dispatch_id=dispatch.id, policy_id=policy.id, requested_by=actor_id, request_reason=reason)
    db.add(approval)
    db.flush()
    event = models.GovernanceEvent(dispatch_id=dispatch.id, policy_id=policy.id, approval_request_id=approval.id, event_type=models.GovernanceStatus.pending_approval, severity=2, details={"policy_code": policy.policy_code}, raised_by=actor_id)
    dispatch.governance_status = models.GovernanceStatus.pending_approval
    dispatch.active_approval_id = approval.id
    db.add(event)
    db.flush()
    db.add(models.AuditLog(dispatch_id=dispatch.id, approval_request_id=approval.id, governance_event_id=event.id, updater_id=actor_id, override_type=models.OverrideType.governance_hold, reason=reason, snapshot={"policy_code": policy.policy_code}))
    db.commit()
    db.refresh(approval)
    return approval


def _validate_leg_timestamps(arrived_at, sailed_at) -> None:
    now = datetime.now(timezone.utc) + timedelta(minutes=5)
    if arrived_at and arrived_at > now:
        raise ValueError("Future arrival timestamps not allowed. Max grace is 5 minutes.")
    if sailed_at and sailed_at > now:
        raise ValueError("Future sailing timestamps not allowed. Max grace is 5 minutes.")
    if sailed_at and not arrived_at:
        raise ValueError("Sailed timestamp requires a matching arrival timestamp.")
    if arrived_at and sailed_at and sailed_at < arrived_at:
        raise ValueError("Sailed timestamp must occur at or after arrival.")
