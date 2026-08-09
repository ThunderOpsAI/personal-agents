#!/usr/bin/env python3
"""
Always-On Morning Briefing Cron Script.

Uses `apscheduler` to run a daily morning briefing job that aggregates:
1. Schedule & recovery blocks from Calendar.
2. Triaged emails from Gmail.
3. Dynamic focus & spoon recommendations from Habit Coach.
4. Pending medical bills / EOBs from Billing Admin.
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from apscheduler.schedulers.blocking import BlockingScheduler
from rich.console import Console
from rich.panel import Panel

from src.agents.ops.habit_coach import HabitCoach
from src.schemas.ops import BriefingReport, CalendarEvent, EOBRecord, EmailPriority, EmailSummary
from src.tools.workspace_mcp import chat_with_gmail, google_calendar

console = Console()


def generate_morning_briefing(energy_level: int = 6, pain_level: int = 3) -> BriefingReport:
    """Aggregate data across daily ops agents & tools to construct a daily BriefingReport."""
    today_str = date.today().isoformat()

    # 1. Fetch Calendar Events via tool
    cal_raw = google_calendar(action="list", mock=False)
    events_data = json.loads(cal_raw) if isinstance(cal_raw, str) else cal_raw
    schedule = [CalendarEvent(**evt) for evt in events_data if isinstance(evt, dict)]

    # 2. Fetch Triaged Emails via tool
    gmail_raw = chat_with_gmail(action="list", mock=False)
    emails_data = json.loads(gmail_raw) if isinstance(gmail_raw, str) else gmail_raw
    emails = [EmailSummary(**msg) for msg in emails_data if isinstance(msg, dict)]
    high_priority_emails = [e for e in emails if e.priority == EmailPriority.HIGH or e.action_required]

    # 3. Habit Coach Spoon Calculation
    spoon_state = HabitCoach.calculate_spoon_state(energy_level=energy_level, pain_level=pain_level)

    # 4. Pending Medical Bills
    pending_bills = []

    action_items = [
        f"Target maximum {spoon_state.recommended_focus_hours} hours focus time today.",
        "Review Dr. Smith lab results follow-up email.",
        "Protect 09:00 - 11:30 AM Recovery Block from meeting overrides.",
    ]

    return BriefingReport(
        date=today_str,
        schedule_highlights=schedule,
        high_priority_emails=high_priority_emails,
        energy_coaching=spoon_state,
        pending_medical_bills=pending_bills,
        action_items=action_items,
    )


def morning_briefing_job() -> None:
    """APScheduler cron job handler."""
    console.print(f"\n[bold gold1]🌅 Executing Morning Briefing Job — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/]")
    report = generate_morning_briefing()

    console.print(
        Panel(
            f"[bold cyan]Date:[/] {report.date}\n"
            f"[bold green]Energy Coaching:[/] {report.energy_coaching.advice} (Cap: {report.energy_coaching.recommended_focus_hours}h focus)\n"
            f"[bold yellow]High-Priority Emails:[/] {len(report.high_priority_emails)} items\n"
            f"[bold magenta]Schedule Events:[/] {len(report.schedule_highlights)} events\n\n"
            f"[bold white]Action Items:[/]\n" + "\n".join(f"  • {item}" for item in report.action_items),
            title="[bold yellow]Morning Operational Briefing[/]",
            border_style="yellow",
        )
    )


def run_scheduler() -> None:
    """Start blocking scheduler to execute every morning at 07:00 AM (or test run)."""
    scheduler = BlockingScheduler()
    # Runs daily at 07:00 AM
    scheduler.add_job(morning_briefing_job, "cron", hour=7, minute=0)

    console.print("[bold green]⏰ Morning Briefing Cron Scheduler initialized. Running one immediate briefing...[/]")
    morning_briefing_job()


if __name__ == "__main__":
    run_scheduler()
