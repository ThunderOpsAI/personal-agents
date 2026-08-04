"""
Persistent SQLite State Store for Rumble OS.

Manages data storage in `data/life_os.db` for:
  • `MasterLifeBrief` snapshots & historical trends
  • Active and resolved `LifeAlert` queue
  • Structured `ActionItemRecord` tasks with persistence & routing
  • `SymptomPainState` scheduled tracking (9 AM, 12 PM, 3 PM, 9 PM)
  • Medical Markdown Export for doctor appointments (`agent_reports/`)
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

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
    """SQLite persistence engine for Rumble OS Master Briefs, Alert Engine, and Symptom Tracking."""

    def __init__(self, db_path: Optional[str | Path] = None) -> None:
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initialize database schema tables."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS master_briefs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL,
                    headline_summary TEXT NOT NULL,
                    raw_brief_json TEXT NOT NULL
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS alerts (
                    id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    category TEXT NOT NULL,
                    title TEXT NOT NULL,
                    summary TEXT NOT NULL,
                    action_required TEXT NOT NULL,
                    resolved INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS action_items (
                    id TEXT PRIMARY KEY,
                    brief_id INTEGER,
                    text TEXT NOT NULL,
                    category TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 0,
                    linked_id TEXT,
                    spoon_cost REAL NOT NULL DEFAULT 0.0
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS symptom_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time_slot TEXT NOT NULL,
                    total_pain_level INTEGER NOT NULL,
                    primary_generator TEXT NOT NULL,
                    primary_percentage INTEGER NOT NULL,
                    active_symptoms_json TEXT NOT NULL,
                    notes TEXT
                )
                """
            )
            conn.commit()

    def save_brief(self, brief: MasterLifeBrief) -> int:
        """Persist a new MasterLifeBrief snapshot and save its active alerts and action items."""
        now_iso = brief.timestamp or datetime.now(timezone.utc).isoformat()
        brief_json = brief.model_dump_json()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO master_briefs (timestamp, date, headline_summary, raw_brief_json)
                VALUES (?, ?, ?, ?)
                """,
                (now_iso, brief.date, brief.headline_summary, brief_json),
            )
            brief_id = cursor.lastrowid
            conn.commit()

        # Save active alerts
        for alert in brief.active_alerts:
            self.save_alert(alert)

        # Save action records
        for item in brief.action_records:
            self.save_action_item(item, brief_id=brief_id)

        # Log symptom state
        if brief.symptom_state:
            self.log_symptoms(brief.symptom_state)

        return brief_id

    def log_symptoms(self, state: SymptomPainState) -> SymptomPainState:
        """Record a structured 3-hour anatomical pain log entry in SQLite."""
        now_iso = state.timestamp or datetime.now(timezone.utc).isoformat()
        symptoms_json = json.dumps(state.active_symptoms)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO symptom_logs (timestamp, date, time_slot, total_pain_level, primary_generator, primary_percentage, active_symptoms_json, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    now_iso,
                    state.date,
                    state.time_slot,
                    state.total_pain_level,
                    state.primary_generator,
                    state.primary_percentage,
                    symptoms_json,
                    state.notes or "",
                ),
            )
            conn.commit()
            record_id = cursor.lastrowid
            state.id = record_id

        self.export_medical_report_markdown()
        return state

    def get_latest_symptoms(self) -> SymptomPainState:
        """Fetch the most recent symptom/pain record."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM symptom_logs ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
            if not row:
                # Default baseline record
                return SymptomPainState(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    date=datetime.now().strftime("%Y-%m-%d"),
                    time_slot="12:00 PM",
                    total_pain_level=5,
                    primary_generator="Right Lumbar Pain",
                    primary_percentage=85,
                    active_symptoms=["Right Lumbar Pain", "Cervical Spine Pain", "Right Shoulder Pain", "Left Knee Pain", "Right Ankle Pain"],
                    notes="Baseline pain tracking initialized.",
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
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM symptom_logs ORDER BY id DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
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

        for s in history:
            symptoms_str = ", ".join(s.active_symptoms)
            lines.append(
                f"| {s.date} | {s.time_slot} | **{s.total_pain_level}/10** | {s.primary_generator} | {s.primary_percentage}% | {symptoms_str} | {s.notes or 'N/A'} |"
            )

        report_path.write_text("\n".join(lines), encoding="utf-8")
        return report_path

    def save_alert(self, alert: LifeAlert) -> None:
        """Insert or update a LifeAlert in SQLite."""
        alert_id = alert.id or f"alert_{datetime.now(timezone.utc).timestamp()}"
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO alerts (id, timestamp, severity, category, title, summary, action_required, resolved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    alert_id,
                    alert.timestamp,
                    alert.severity.value,
                    alert.category.value,
                    alert.title,
                    alert.summary,
                    alert.action_required,
                    1 if alert.resolved else 0,
                ),
            )
            conn.commit()

    def save_action_item(self, item: ActionItemRecord, brief_id: Optional[int] = None) -> None:
        """Insert or update an ActionItemRecord in SQLite."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO action_items (id, brief_id, text, category, completed, linked_id, spoon_cost)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.id,
                    brief_id,
                    item.text,
                    item.category.value,
                    1 if item.completed else 0,
                    item.linked_id,
                    0.0,
                ),
            )
            conn.commit()

    def resolve_alert(self, alert_id: str) -> bool:
        """Mark an alert as resolved."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE alerts SET resolved = 1 WHERE id = ?",
                (alert_id,),
            )
            conn.commit()
            return cursor.rowcount > 0

    def toggle_action_item(self, item_id: str, completed: bool) -> tuple[bool, Optional[ActionItemRecord]]:
        """Toggle an action item's completion status."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE action_items SET completed = ? WHERE id = ?",
                (1 if completed else 0, item_id),
            )
            conn.commit()
            if cursor.rowcount == 0:
                return False, None

            cursor.execute("SELECT * FROM action_items WHERE id = ?", (item_id,))
            r = cursor.fetchone()
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
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM alerts WHERE resolved = 0 ORDER BY timestamp DESC"
            )
            rows = cursor.fetchall()

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
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM master_briefs ORDER BY id DESC LIMIT 1"
            )
            row = cursor.fetchone()
            if not row:
                return None
            data = json.loads(row["raw_brief_json"])
            brief = MasterLifeBrief.model_validate(data)
            brief.id = row["id"]

            # Merge live database alerts into active_alerts
            brief.active_alerts = self.get_active_alerts()
            brief.symptom_state = self.get_latest_symptoms()
            return brief
