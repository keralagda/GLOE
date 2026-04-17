from datetime import datetime, timezone

from sqlalchemy.orm import Session

from . import models, schemas


def list_policies(db: Session):
    return db.query(models.PolicyRule).order_by(models.PolicyRule.policy_code).all()


def create_policy(db: Session, payload: schemas.PolicyRuleCreate):
    policy = models.PolicyRule(**payload.model_dump())
    db.add(policy)
    db.commit()
    db.refresh(policy)
    if policy.applies_to_milestone_id:
        binding = models.MilestonePolicyBinding(milestone_id=policy.applies_to_milestone_id, policy_id=policy.id)
        db.add(binding)
        db.commit()
    return policy


def list_approvals(db: Session, status: str | None = None):
    query = db.query(models.ApprovalRequest)
    if status:
        query = query.filter(models.ApprovalRequest.status == models.ApprovalStatus(status))
    return query.order_by(models.ApprovalRequest.created_at.desc()).all()


def create_approval_request(db: Session, payload: schemas.ApprovalRequestCreate, actor_id: str):
    approval = models.ApprovalRequest(requested_by=actor_id, **payload.model_dump())
    db.add(approval)
    db.flush()
    dispatch = db.query(models.Dispatch).filter(models.Dispatch.id == payload.dispatch_id).first()
    if dispatch:
        dispatch.governance_status = models.GovernanceStatus.pending_approval
        dispatch.active_approval_id = approval.id
    db.add(models.GovernanceEvent(dispatch_id=payload.dispatch_id, transshipment_leg_id=payload.transshipment_leg_id, policy_id=payload.policy_id, approval_request_id=approval.id, event_type=models.GovernanceStatus.pending_approval, severity=2, details={"source": "manual_request"}, raised_by=actor_id))
    db.commit()
    db.refresh(approval)
    return approval


def resolve_approval_request(db: Session, approval_id: str, payload: schemas.ApprovalDecision, actor_id: str):
    approval = db.query(models.ApprovalRequest).filter(models.ApprovalRequest.id == approval_id).first()
    if not approval:
        return None
    approval.status = payload.status
    approval.decision_reason = payload.decision_reason
    approval.decided_by = actor_id
    approval.decided_at = datetime.now(timezone.utc)
    dispatch = db.query(models.Dispatch).filter(models.Dispatch.id == approval.dispatch_id).first()
    position_snapshot = {"position_choice": payload.position_choice}
    if dispatch:
        dispatch.active_approval_id = None
        dispatch.governance_status = models.GovernanceStatus.clear if payload.status == models.ApprovalStatus.approved else models.GovernanceStatus.correction_required
        if payload.status == models.ApprovalStatus.approved:
            _apply_position_choice(db, dispatch, approval.milestone_id, payload.position_choice, actor_id, payload.decision_reason, position_snapshot)
    event_type = models.GovernanceStatus.clear if payload.status == models.ApprovalStatus.approved else models.GovernanceStatus.correction_required
    event = models.GovernanceEvent(dispatch_id=approval.dispatch_id, transshipment_leg_id=approval.transshipment_leg_id, policy_id=approval.policy_id, approval_request_id=approval.id, event_type=event_type, severity=1 if payload.status == models.ApprovalStatus.approved else 2, details={"decision": payload.status.value, **position_snapshot}, raised_by=approval.requested_by, resolved_by=actor_id, resolved_at=approval.decided_at)
    db.add(event)
    db.flush()
    receipt = db.query(models.ApprovalReceipt).filter(models.ApprovalReceipt.request_id == approval.id, models.ApprovalReceipt.role == "decision", models.ApprovalReceipt.user_id == actor_id).first()
    if receipt:
        receipt.comment = payload.decision_reason
        receipt.metadata_json = position_snapshot
    else:
        db.add(models.ApprovalReceipt(request_id=approval.id, role="decision", user_id=actor_id, comment=payload.decision_reason, metadata_json=position_snapshot))
    db.add(models.AuditLog(dispatch_id=approval.dispatch_id, transshipment_leg_id=approval.transshipment_leg_id, approval_request_id=approval.id, governance_event_id=event.id, updater_id=actor_id, override_type=models.OverrideType.approval_resolution, reason=payload.decision_reason, snapshot={"decision": payload.status.value, **position_snapshot}))
    db.commit()
    db.refresh(approval)
    return approval


def _apply_position_choice(db: Session, dispatch: models.Dispatch, milestone_id: str | None, position_choice: str | None, actor_id: str, decision_reason: str | None, position_snapshot: dict):
    choice = position_choice or "snap"
    position_snapshot["position_choice"] = choice
    if choice == "keep":
        dispatch.pos_is_manual = True
        return
    milestone = db.query(models.DispatchMilestone).filter(models.DispatchMilestone.id == milestone_id).first() if milestone_id else dispatch.current_milestone
    if not milestone or milestone.default_lat is None or milestone.default_lng is None:
        position_snapshot["position_choice_result"] = "no_default_coordinates"
        return
    dispatch.current_lat = milestone.default_lat
    dispatch.current_lng = milestone.default_lng
    dispatch.pos_is_manual = False
    position_snapshot["current_lat"] = milestone.default_lat
    position_snapshot["current_lng"] = milestone.default_lng
    db.add(models.PositionHistory(dispatch_id=dispatch.id, user_id=actor_id, lat=milestone.default_lat, lng=milestone.default_lng, reason=decision_reason or "Approved with snap position choice."))


def list_governance_events(db: Session, dispatch_id: str | None = None):
    query = db.query(models.GovernanceEvent)
    if dispatch_id:
        query = query.filter(models.GovernanceEvent.dispatch_id == dispatch_id)
    return query.order_by(models.GovernanceEvent.created_at.desc()).all()
