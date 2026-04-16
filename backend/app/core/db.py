"""RS Method - Database Controller v2.0.0"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

from app.core.settings import settings
from app.core.logger import logger


engine = create_engine(
    settings.DB_URL,
    pool_recycle=86400,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_timeout=60,
    connect_args={"connect_timeout": 60},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def verify_connection():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        raise


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def set_tenant_context(db: Session, tenant_id: str):
    db.execute(text("SET app.current_tenant_id = :tid"), {"tid": tenant_id})
