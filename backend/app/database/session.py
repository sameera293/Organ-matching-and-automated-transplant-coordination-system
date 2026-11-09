"""Database session management for the configured SQLAlchemy database."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.app.config import settings

Base = declarative_base()

def get_engine():
    if settings.DATABASE_URL.startswith("sqlite"):
        return create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
    return create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_recycle=3600)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
