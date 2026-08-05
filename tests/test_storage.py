import os
import sys
from datetime import datetime, timezone

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.storage.db import init_db, get_db, SessionLocal
from src.storage.models import SpoonLog, MedicalLog, MemoryEmbedding
from src.storage.neon_store import NeonSpoonStore, NeonLifeOSStore
from src.schemas.life_os import SymptomPainState

def test_db_init():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'life_os.db'))
    if os.path.exists(db_path):
        os.remove(db_path)
    init_db()
    assert True

def test_spoon_store():
    store = NeonSpoonStore()
    state = store.log_state(pain_level=3, focus_state="hyperfocus", total_spoons=15, spoons_remaining=10, notes="Test")
    assert state.pain_level == 3
    assert state.focus_state == "hyperfocus"
    assert state.total_spoons == 15.0
    assert state.spoons_remaining == 10.0
    assert state.notes == "Test"

    # Test spend
    state = store.spend_spoons(2.0, "coding")
    assert state.spoons_remaining == 8.0

def test_life_os_store():
    store = NeonLifeOSStore()
    symptom_state = SymptomPainState(
        timestamp=datetime.now(timezone.utc).isoformat(),
        date=datetime.now().strftime("%Y-%m-%d"),
        time_slot="12:00 PM",
        total_pain_level=7,
        primary_generator="Test Pain",
        primary_percentage=80,
        active_symptoms=["Test Pain"],
        notes="Testing"
    )
    saved = store.log_symptoms(symptom_state)
    assert saved.id is not None
    
    latest = store.get_latest_symptoms()
    assert latest.total_pain_level == 7
    assert latest.primary_generator == "Test Pain"

def test_memory_embedding():
    with SessionLocal() as db:
        mem = MemoryEmbedding(
            content="test content",
            vector=[0.1] * 1536,
            metadata_={"tag": "test"}
        )
        db.add(mem)
        db.commit()
        
        assert mem.id is not None
if __name__ == "__main__":
    test_db_init()
    test_spoon_store()
    test_life_os_store()
    test_memory_embedding()
    print("All tests passed!")
