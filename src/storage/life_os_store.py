"""
Persistent State Store for Rumble OS.

Manages data storage in Neon PostgreSQL / SQLite for:
  • `MasterLifeBrief` snapshots & historical trends
  • Active and resolved `LifeAlert` queue
  • Structured `ActionItemRecord` tasks with persistence & routing
  • `SymptomPainState` scheduled tracking (9 AM, 12 PM, 3 PM, 9 PM)
  • Medical Markdown Export for doctor appointments (`agent_reports/`)
"""

from __future__ import annotations

import json
import sqlite3
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from sqlalchemy import text
from src.storage.db import engine, init_db, is_postgres
from src.schemas.life_os import (
    ActionCategory,
    ActionItemRecord,
    AlertCategory,
    AlertSeverity,
    LifeAlert,
    MasterLifeBrief,
    SymptomPainState,
)

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "life_os.db"
REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "agent_reports"


class LifeOSStore:
    """Persistence engine for Rumble OS Master Briefs, Alert Engine, and Symptom Tracking."""

    def __init__(self, db_path: Optional[str | Path] = None) -> None:
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        """Initialize database schema tables via SQLAlchemy init_db."""
        init_db()

    def save_brief(self, brief: MasterLifeBrief) -> int:
        """Persist a new MasterLifeBrief snapshot and save its active alerts and action items."""
        now_iso = brief.timestamp or datetime.now(timezone.utc).isoformat()
        brief_json = brief.model_dump_json()

        with engine.connect() as conn:
            stmt = text("""
                INSERT INTO master_briefs (timestamp, date, headline_summary, raw_brief_json)
                VALUES (:timestamp, :date, :headline_summary, :raw_brief_json)
            """)
            conn.execute(stmt, {
                "timestamp": now_iso,
                "date": brief.date,
                "headline_summary": brief.headline_summary,
                "raw_brief_json": brief_json,
            })
            conn.commit()

            # Retrieve inserted ID
            res = conn.execute(text("SELECT id FROM master_briefs ORDER BY id DESC LIMIT 1"))
            row = res.mappings().first()
            brief_id = row["id"] if row else 1

        for alert in brief.active_alerts:
            self.save_alert(alert)

        for item in brief.action_records:
            self.save_action_item(item, brief_id=brief_id)

        if brief.symptom_state:
            self.log_symptoms(brief.symptom_state)

        return brief_id

    def log_symptoms(self, state: SymptomPainState) -> SymptomPainState:
        """Record a structured anatomical pain log entry."""
        now_iso = state.timestamp or datetime.now(timezone.utc).isoformat()
        symptoms_json = json.dumps(state.active_symptoms)

        with engine.connect() as conn:
            stmt = text("""
                INSERT INTO symptom_logs (timestamp, date, time_slot, total_pain_level, primary_generator, primary_percentage, active_symptoms_json, notes)
                VALUES (:timestamp, :date, :time_slot, :total_pain_level, :primary_generator, :primary_percentage, :active_symptoms_json, :notes)
            """)
            conn.execute(stmt, {
                "timestamp": now_iso,
                "date": state.date,
                "time_slot": state.time_slot,
                "total_pain_level": state.total_pain_level,
                "primary_generator": state.primary_generator,
                "primary_percentage": state.primary_percentage,
                "active_symptoms_json": symptoms_json,
                "notes": state.notes or "",
            })
            conn.commit()

            res = conn.execute(text("SELECT id FROM symptom_logs ORDER BY id DESC LIMIT 1"))
            row = res.mappings().first()
            record_id = row["id"] if row else 1
            state.id = record_id

        self.export_medical_report_markdown()
        return state

    def get_latest_symptoms(self) -> SymptomPainState:
        """Fetch the most recent symptom/pain record."""
        with engine.connect() as conn:
            res = conn.execute(text("SELECT * FROM symptom_logs ORDER BY id DESC LIMIT 1"))
            row = res.mappings().first()
            if not row:
                return SymptomPainState(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    date=datetime.now().strftime("%Y-%m-%d"),
                    time_slot="baseline",
                    total_pain_level=0,
                    primary_generator="None",
                    primary_percentage=0,
                    active_symptoms=[],
                    notes="",
                )
            return SymptomPainState(
                id=row["id"],
                timestamp=row["timestamp"],
                date=row["date"],
                time_slot=row["time_slot"],
                total_pain_level=row["total_pain_level"],
                primary_generator=row["primary_generator"],
                primary_percentage=row["primary_percentage"],
                active_symptoms=json.loads(row["active_symptoms_json"]),
                notes=row["notes"] or "",
            )

    def get_symptoms_history(self, limit: int = 20) -> list[SymptomPainState]:
        """Fetch historical symptom records."""
        with engine.connect() as conn:
            res = conn.execute(text("SELECT * FROM symptom_logs ORDER BY id DESC LIMIT :limit"), {"limit": limit})
            rows = res.mappings().all()
            return [
                SymptomPainState(
                    id=r["id"],
                    timestamp=r["timestamp"],
                    date=r["date"],
                    time_slot=r["time_slot"],
                    total_pain_level=r["total_pain_level"],
                    primary_generator=r["primary_generator"],
                    primary_percentage=r["primary_percentage"],
                    active_symptoms=json.loads(r["active_symptoms_json"]),
                    notes=r["notes"] or "",
                )
                for r in rows
            ]

    def export_medical_report_markdown(self) -> Path:
        """Generate structured markdown symptom report for clinical/doctor review in agent_reports/."""
        history = self.get_symptoms_history(limit=30)
        report_path = REPORTS_DIR / "medical_symptom_report.md"

        lines = [
            "# Clinical Symptom & Anatomical Pain Tracking Report",
            f"> **Generated Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "> **Patient ID**: Self-Tracked Rumble OS Log",
            "",
            "## Scheduled 3-Hour Pain Tracking Logs (9 AM, 12 PM, 3 PM, 9 PM)",
            "",
            "| Date | Time Slot | Overall Pain (1-10) | Primary Generator | Generator Weight | Active Anatomical Symptoms | Notes |",
            "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
        ]

        if not history:
            lines.append("| N/A | Baseline | 0/10 | None | 0% | No pain logs recorded | None |")
        else:
            for s in history:
                symptoms_str = ", ".join(s.active_symptoms) if s.active_symptoms else "None"
                lines.append(
                    f"| {s.date} | {s.time_slot} | **{s.total_pain_level}/10** | {s.primary_generator} | {s.primary_percentage}% | {symptoms_str} | {s.notes or 'N/A'} |"
                )

        report_path.write_text("\n".join(lines), encoding="utf-8")
        return report_path

    def save_alert(self, alert: LifeAlert) -> None:
        """Insert or update a LifeAlert."""
        alert_id = alert.id or f"alert_{datetime.now(timezone.utc).timestamp()}"
        with engine.connect() as conn:
            if is_postgres:
                stmt = text("""
                    INSERT INTO alerts (id, timestamp, severity, category, title, summary, action_required, resolved)
                    VALUES (:id, :timestamp, :severity, :category, :title, :summary, :action_required, :resolved)
                    ON CONFLICT (id) DO UPDATE SET
                    timestamp = EXCLUDED.timestamp, severity = EXCLUDED.severity, category = EXCLUDED.category,
                    title = EXCLUDED.title, summary = EXCLUDED.summary, action_required = EXCLUDED.action_required,
                    resolved = EXCLUDED.resolved
                """)
            else:
                stmt = text("""
                    INSERT OR REPLACE INTO alerts (id, timestamp, severity, category, title, summary, action_required, resolved)
                    VALUES (:id, :timestamp, :severity, :category, :title, :summary, :action_required, :resolved)
                """)

            conn.execute(stmt, {
                "id": alert_id,
                "timestamp": alert.timestamp,
                "severity": alert.severity.value,
                "category": alert.category.value,
                "title": alert.title,
                "summary": alert.summary,
                "action_required": alert.action_required,
                "resolved": 1 if alert.resolved else 0,
            })
            conn.commit()

    def save_action_item(self, item: ActionItemRecord, brief_id: Optional[int] = None) -> None:
        """Insert or update an ActionItemRecord."""
        with engine.connect() as conn:
            if is_postgres:
                stmt = text("""
                    INSERT INTO action_items (id, brief_id, text, category, completed, linked_id, spoon_cost)
                    VALUES (:id, :brief_id, :text, :category, :completed, :linked_id, :spoon_cost)
                    ON CONFLICT (id) DO UPDATE SET
                    brief_id = EXCLUDED.brief_id, text = EXCLUDED.text, category = EXCLUDED.category,
                    completed = EXCLUDED.completed, linked_id = EXCLUDED.linked_id, spoon_cost = EXCLUDED.spoon_cost
                """)
            else:
                stmt = text("""
                    INSERT OR REPLACE INTO action_items (id, brief_id, text, category, completed, linked_id, spoon_cost)
                    VALUES (:id, :brief_id, :text, :category, :completed, :linked_id, :spoon_cost)
                """)

            conn.execute(stmt, {
                "id": item.id,
                "brief_id": brief_id,
                "text": item.text,
                "category": item.category.value,
                "completed": 1 if item.completed else 0,
                "linked_id": item.linked_id,
                "spoon_cost": 0.0,
            })
            conn.commit()

    def resolve_alert(self, alert_id: str) -> bool:
        """Mark an alert as resolved."""
        with engine.connect() as conn:
            stmt = text("UPDATE alerts SET resolved = 1 WHERE id = :alert_id")
            res = conn.execute(stmt, {"alert_id": alert_id})
            conn.commit()
            return res.rowcount > 0

    def toggle_action_item(self, item_id: str, completed: bool) -> tuple[bool, Optional[ActionItemRecord]]:
        """Toggle an action item's completion status."""
        with engine.connect() as conn:
            stmt = text("UPDATE action_items SET completed = :completed WHERE id = :item_id")
            res = conn.execute(stmt, {"completed": 1 if completed else 0, "item_id": item_id})
            conn.commit()
            if res.rowcount == 0:
                return False, None

            res_item = conn.execute(text("SELECT * FROM action_items WHERE id = :item_id"), {"item_id": item_id})
            r = res_item.mappings().first()
            if not r:
                return True, None

            item = ActionItemRecord(
                id=r["id"],
                text=r["text"],
                category=ActionCategory(r["category"]),
                completed=bool(r["completed"]),
                linked_id=r["linked_id"],
            )
            return True, item

    def get_active_alerts(self) -> list[LifeAlert]:
        """Fetch all unresolved alerts ordered by severity and timestamp."""
        with engine.connect() as conn:
            res = conn.execute(text("SELECT * FROM alerts WHERE resolved = 0 ORDER BY timestamp DESC"))
            rows = res.mappings().all()

        alerts = []
        for r in rows:
            alerts.append(
                LifeAlert(
                    id=r["id"],
                    timestamp=r["timestamp"],
                    severity=AlertSeverity(r["severity"]),
                    category=AlertCategory(r["category"]),
                    title=r["title"],
                    summary=r["summary"],
                    action_required=r["action_required"],
                    resolved=bool(r["resolved"]),
                )
            )
        return alerts

    def get_latest_brief(self) -> Optional[MasterLifeBrief]:
        """Fetch the most recent MasterLifeBrief snapshot."""
        with engine.connect() as conn:
            res = conn.execute(text("SELECT * FROM master_briefs ORDER BY id DESC LIMIT 1"))
            row = res.mappings().first()
            if not row:
                return None
            data = json.loads(row["raw_brief_json"])
            brief = MasterLifeBrief.model_validate(data)
            brief.id = row["id"]

            brief.active_alerts = self.get_active_alerts()
            brief.symptom_state = self.get_latest_symptoms()
            return brief
