import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import crud, models
from .api import dispatches, governance, milestones
from .database import SessionLocal, engine, ensure_sqlite_dev_schema

models.Base.metadata.create_all(bind=engine)
ensure_sqlite_dev_schema(engine)
with SessionLocal() as db:
    crud.ensure_reference_data(db)

app = FastAPI(title="Tazy Logistics Governance API")
origins = [item.strip() for item in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if item.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PATCH"], allow_headers=["Content-Type", "X-Actor-Id"])
app.include_router(milestones.router)
app.include_router(dispatches.router)
app.include_router(governance.router)


@app.get("/")
def read_root():
    return {"message": "Tazy Logistics Governance API online"}
