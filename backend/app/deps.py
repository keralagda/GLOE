from uuid import UUID

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .database import get_db, verify_db_connection


def require_db_connection(db: Session = Depends(get_db)):
    try:
        verify_db_connection(db)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Database connection unavailable: {exc}") from exc
    return db


def require_actor_id(x_actor_id: str = Header(..., alias="X-Actor-Id")) -> str:
    try:
        UUID(x_actor_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="X-Actor-Id must be a valid UUID.") from exc
    return x_actor_id
