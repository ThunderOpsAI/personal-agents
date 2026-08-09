"""
Chief Rumble Officer (CRO) Master Orchestrator Agent.

Synthesizes Live Daily Operations (Schedule, Emails, Billing), CMO Medical Hubs,
and Anatomical Symptom & Pain Tracking into a single `MasterLifeBrief` output contract.
Evaluates alerts via `AlertEngine` and persists snapshots in `LifeOSStore`.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Optional

from rich.console import Console

from src.agents.cmo import create_cmo_agent
from src.agents.ops.habit_coach import HabitCoach
from src.alerts.engine import AlertEngine
from src.schemas.life_os import (
    ActionCategory,
    ActionItemRecord,
    AlertCategory,
    AlertSeverity,
    LifeAlert,
    MasterLifeBrief,
    SymptomPainState,
)

from src.schemas.medical import PersonalAdvisorBrief
from src.schemas.ops import BriefingReport, CalendarEvent, EOBRecord, EmailPriority, EmailSummary, SpoonState
from src.storage.life_os_store import LifeOSStore
from src.agents.rehab_coach import RehabCoach
from src.tools.google_auth import get_google_credentials
from src.tools.workspace_mcp import chat_with_gmail, google_calendar

console = Console()


class ChiefRumbleOfficer:
    """Master Orchestrator aggregating Daily Ops, Medical Wing, and Symptom Tracking for Rumble OS."""

    def __init__(
        self,
        db_path: Optional[Path | str] = None,
        enable_desktop_notifications: bool = True,
        debug_mode: bool = False,
        use_live_google_data: bool = True,
    ) -> None:
        self.store = LifeOSStore(db_path=db_path)
        self.alert_engine = AlertEngine(enable_desktop_notifications=enable_desktop_notifications)
        self.debug_mode = debug_mode
        self.use_live_google_data = use_live_google_data
        self.rehab_coach = RehabCoach()

    def collect_ops_report(self, energy_level: int = 6, pain_level: int = 5) -> tuple[BriefingReport, SpoonState]:
        """Fetch real emails, schedule, bills, and energy state."""
        today_str = date.today().isoformat()

        # 1. Schedule Highlights from Google Calendar
        try:
            cal_raw = google_calendar(action="list", mock=False)
            events_data = json.loads(cal_raw) if isinstance(cal_raw, str) else cal_raw
            schedule = [CalendarEvent(**evt) for evt in events_data if isinstance(evt, dict)]
        except Exception:
            schedule = []

        # 2. Triaged Emails from Gmail
        try:
            gmail_raw = chat_with_gmail(action="list", max_results=10, mock=False)
            emails_data = json.loads(gmail_raw) if isinstance(gmail_raw, str) else gmail_raw
            emails = [EmailSummary(**msg) for msg in emails_data if isinstance(msg, dict)]
            high_priority = [e for e in emails if e.priority == EmailPriority.HIGH or e.action_required or e.is_imperative]
        except Exception:
            high_priority = []

        # 3. Habit Coach Calculation
        spoon_state = HabitCoach.calculate_spoon_state(energy_level=energy_level, pain_level=pain_level)

        # 4. Medical Billing / EOB Records
        pending_bills = []

        action_items = [
            f"Target {spoon_state.recommended_focus_hours} hours focus time today.",
            "Protect recovery & focus barriers from meeting overrides.",
        ]

        ops_report = BriefingReport(
            date=today_str,
            schedule_highlights=schedule,
            high_priority_emails=high_priority,
            energy_coaching=spoon_state,
            pending_medical_bills=pending_bills,
            action_items=action_items,
        )

        return ops_report, spoon_state

    def run_rumble_briefing(
        self,
        medical_query: Optional[str] = None,
        energy_level: int = 6,
        pain_level: int = 5,
        use_mock_cmo: bool = False,
    ) -> MasterLifeBrief:
        """Run complete multi-domain ingest pipeline to generate, evaluate alerts, and persist a MasterLifeBrief."""
        now_iso = datetime.now(timezone.utc).isoformat()
        today_str = date.today().isoformat()

        # 1. Collect Ops Report & Energy State
        ops_report, spoon_state = self.collect_ops_report(energy_level=energy_level, pain_level=pain_level)

        # 2. Get Anatomical Symptom & Pain Tracking State
        symptom_state = self.store.get_latest_symptoms()
        if pain_level:
            symptom_state.total_pain_level = pain_level

        # 3. Collect Medical Briefing
        medical_brief: Optional[PersonalAdvisorBrief] = None
        if medical_query:
            cmo_agent = create_cmo_agent(debug_mode=self.debug_mode)
            cmo_resp = cmo_agent.run(medical_query)
            if hasattr(cmo_resp, "content") and isinstance(cmo_resp.content, PersonalAdvisorBrief):
                medical_brief = cmo_resp.content

        # 4. Evaluate Alerts via Alert Engine
        active_alerts = self.alert_engine.evaluate_all(
            ops_report=ops_report,
            spoon_state=spoon_state,
            medical_brief=medical_brief,
        )

        # 5. Consolidate Action Items & Build Structured Action Records
        consolidated_actions = list(ops_report.action_items)
        action_records: list[ActionItemRecord] = [
            ActionItemRecord(
                id=f"act_focus_{int(datetime.now(timezone.utc).timestamp())}",
                text=f"Target {spoon_state.recommended_focus_hours} hours focus time today.",
                category=ActionCategory.OPS,
            ),
            ActionItemRecord(
                id=f"act_protect_{int(datetime.now(timezone.utc).timestamp())}",
                text="Protect recovery & focus barriers from meeting overrides.",
                category=ActionCategory.OPS,
            ),
        ]

        if medical_brief:
            for idx, rec in enumerate(medical_brief.direct_recommendations):
                rec_text = f"Medical: {rec.name} ({rec.recommendation_level.value})"
                consolidated_actions.append(rec_text)
                action_records.append(
                    ActionItemRecord(
                        id=f"act_med_{idx}_{int(datetime.now(timezone.utc).timestamp())}",
                        text=rec_text,
                        category=ActionCategory.MEDICAL,
                    )
                )

        if date.today().weekday() == 6:
            recalibration = self.rehab_coach.weekly_recalibration()
            if recalibration["rules"] or recalibration["constraints"]:
                consolidated_actions.append(
                    "Sunday exercise recalibration is ready for explicit approval or rejection."
                )

        for alert in active_alerts:
            alert_text = f"ALERT [{alert.severity.value}]: {alert.title}"
            consolidated_actions.append(alert_text)
            action_records.append(
                ActionItemRecord(
                    id=f"act_alert_{alert.id}",
                    text=alert_text,
                    category=ActionCategory.ALERT,
                    linked_id=alert.id,
                )
            )

        headline = (
            f"Rumble OS Briefing — Overall Pain: {symptom_state.total_pain_level}/10 ({symptom_state.primary_generator} {symptom_state.primary_percentage}%) | "
            f"Active Alerts: {len(active_alerts)} | Agenda Items: {len(ops_report.schedule_highlights)}"
        )

        # 6. Build MasterLifeBrief
        master_brief = MasterLifeBrief(
            timestamp=now_iso,
            date=today_str,
            headline_summary=headline,
            active_alerts=active_alerts,
            ops_briefing=ops_report,
            medical_briefing=medical_brief,
            symptom_state=symptom_state,
            consolidated_action_items=consolidated_actions,
            action_records=action_records,
        )

        # 7. Save Brief & Alerts to SQLite Database
        brief_id = self.store.save_brief(master_brief)
        master_brief.id = brief_id

        return master_brief

    def run_life_briefing(self, **kwargs) -> MasterLifeBrief:
        """Alias for backward compatibility."""
        return self.run_rumble_briefing(**kwargs)


# Backward compatibility alias
ChiefLifeOfficer = ChiefRumbleOfficer
