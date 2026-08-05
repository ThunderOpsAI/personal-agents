import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from src.storage.models import Base

NEON_DATABASE_URL = os.environ.get("NEON_DATABASE_URL")

if NEON_DATABASE_URL:
    if NEON_DATABASE_URL.startswith("postgres://"):
        NEON_DATABASE_URL = NEON_DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(NEON_DATABASE_URL)
    is_postgres = True
else:
    DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "life_os.db"))
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    engine = create_engine(f"sqlite:///{DB_PATH}")
    is_postgres = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    if is_postgres:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            conn.commit()
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
