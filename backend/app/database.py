import os

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./logistics.db")
CONNECT_ARGS = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, future=True, connect_args=CONNECT_ARGS)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_db_connection(db) -> None:
    db.execute(text("SELECT 1"))


def ensure_sqlite_dev_schema(engine: Engine) -> None:
    if not str(engine.url).startswith("sqlite"):
        return

    column_map = {
        "dispatch_milestones": {
            "default_lat": "ALTER TABLE dispatch_milestones ADD COLUMN default_lat FLOAT",
            "default_lng": "ALTER TABLE dispatch_milestones ADD COLUMN default_lng FLOAT",
        },
        "dispatches": {
            "current_lat": "ALTER TABLE dispatches ADD COLUMN current_lat FLOAT",
            "current_lng": "ALTER TABLE dispatches ADD COLUMN current_lng FLOAT",
            "pos_is_manual": "ALTER TABLE dispatches ADD COLUMN pos_is_manual BOOLEAN NOT NULL DEFAULT 0",
        },
    }

    with engine.begin() as conn:
        for table_name, columns in column_map.items():
            existing = {row[1] for row in conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()}
            for column_name, ddl in columns.items():
                if column_name not in existing:
                    conn.execute(text(ddl))
