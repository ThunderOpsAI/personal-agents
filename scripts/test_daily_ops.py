#!/usr/bin/env python3
"""
CLI Test Harness for Daily Operations Wing.

Provides `--dry-run` mock capability to verify tool routing, spoon calculations,
EOB PDF/text parsing, and schedule recovery guardrails without requiring live OAuth tokens.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table

from src.agents.ops import CalendarRecoveryGuardrail, EOBParser, HabitCoach
from src.schemas.ops import BriefingReport, CalendarEvent, GuardrailDecision, SpoonState
from src.tools.workspace_mcp import chat_with_gmail, google_calendar

console = Console()


def run_dry_run_tests() -> None:
    """Execute end-to-end dry-run validation for the Daily Ops Wing components."""
    console.print("[bold green]=== Starting Daily Operations Wing Dry-Run Verification ===[/]\n")

    # 1. Test FastMCP Gmail tool routing
    console.print("[bold cyan]1. Testing FastMCP Gmail Tool (`chat_with_gmail` mock mode)...[/]")
    gmail_out = chat_with_gmail(action="list", mock=True)
    emails = json.loads(gmail_out)
    assert len(emails) > 0, "Gmail mock failed!"
    console.print(f"  ✓ Successfully triaged {len(emails)} emails via FastMCP tool.")

    # 2. Test FastMCP Calendar tool routing
    console.print("\n[bold cyan]2. Testing FastMCP Google Calendar Tool (`google_calendar` mock mode)...[/]")
    cal_out = google_calendar(action="list", mock=True)
    events = json.loads(cal_out)
    assert len(events) > 0, "Calendar mock failed!"
    console.print(f"  ✓ Successfully fetched {len(events)} calendar events via FastMCP tool.")

    # 3. Test Calendar Recovery Guardrail Engine
    console.print("\n[bold cyan]3. Testing Calendar Recovery Guardrail (Shielding focus blocks)...[/]")
    # Conflict test against 09:00 - 11:30 protected block
    conflict_decision = CalendarRecoveryGuardrail.evaluate_override(
        existing_events=events,
        new_event_start="2026-07-22T10:00:00+10:00",
        new_event_end="2026-07-22T11:00:00+10:00",
    )
    assert not conflict_decision.allowed, "Guardrail failed to block conflicting meeting!"
    console.print(f"  ✓ Guardrail correctly blocked override: {conflict_decision.reason}")

    # Non-conflict test
    clear_decision = CalendarRecoveryGuardrail.evaluate_override(
        existing_events=events,
        new_event_start="2026-07-22T16:00:00+10:00",
        new_event_end="2026-07-22T17:00:00+10:00",
    )
    assert clear_decision.allowed, "Guardrail wrongly blocked non-conflicting meeting!"
    console.print(f"  ✓ Guardrail allowed valid slot: {clear_decision.reason}")

    # 4. Test Habit & Focus Coach spoon state engine
    console.print("\n[bold cyan]4. Testing Habit & Focus Coach (Spoon/Energy calculations)...[/]")
    high_spoons = HabitCoach.calculate_spoon_state(energy_level=9, pain_level=1)
    low_spoons = HabitCoach.calculate_spoon_state(energy_level=3, pain_level=7)
    console.print(f"  ✓ High Spoons Focus Cap: {high_spoons.recommended_focus_hours} hours ({high_spoons.advice[:50]}...)")
    console.print(f"  ✓ Low Spoons Focus Cap: {low_spoons.recommended_focus_hours} hours ({low_spoons.advice[:50]}...)")

    # 5. Test Medical Billing Admin EOB raw text parsing
    console.print("\n[bold cyan]5. Testing Medical Billing Admin (EOB Parsing Engine)...[/]")
    sample_eob_text = """
    Statement of Account
    Claim #: CLM-88219
    Provider: Valley Orthopedics Clinic
    Date of Service: 2026-07-15
    Insurance Paid: $450.00
    Patient Responsibility: $250.00
    Notes: High patient responsibility warning.
    """
    eob_record = EOBParser.parse_raw_text(sample_eob_text)
    assert eob_record.claim_id == "CLM-88219", "EOB parser failed claim ID extraction!"
    assert eob_record.flagged_discrepancy, "EOB parser failed to flag high responsibility balance!"
    console.print(f"  ✓ Parsed EOB Claim #{eob_record.claim_id} from {eob_record.provider_name}. Flagged: {eob_record.flagged_discrepancy}")

    # Summary Panel
    console.print()
    console.print(Panel.fit("[bold green]All Daily Operations Wing Dry-Run Verification Tests PASSED! ✓[/]", border_style="green"))


def main() -> None:
    parser = argparse.ArgumentParser(description="Test Harness for Daily Operations Wing.")
    parser.add_argument("--dry-run", action="store_true", default=True, help="Run mock verification tests without live OAuth tokens.")
    args = parser.parse_args()

    run_dry_run_tests()


if __name__ == "__main__":
    main()
