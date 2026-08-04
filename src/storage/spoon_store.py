"""
Spoon-Theory, ADHD Focus, and Chronic Pain SQLite State Store.

Provides a persistent local SQLite storage interface to track:
  • ADHD Focus State (e.g., 'hyperfocus', 'balanced', 'brain_fog', 'executive_dysfunction')
  • Chronic Pain Level (integer rating 1-10)
  • Spoon Energy Budget (total, spent, remaining spoons & activity logs)
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from pydantic import BaseModel, Field

# Default path for the SQLite database
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "spoon_store.db"


class DailySpoonState(BaseModel):
    """Pydantic model representing current mental health & energy state."""

    id: Optional[int] = Field(default=None, description="Primary key ID in database")
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp",
    )
    pain_level: int = Field(..., ge=1, le=10, description="Chronic pain rating from 1 (minimal) to 10 (severe)")
    focus_state: str = Field(..., description="ADHD focus status (e.g. 'balanced', 'hyperfocus', 'brain_fog')")
    total_spoons: float = Field(default=12.0, ge=0.0, description="Total daily spoon capacity")
    spoons_remaining: float = Field(default=12.0, ge=0.0, description="Currently available spoons")
    notes: Optional[str] = Field(default="", description="Context notes or symptom descriptions")


class SpoonStore:
    """SQLite state store for Spoon-Theory energy budgets and daily focus/pain logs."""

    def __init__(self, db_path: Optional[str | Path] = None) -> None:
        self.db_path = Path(db_path) if db_path else DEFAULT_DB_PATH
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initialise database tables if they do not exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS state_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    pain_level INTEGER NOT NULL,
                    focus_state TEXT NOT NULL,
                    total_spoons REAL NOT NULL,
                    spoons_remaining REAL NOT NULL,
                    notes TEXT
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    activity TEXT NOT NULL,
                    spoon_cost REAL NOT NULL,
                    spoons_after REAL NOT NULL
                )
                """
            )
            conn.commit()

    def log_state(
        self,
        pain_level: int,
        focus_state: str,
        total_spoons: float = 12.0,
        spoons_remaining: Optional[float] = None,
        notes: str = "",
    ) -> DailySpoonState:
        """Record a new daily state snapshot."""
        if not (1 <= pain_level <= 10):
            raise ValueError("pain_level must be between 1 and 10")
        
        remaining = spoons_remaining if spoons_remaining is not None else total_spoons
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO state_logs (timestamp, pain_level, focus_state, total_spoons, spoons_remaining, notes)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (now_iso, pain_level, focus_state, total_spoons, remaining, notes),
            )
            conn.commit()
            record_id = cursor.lastrowid

        return DailySpoonState(
            id=record_id,
            timestamp=now_iso,
            pain_level=pain_level,
            focus_state=focus_state,
            total_spoons=total_spoons,
            spoons_remaining=remaining,
            notes=notes,
        )

    def spend_spoons(self, spoon_cost: float, activity: str) -> DailySpoonState:
        """Deduct spoons for an activity and record the activity log."""
        latest = self.get_latest_state()
        if latest is None:
            # Default fallback state if none logged yet
            latest = self.log_state(pain_level=5, focus_state="balanced", total_spoons=12.0, spoons_remaining=12.0)

        new_remaining = max(0.0, latest.spoons_remaining - spoon_cost)
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO activity_logs (timestamp, activity, spoon_cost, spoons_after)
                VALUES (?, ?, ?, ?)
                """,
                (now_iso, activity, spoon_cost, new_remaining),
            )
            cursor.execute(
                """
                INSERT INTO state_logs (timestamp, pain_level, focus_state, total_spoons, spoons_remaining, notes)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    now_iso,
                    latest.pain_level,
                    latest.focus_state,
                    latest.total_spoons,
                    new_remaining,
                    f"Spent {spoon_cost} spoons on: {activity}",
                ),
            )
            conn.commit()
            record_id = cursor.lastrowid

        return DailySpoonState(
            id=record_id,
            timestamp=now_iso,
            pain_level=latest.pain_level,
            focus_state=latest.focus_state,
            total_spoons=latest.total_spoons,
            spoons_remaining=new_remaining,
            notes=f"Spent {spoon_cost} spoons on: {activity}",
        )

    def recharge_spoons(self, spoon_gain: float, activity: str) -> DailySpoonState:
        """Add spoons back for active recovery activities (e.g. resting with heatpack, power nap)."""
        latest = self.get_latest_state()
        if latest is None:
            latest = self.log_state(pain_level=5, focus_state="balanced", total_spoons=12.0, spoons_remaining=12.0)

        new_remaining = min(latest.total_spoons, latest.spoons_remaining + spoon_gain)
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO activity_logs (timestamp, activity, spoon_cost, spoons_after)
                VALUES (?, ?, ?, ?)
                """,
                (now_iso, f"RECHARGE: {activity}", -spoon_gain, new_remaining),
            )
            cursor.execute(
                """
                INSERT INTO state_logs (timestamp, pain_level, focus_state, total_spoons, spoons_remaining, notes)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    now_iso,
                    latest.pain_level,
                    latest.focus_state,
                    latest.total_spoons,
                    new_remaining,
                    f"Recharged +{spoon_gain} spoons via: {activity}",
                ),
            )
            conn.commit()
            record_id = cursor.lastrowid

        return DailySpoonState(
            id=record_id,
            timestamp=now_iso,
            pain_level=latest.pain_level,
            focus_state=latest.focus_state,
            total_spoons=latest.total_spoons,
            spoons_remaining=new_remaining,
            notes=f"Recharged +{spoon_gain} spoons via: {activity}",
        )


    def get_latest_state(self) -> Optional[DailySpoonState]:
        """Fetch the most recent state entry."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM state_logs ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
            if not row:
                return None
            return DailySpoonState(
                id=row["id"],
                timestamp=row["timestamp"],
                pain_level=row["pain_level"],
                focus_state=row["focus_state"],
                total_spoons=row["total_spoons"],
                spoons_remaining=row["spoons_remaining"],
                notes=row["notes"] or "",
            )

    def get_history(self, limit: int = 10) -> list[DailySpoonState]:
        """Fetch historical state snapshots."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM state_logs ORDER BY id DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [
                DailySpoonState(
                    id=row["id"],
                    timestamp=row["timestamp"],
                    pain_level=row["pain_level"],
                    focus_state=row["focus_state"],
                    total_spoons=row["total_spoons"],
                    spoons_remaining=row["spoons_remaining"],
                    notes=row["notes"] or "",
                )
                for row in rows
            ]
