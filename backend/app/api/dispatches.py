from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import require_actor_id, require_db_connection

router = APIRouter(prefix="/dispatches", tags=["dispatches"])


@router.get("/dashboard", response_model=schemas.DispatchDashboard)
def read_dashboard(db: Session = Depends(require_db_connection)):
    return crud.get_dashboard_metrics(db)


@router.get("/", response_model=schemas.DispatchListResponse)
def read_dispatches(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=25, ge=1, le=50),
    origin: str | None = None,
    destination: str | None = None,
    carrier: str | None = None,
    phase: str | None = None,
    governance_status: str | None = None,
    sort_by: str = Query(default="created_at"),
    sort_dir: str = Query(default="desc"),
    db: Session = Depends(require_db_connection),
):
    return crud.list_dispatches(db, page, limit, origin, destination, carrier, phase, governance_status, sort_by, sort_dir)


@router.post("/", response_model=schemas.DispatchRead, status_code=status.HTTP_201_CREATED)
def create_dispatch(payload: schemas.DispatchCreate, db: Session = Depends(require_db_connection)):
    return crud.create_dispatch(db, payload)


@router.patch("/{dispatch_id}/status", response_model=schemas.DispatchRead)
def update_status(
    dispatch_id: str,
    payload: schemas.DispatchUpdate,
    actor_id: str = Depends(require_actor_id),
    db: Session = Depends(require_db_connection),
):
    try:
        record = crud.update_dispatch_status(db, dispatch_id, payload, actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not record:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return record


@router.get("/{dispatch_id}/transshipments", response_model=list[schemas.TransshipmentLegRead])
def read_transshipments(dispatch_id: str, db: Session = Depends(require_db_connection)):
    return crud.list_transshipment_legs(db, dispatch_id)


@router.post("/{dispatch_id}/transshipments", response_model=schemas.TransshipmentLegRead, status_code=status.HTTP_201_CREATED)
def create_transshipment(
    dispatch_id: str,
    payload: schemas.TransshipmentLegCreate,
    actor_id: str = Depends(require_actor_id),
    db: Session = Depends(require_db_connection),
):
    try:
        record = crud.create_transshipment_leg(db, dispatch_id, payload, actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not record:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return record
