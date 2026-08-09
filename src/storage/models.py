import uuid
from sqlalchemy import Column, Integer, String, Text, Date, DateTime, JSON, Boolean, Float
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

class MasterBriefModel(Base):
    __tablename__ = 'master_briefs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, nullable=False)
    date = Column(String, nullable=False)
    headline_summary = Column(Text, nullable=False)
    raw_brief_json = Column(Text, nullable=False)

class AlertModel(Base):
    __tablename__ = 'alerts'

    id = Column(String, primary_key=True)
    timestamp = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    action_required = Column(Text, nullable=False)
    resolved = Column(Integer, default=0)

class ActionItemModel(Base):
    __tablename__ = 'action_items'

    id = Column(String, primary_key=True)
    brief_id = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    completed = Column(Integer, default=0)
    linked_id = Column(String, nullable=True)
    spoon_cost = Column(Float, default=0.0)

class SymptomLogModel(Base):
    __tablename__ = 'symptom_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, nullable=False)
    date = Column(String, nullable=False)
    time_slot = Column(String, nullable=False)
    total_pain_level = Column(Integer, nullable=False)
    primary_generator = Column(String, nullable=False)
    primary_percentage = Column(Integer, nullable=False)
    active_symptoms_json = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)

class BudgetEntryModel(Base):
    __tablename__ = 'budget_entries'

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
