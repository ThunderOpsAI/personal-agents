#!/usr/bin/env python3
"""
Life OS Pipeline Test Harness.

Executes the ChiefLifeOfficer orchestrator, evaluates alerts, persists the
`MasterLifeBrief` into `data/life_os.db`, and formats a rich executive summary table.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from src.agents.clo import ChiefLifeOfficer

console = Console()


def run_harness(energy: int = 6, pain: int = 3, query: str = "") -> None:
    console.print("\n[bold cyan]🚀 Initializing Chief Life Officer Pipeline...[/]")
    clo = ChiefLifeOfficer(enable_desktop_notifications=True)

    console.print(f"[bold yellow]📊 Ingesting Multi-Domain Data (Energy: {energy}/10, Pain: {pain}/10)...[/]")
    brief = clo.run_life_briefing(medical_query=query, energy_level=energy, pain_level=pain, use_mock_cmo=True)

    console.print(f"\n[bold green]✅ MasterLifeBrief Generated! (Database Record ID: #{brief.id})[/]")
    console.print(Panel(f"[bold white]{brief.headline_summary}[/]", title="[bold gold1]Headline Assessment[/]", border_style="gold1"))

    # Active Alerts Table
    alert_table = Table(title="🚨 Active Alerts Engine Queue", show_header=True, header_style="bold magenta")
    alert_table.add_column("Severity", style="bold red", width=12)
    alert_table.add_column("Category", style="cyan", width=14)
    alert_table.add_column("Title", style="white", width=30)
    alert_table.add_column("Action Required", style="yellow")

    if brief.active_alerts:
        for alert in brief.active_alerts:
            alert_table.add_row(alert.severity.value, alert.category.value, alert.title, alert.action_required)
    else:
        alert_table.add_row("NONE", "System", "No critical alerts pending", "All systems operational")

    console.print(alert_table)

    # Consolidated Actions
    console.print("\n[bold cyan]📋 Consolidated Daily Action Items:[/]")
    for item in brief.consolidated_action_items:
        console.print(f"  • [white]{item}[/]")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Life OS Harness")
    parser.add_argument("--energy", type=int, default=6, help="Energy level (1-10)")
    parser.add_argument("--pain", type=int, default=3, help="Pain level (1-10)")
    parser.add_argument("--query", type=str, default="", help="Medical query for CMO")
    args = parser.parse_args()

    run_harness(energy=args.energy, pain=args.pain, query=args.query)
