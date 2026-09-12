from sqlalchemy import create_engine
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()