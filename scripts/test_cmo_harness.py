#!/usr/bin/env python3
"""
Quick CLI smoke-test for the CMO harness.

Usage
─────
    # With a real API key in .env:
    python scripts/test_cmo_harness.py

    # With --dry-run to validate schemas without calling the LLM:
    python scripts/test_cmo_harness.py --dry-run

    # Custom query:
    python scripts/test_cmo_harness.py --query "What are the best approaches for chronic lower back pain?"
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure the project root is on sys.path so `src.*` imports resolve.
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table

from src.schemas.medical import (
    PersonalAdvisorBrief,
    RankedRecommendation,
    RecommendationLevel,
    ContraindicationFlag,
    DoctorQuestion,
    RiskSeverity,
)

console = Console()

# ── Sample data for --dry-run mode ──────────────────────────────────────────

SAMPLE_BRIEF = PersonalAdvisorBrief(
    primary_synthesis=(
        "Based on current evidence, chronic lower-back pain (CLBP) is best "
        "managed through a multimodal approach combining structured movement, "
        "manual therapy, and targeted lifestyle modifications. The biopsychosocial "
        "model is now the gold standard, recognising that pain catastrophising, "
        "sleep quality, and psychosocial stressors are as impactful as "
        "biomechanical dysfunction."
    ),
    direct_recommendations=[
        RankedRecommendation(
            name="Structured Exercise Program (McGill Big 3 + Walking)",
            recommendation_level=RecommendationLevel.HIGHLY_RECOMMENDED,
            rationale=(
                "Multiple RCTs and meta-analyses show motor-control exercises "
                "reduce pain and disability scores significantly. The McGill Big 3 "
                "(curl-up, side plank, bird-dog) target spinal stability without "
                "excessive compressive load."
            ),
            pros=[
                "Strong evidence base (Cochrane reviews)",
                "No cost, can be done at home",
                "Improves both pain and function",
            ],
            cons=[
                "Requires consistency over 6–12 weeks for full benefit",
                "May need initial physio guidance for correct form",
            ],
        ),
        RankedRecommendation(
            name="Cognitive Behavioural Therapy for Pain (CBT-P)",
            recommendation_level=RecommendationLevel.CONSIDER_WITH_CAUTION,
            rationale=(
                "Moderate-quality evidence from RCTs indicates CBT-P reduces pain "
                "catastrophising and improves functional outcomes when combined with "
                "exercise. Effect sizes are modest for pain intensity alone."
            ),
            pros=[
                "Addresses central sensitisation and fear-avoidance",
                "Durable effects at 12-month follow-up",
            ],
            cons=[
                "Requires access to trained therapist",
                "Insurance coverage varies",
            ],
        ),
        RankedRecommendation(
            name="Curcumin Supplementation (Bioavailable Form)",
            recommendation_level=RecommendationLevel.EXPERIMENTAL,
            rationale=(
                "Emerging evidence (small RCTs, mechanistic plausibility via "
                "NF-κB inhibition) suggests bioavailable curcumin may modestly "
                "reduce inflammatory markers in CLBP. Not yet guideline-endorsed."
            ),
            pros=[
                "Generally well-tolerated",
                "Anti-inflammatory mechanism is plausible",
            ],
            cons=[
                "Evidence is preliminary and effect sizes are small",
                "Bioavailability varies dramatically between formulations",
                "Potential interaction with anticoagulants",
            ],
        ),
    ],
    contraindications_and_risks=[
        ContraindicationFlag(
            title="Curcumin + Anticoagulant Interaction",
            severity=RiskSeverity.MODERATE,
            description=(
                "Curcumin has antiplatelet properties and may potentiate the "
                "effect of warfarin, aspirin, or other blood thinners, increasing "
                "bleeding risk."
            ),
            affected_items=["Curcumin", "Warfarin", "Aspirin", "Clopidogrel"],
        ),
    ],
    questions_for_doctor=[
        DoctorQuestion(
            question=(
                "Given my imaging results and symptom pattern, would you classify "
                "my CLBP as primarily discogenic, facetogenic, or myofascial?"
            ),
            context=(
                "Understanding the dominant pain generator helps target the "
                "exercise programme and decide whether manual therapy is appropriate."
            ),
            priority="High",
        ),
        DoctorQuestion(
            question=(
                "Are there any contraindications to starting a spinal stability "
                "programme based on my current medication list?"
            ),
            context=(
                "Some medications (e.g., fluoroquinolones) can affect tendon "
                "integrity, which may influence exercise selection."
            ),
            priority="Medium",
        ),
    ],
)

SAMPLE_QUERY = (
    "I've been dealing with chronic lower-back pain for 8 months. "
    "I currently take ibuprofen as needed and a daily multivitamin. "
    "What are the most effective evidence-based approaches I should consider, "
    "and what should I ask my doctor at my next appointment?"
)


# ── Display helpers ─────────────────────────────────────────────────────────


def render_brief(brief: PersonalAdvisorBrief) -> None:
    """Pretty-print a PersonalAdvisorBrief using Rich."""

    # ── Primary Synthesis ───────────────────────────────────────────────
    console.print()
    console.print(
        Panel(
            brief.primary_synthesis,
            title="[bold cyan]🩺 Primary Synthesis[/]",
            border_style="cyan",
            padding=(1, 2),
        )
    )

    # ── Recommendations Table ───────────────────────────────────────────
    if brief.direct_recommendations:
        table = Table(
            title="💊 Direct Recommendations",
            show_header=True,
            header_style="bold magenta",
            border_style="dim",
            pad_edge=True,
        )
        table.add_column("#", style="dim", width=3)
        table.add_column("Intervention", style="bold white", min_width=30)
        table.add_column("Level", min_width=22)
        table.add_column("Rationale", ratio=2)

        level_colors = {
            RecommendationLevel.HIGHLY_RECOMMENDED: "green",
            RecommendationLevel.CONSIDER_WITH_CAUTION: "yellow",
            RecommendationLevel.EXPERIMENTAL: "red",
        }

        for i, rec in enumerate(brief.direct_recommendations, 1):
            color = level_colors.get(rec.recommendation_level, "white")
            table.add_row(
                str(i),
                rec.name,
                f"[{color}]{rec.recommendation_level.value}[/]",
                rec.rationale[:120] + "…" if len(rec.rationale) > 120 else rec.rationale,
            )

        console.print()
        console.print(table)

    # ── Contraindications ───────────────────────────────────────────────
    if brief.contraindications_and_risks:
        console.print()
        for flag in brief.contraindications_and_risks:
            severity_colors = {
                RiskSeverity.LOW: "blue",
                RiskSeverity.MODERATE: "yellow",
                RiskSeverity.HIGH: "red",
                RiskSeverity.CRITICAL: "bold red",
            }
            color = severity_colors.get(flag.severity, "white")
            console.print(
                Panel(
                    f"[{color}]⚠ {flag.severity.value}[/]\n\n{flag.description}\n\n"
                    f"[dim]Affected: {', '.join(flag.affected_items)}[/]",
                    title=f"[bold red]🚨 {flag.title}[/]",
                    border_style="red",
                    padding=(1, 2),
                )
            )

    # ── Doctor Questions ────────────────────────────────────────────────
    if brief.questions_for_doctor:
        console.print()
        console.print("[bold blue]📋 Questions for Your Doctor[/]")
        for q in brief.questions_for_doctor:
            console.print(f"  [{q.priority}] [bold]{q.question}[/]")
            console.print(f"       [dim]{q.context}[/]")

    # ── Disclaimer ──────────────────────────────────────────────────────
    console.print()
    console.print(
        Panel(
            brief.disclaimer,
            title="[dim]⚖️  Disclaimer[/]",
            border_style="dim",
            padding=(0, 2),
        )
    )

    # ── Raw JSON ────────────────────────────────────────────────────────
    console.print()
    raw_json = brief.model_dump_json(indent=2)
    console.print(
        Panel(
            Syntax(raw_json, "json", theme="monokai", line_numbers=False),
            title="[dim]Raw JSON Output[/]",
            border_style="dim",
        )
    )


# ── Main ────────────────────────────────────────────────────────────────────


def run_dry(query: str) -> None:
    """Validate the schema round-trip without calling the LLM."""
    console.print("[bold green]✅ DRY-RUN MODE[/] — No LLM call, using sample data.\n")
    console.print(f"[dim]Query:[/] {query}\n")

    # Round-trip: model → JSON → model  (proves schema integrity)
    json_str = SAMPLE_BRIEF.model_dump_json()
    restored = PersonalAdvisorBrief.model_validate_json(json_str)

    assert restored == SAMPLE_BRIEF, "Round-trip validation failed!"
    console.print("[green]Schema round-trip validation passed ✓[/]\n")

    render_brief(restored)


def run_live(query: str, debug: bool = False) -> None:
    """Send a real query to the CMO agent and display the result."""
    # Late import so --dry-run works without an API key
    from src.config import get_openai_api_key
    from src.agents.cmo import create_cmo_agent

    get_openai_api_key()  # Validates key is present

    console.print("[bold cyan]🔗 LIVE MODE[/] — Calling the CMO agent…\n")
    console.print(f"[dim]Query:[/] {query}\n")

    agent = create_cmo_agent(debug_mode=debug)
    response = agent.run(query)

    # The response.content should be the Pydantic model when output_schema is set
    if isinstance(response.content, PersonalAdvisorBrief):
        brief = response.content
    elif isinstance(response.content, str):
        # Fallback: parse raw JSON string
        brief = PersonalAdvisorBrief.model_validate_json(response.content)
    elif isinstance(response.content, dict):
        brief = PersonalAdvisorBrief.model_validate(response.content)
    else:
        console.print(f"[red]Unexpected response type: {type(response.content)}[/]")
        console.print(str(response.content))
        sys.exit(1)

    render_brief(brief)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Test the CMO agent harness.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate schemas without calling the LLM.",
    )
    parser.add_argument(
        "--query",
        type=str,
        default=SAMPLE_QUERY,
        help="Medical query to send to the CMO agent.",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable Agno debug logging.",
    )
    args = parser.parse_args()

    if args.dry_run:
        run_dry(args.query)
    else:
        run_live(args.query, debug=args.debug)


if __name__ == "__main__":
    main()
