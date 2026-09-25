from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# Reads DATABASE_URL from settings (sourced from .env) so switching between
# local SQLite and hosted Postgres (Supabase) is purely a .env change —
# no code edits needed.
DATABASE_URL = settings.database_url

# `connect_args` with check_same_thread is only valid/needed for SQLite —
# Postgres doesn't use or accept it, so only apply it conditionally.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_db():
    from app import models  # Ensure all models are registered
    Base.metadata.create_all(bind=engine)
    
    for col_sql in [
        "ALTER TABLE farms ADD COLUMN last_monitored_at TIMESTAMP",
        "ALTER TABLE farms ADD COLUMN is_demo BOOLEAN DEFAULT FALSE",
        "ALTER TABLE farms ADD COLUMN elevation FLOAT",
        "ALTER TABLE farms ADD COLUMN farmer_email VARCHAR",
        "ALTER TABLE farms ADD COLUMN size_hectares FLOAT",
        "ALTER TABLE farms ADD COLUMN location_name VARCHAR",
        "ALTER TABLE farms ADD COLUMN boundary_geojson JSON",
        "ALTER TABLE farms ADD COLUMN risk_zones JSON",
        "ALTER TABLE farms ADD COLUMN last_email_notification_at TIMESTAMP",
        "ALTER TABLE farms ADD COLUMN last_notified_risk_signature VARCHAR",
        "ALTER TABLE farms ADD COLUMN user_id VARCHAR",
    ]:
        try:
            with engine.begin() as conn:
                conn.execute(text(col_sql))
        except Exception:
            pass  # Column already exists or table already altered


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()