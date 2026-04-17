from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..deps import require_db_connection

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("/", response_model=list[schemas.MilestoneRead])
def read_milestones(db: Session = Depends(require_db_connection)):
    return crud.get_milestones(db)
