import uuid
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.types import TypeDecorator
from pgvector.sqlalchemy import Vector

Base = declarative_base()

class JSONVariant(TypeDecorator):
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(JSON())

class MemoryEmbedding(Base):
    __tablename__ = 'memory_embeddings'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    vector = Column(Vector(1536))
    content = Column(Text)
    metadata_ = Column("metadata", JSONVariant)
    created_at = Column(DateTime)

class SpoonLog(Base):
    __tablename__ = 'spoon_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date)
    budget = Column(Integer)
    spent = Column(Integer)
    remaining = Column(Integer)
    details = Column(JSONVariant)
    updated_at = Column(DateTime)

class MedicalLog(Base):
    __tablename__ = 'medical_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime)
    symptom = Column(String)
    area = Column(String)
    side = Column(String)
    severity = Column(Integer)
    context = Column(Text)
    notes = Column(Text)

class PersistentNote(Base):
    __tablename__ = 'persistent_notes'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text)
    author = Column(String, default="user")
    updated_at = Column(DateTime)

class ProtocolRun(Base):
    __tablename__ = 'protocol_runs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    protocol_name = Column(String)
    status = Column(String)
    step_completed = Column(Integer)
    timestamp = Column(DateTime)

class DashboardUsageLog(Base):
    __tablename__ = 'dashboard_usage_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    widget_name = Column(String)
    action_type = Column(String)
    context = Column(JSONVariant)
    timestamp = Column(DateTime)

