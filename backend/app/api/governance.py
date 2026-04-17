from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import governance_crud, schemas
from ..deps import require_actor_id, require_db_connection

router = APIRouter(tags=["governance"])


@router.get("/policies/", response_model=list[schemas.PolicyRuleRead])
def read_policies(db: Session = Depends(require_db_connection)):
    return governance_crud.list_policies(db)


@router.post("/policies/", response_model=schemas.PolicyRuleRead, status_code=status.HTTP_201_CREATED)
def create_policy(
    payload: schemas.PolicyRuleCreate,
    actor_id: str = Depends(require_actor_id),
    db: Session = Depends(require_db_connection),
):
    del actor_id
    return governance_crud.create_policy(db, payload)


@router.get("/approvals/", response_model=list[schemas.ApprovalRequestRead])
def read_approvals(status_filter: str | None = Query(default=None, alias="status"), db: Session = Depends(require_db_connection)):
    return governance_crud.list_approvals(db, status_filter)


@router.post("/approvals/", response_model=schemas.ApprovalRequestRead, status_code=status.HTTP_201_CREATED)
def create_approval(
    payload: schemas.ApprovalRequestCreate,
    actor_id: str = Depends(require_actor_id),
    db: Session = Depends(require_db_connection),
):
    return governance_crud.create_approval_request(db, payload, actor_id)


@router.patch("/approvals/{approval_id}/decision", response_model=schemas.ApprovalRequestRead)
def resolve_approval(
    approval_id: str,
    payload: schemas.ApprovalDecision,
    actor_id: str = Depends(require_actor_id),
    db: Session = Depends(require_db_connection),
):
    record = governance_crud.resolve_approval_request(db, approval_id, payload, actor_id)
    if not record:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return record


@router.get("/governance/events/", response_model=list[schemas.GovernanceEventRead])
def read_governance_events(dispatch_id: str | None = None, db: Session = Depends(require_db_connection)):
    return governance_crud.list_governance_events(db, dispatch_id)
