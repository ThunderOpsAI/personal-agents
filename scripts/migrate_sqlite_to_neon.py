import sqlite3
import os
import json
from datetime import datetime, timezone
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.storage.db import SessionLocal, init_db
from src.storage.models import SpoonLog, MedicalLog

def migrate_spoon_store():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "spoon_store.db"))
    if not os.path.exists(db_path):
        print(f"Spoon store db not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM state_logs")
        rows = cursor.fetchall()
        
        with SessionLocal() as db:
            for row in rows:
                dt_str = row["timestamp"].replace('Z', '+00:00') if row["timestamp"] else None
                dt = datetime.fromisoformat(dt_str) if dt_str else datetime.now(timezone.utc)
                log = SpoonLog(
                    date=dt.date(),
                    budget=int(row["total_spoons"]),
                    spent=int(row["total_spoons"] - row["spoons_remaining"]),
                    remaining=int(row["spoons_remaining"]),
                    details={
                        "focus_state": row["focus_state"], 
                        "pain_level": row["pain_level"],
                        "notes": row["notes"]
                    },
                    updated_at=dt
                )
                db.add(log)
            db.commit()
        print("Migrated SpoonLog")
    except sqlite3.OperationalError:
        print("state_logs table not found in spoon_store.db")

def migrate_life_os():
    db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "life_os.db"))
    if not os.path.exists(db_path):
        print(f"Life OS db not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM symptom_logs")
        rows = cursor.fetchall()
        
        with SessionLocal() as db:
            for row in rows:
                dt_str = row["timestamp"].replace('Z', '+00:00') if row["timestamp"] else None
                dt = datetime.fromisoformat(dt_str) if dt_str else datetime.now(timezone.utc)
                log = MedicalLog(
                    timestamp=dt,
                    symptom=row["primary_generator"],
                    severity=row["total_pain_level"],
                    side="Unknown",
                    context=row["active_symptoms_json"],
                    notes=row["notes"]
                )
                db.add(log)
            db.commit()
        print("Migrated MedicalLog")
    except sqlite3.OperationalError:
        print("symptom_logs table not found in life_os.db")

if __name__ == "__main__":
    init_db()
    migrate_spoon_store()
    migrate_life_os()
    print("Migration complete")
