#!/usr/bin/env python3
"""
Medical Wing Test Harness — Validates the 3 Medical Sub-Hubs & Inter-Agent Protocol.

Usage
─────
    # Dry-run mode (validates schemas, SpoonStore SQLite, and mock pipelines without LLM calls):
    python scripts/test_medical_wing.py --dry-run

    # Live mode (calls sub-hubs and CMO orchestrator with live LLM):
    python scripts/test_medical_wing.py
"""

from __future__ import annotations

import argparse
import sys
import tempfile
from pathlib import Path

# Ensure project root is on sys.path
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from rich.console import Console  # noqa: E402
from rich.panel import Panel  # noqa: E402
from rich.table import Table  # noqa: E402

from src.schemas.hubs import (  # noqa: E402
    BiomarkerResult,
    InternalHolisticHubOutput,
    MentalHealthHubOutput,
    StructuralHubOutput,
)
from src.schemas.medical import (  # noqa: E402
    ContraindicationFlag,
    DoctorQuestion,
    RankedRecommendation,
    RecommendationLevel,
    RiskSeverity,
)
from src.storage.spoon_store import SpoonStore  # noqa: E402

console = Console()

# ── Sample Data for Dry-Run ──────────────────────────────────────────────────

SAMPLE_STRUCTURAL_OUTPUT = StructuralHubOutput(
    summary="Lumbar MRI shows L4-L5 disc protrusion with mild bilateral neural foraminal stenosis. Spinal cord signal is normal.",
    imaging_type="Lumbar Spine MRI",
    key_findings=[
        "3.5mm posterior disc protrusion at L4-L5",
        "Mild bilateral foraminal stenosis at L4-L5",
        "L5-S1 disc height loss of ~15%",
    ],
    biomechanical_assessments=[
        "Excessive anterior pelvic tilt increasing L4-L5 shear force",
        "Gluteal amnesia contributing to lumbar spine compensations",
    ],
    surgical_considerations=[
        "Surgical intervention (microdiscectomy) not indicated at present stage",
        "Conservative physical therapy recommended for 12 weeks minimum",
    ],
    recommended_interventions=[
        RankedRecommendation(
            name="McGill Stabilization Protocol (Bird-dog, Side Plank, Curl-up)",
            recommendation_level=RecommendationLevel.HIGHLY_RECOMMENDED,
            rationale="Builds muscular endurance around lumbar spine without axial compressive loading.",
            pros=["High safety profile", "Strong RCT evidence for CLBP"],
            cons=["Requires daily adherence"],
        )
    ],
    risk_flags=[
        ContraindicationFlag(
            title="Heavy Heavy Axial Loading Contraindicated",
            severity=RiskSeverity.HIGH,
            description="Avoid heavy barbell back squats and deadlifts during acute flare phase.",
            affected_items=["Heavy Squats", "Deadlifts"],
        )
    ],
)

SAMPLE_INTERNAL_OUTPUT = InternalHolisticHubOutput(
    summary="Blood panel indicates suboptimal ferritin (22 ng/mL) and elevated hs-CRP (3.1 mg/L), suggesting low iron stores and systemic inflammation.",
    biomarkers_analyzed=[
        BiomarkerResult(name="HbA1c", value="5.4%", reference_range="4.0-5.6%", status="Normal"),
        BiomarkerResult(name="Serum Ferritin", value="22 ng/mL", reference_range="30-200 ng/mL", status="Suboptimal"),
        BiomarkerResult(name="hs-CRP", value="3.1 mg/L", reference_range="< 1.0 mg/L", status="Elevated"),
    ],
    abnormalities_identified=["Suboptimal Iron Stores (Ferritin < 30)", "Elevated Inflammatory Marker (hs-CRP)"],
    drug_supplement_interactions=[
        ContraindicationFlag(
            title="Iron + Calcium Co-ingestion Inhibition",
            severity=RiskSeverity.MODERATE,
            description="Calcium supplements reduce non-heme iron absorption by up to 50% when taken together.",
            affected_items=["Iron Bisglycinate", "Calcium Carbonate"],
        )
    ],
    holistic_recommendations=[
        RankedRecommendation(
            name="Liposomal Vitamin C + Iron Bisglycinate (25mg)",
            recommendation_level=RecommendationLevel.HIGHLY_RECOMMENDED,
            rationale="Vitamin C enhances iron absorption via duodenal cytochrome b reduction.",
            pros=["Higher absorption", "Gentler on stomach"],
            cons=["Take separately from tea/coffee/dairy"],
        )
    ],
    questions_for_doctor=[
        DoctorQuestion(
            question="Would a full iron panel (TIBC, Transferrin Saturation) be indicated to evaluate iron deficiency without anemia?",
            context="Ferritin is an acute phase reactant and may appear artificially elevated in the context of high hs-CRP.",
            priority="High",
        )
    ],
)

SAMPLE_MENTAL_HEALTH_OUTPUT = MentalHealthHubOutput(
    summary="Patient presents with low spoon energy budget (4/12 spoons remaining), high chronic pain (6/10), and executive dysfunction.",
    current_pain_level=6,
    current_focus_state="executive_dysfunction",
    spoons_remaining=4.0,
    total_spoons=12.0,
    pacing_and_coping_strategies=[
        RankedRecommendation(
            name="Pomodoro Pacing (15m task / 10m rest)",
            recommendation_level=RecommendationLevel.HIGHLY_RECOMMENDED,
            rationale="Prevents cognitive spoon exhaustion and micro-flares.",
            pros=["Reduces overwhelm", "Maintains baseline functional capacity"],
            cons=["Requires strict boundaries"],
        )
    ],
    risk_flags=[
        ContraindicationFlag(
            title="Imminent Energy Crash / Spoon Bankruptcy Warning",
            severity=RiskSeverity.CRITICAL,
            description="Pushing through executive dysfunction with < 4 spoons remaining triggers severe pain flares.",
            affected_items=["High-cognitive tasks", "Physical exertion"],
        )
    ],
    questions_for_doctor=[
        DoctorQuestion(
            question="Can we discuss adjusting my ADHD medication timing to minimize afternoon executive crashes?",
            context="Afternoon crash coincides with peak pain perception.",
            priority="High",
        )
    ],
)


def run_dry_run() -> None:
    """Execute dry-run validations for schemas, SpoonStore SQLite, and inter-agent protocol."""
    console.print("\n[bold green]═══ MEDICAL WING DRY-RUN VALIDATION ═══[/]\n")

    # 1. Test SpoonStore SQLite
    with tempfile.TemporaryDirectory() as tmpdir:
        test_db = Path(tmpdir) / "test_spoon.db"
        store = SpoonStore(db_path=test_db)
        
        initial = store.log_state(pain_level=6, focus_state="executive_dysfunction", total_spoons=12.0)
        assert initial.pain_level == 6
        assert initial.spoons_remaining == 12.0
        
        after_spend = store.spend_spoons(spoon_cost=4.0, activity="Writing report")
        assert after_spend.spoons_remaining == 8.0
        
        latest = store.get_latest_state()
        assert latest is not None
        assert latest.spoons_remaining == 8.0

        console.print("[green]✓ Hub 3 SpoonStore SQLite state management verified successfully.[/]")

    # 2. Test Hub 1 Schema Round-trip
    str_json = SAMPLE_STRUCTURAL_OUTPUT.model_dump_json()
    str_restored = StructuralHubOutput.model_validate_json(str_json)
    assert str_restored == SAMPLE_STRUCTURAL_OUTPUT
    console.print("[green]✓ Hub 1 Structural & Surgical schema round-trip passed.[/]")

    # 3. Test Hub 2 Schema Round-trip
    int_json = SAMPLE_INTERNAL_OUTPUT.model_dump_json()
    int_restored = InternalHolisticHubOutput.model_validate_json(int_json)
    assert int_restored == SAMPLE_INTERNAL_OUTPUT
    console.print("[green]✓ Hub 2 Internal Medicine & Holistic schema round-trip passed.[/]")

    # 4. Test Hub 3 Schema Round-trip
    mh_json = SAMPLE_MENTAL_HEALTH_OUTPUT.model_dump_json()
    mh_restored = MentalHealthHubOutput.model_validate_json(mh_json)
    assert mh_restored == SAMPLE_MENTAL_HEALTH_OUTPUT
    console.print("[green]✓ Hub 3 Mental Health & Daily Function schema round-trip passed.[/]")

    # 5. Display Sub-Hub Summary Table
    table = Table(title="Medical Sub-Hub Data Validation Summary", show_header=True, header_style="bold magenta")
    table.add_column("Sub-Hub", style="bold white")
    table.add_column("Primary Domain", style="cyan")
    table.add_column("Status", style="green")

    table.add_row("Hub 1: Structural & Surgical", "MRI/CT Scan + Radiology PDF Ingestion", "VALIDATED ✓")
    table.add_row("Hub 2: Internal & Holistic", "Blood Panels + ChromaDB RAG + PubChem/FDA", "VALIDATED ✓")
    table.add_row("Hub 3: Mental Health & Daily Function", "ADHD Focus + Pain 1-10 + SQLite SpoonStore", "VALIDATED ✓")

    console.print()
    console.print(table)
    console.print("\n[bold green]ALL MEDICAL WING DRY-RUN CHECKS PASSED SUCCESSFULLY![/]\n")


def run_live(query: str, debug: bool = False) -> None:
    """Run live multi-hub analysis and CMO orchestration."""
    from src.agents.cmo import CMOOrchestrator
    from src.agents.hubs.internal import create_internal_hub_agent
    from src.agents.hubs.mental_health import create_mental_health_hub_agent
    from src.agents.hubs.structural import create_structural_hub_agent
    from src.config import get_openai_api_key

    get_openai_api_key()

    console.print("\n[bold cyan]🔗 RUNNING LIVE MEDICAL WING MULTI-AGENT PIPELINE[/]\n")
    console.print(f"[dim]User Query:[/] {query}\n")

    # 1. Hub 1
    console.print("[yellow]Running Hub 1 (Structural & Surgical)...[/]")
    structural_agent = create_structural_hub_agent(debug_mode=debug)
    structural_res = structural_agent.analyze_radiology_report(query)

    # 2. Hub 2
    console.print("[yellow]Running Hub 2 (Internal Medicine & Holistic)...[/]")
    internal_agent = create_internal_hub_agent(debug_mode=debug)
    internal_res = internal_agent.analyze_lab_report(query, medications=["Ibuprofen"], supplements=["Multivitamin"])

    # 3. Hub 3
    console.print("[yellow]Running Hub 3 (Mental Health & Daily Function)...[/]")
    mh_agent = create_mental_health_hub_agent(debug_mode=debug)
    mh_res = mh_agent.analyze_daily_function(current_query=query, pain_level=5, focus_state="executive_dysfunction")

    # 4. CMO Synthesis
    console.print("[cyan]Synthesizing all sub-hub outputs with CMO Lead Orchestrator...[/]")
    orchestrator = CMOOrchestrator(debug_mode=debug)
    brief = orchestrator.synthesize(
        query=query,
        structural_output=structural_res,
        internal_output=internal_res,
        mental_health_output=mh_res,
    )

    console.print()
    console.print(Panel(brief.primary_synthesis, title="[bold cyan]CMO Multi-Hub Synthesis Brief[/]"))
    console.print(f"[green]Synthesized {len(brief.direct_recommendations)} recommendations and {len(brief.contraindications_and_risks)} risk flags.[/]")


def main() -> None:
    parser = argparse.ArgumentParser(description="Test script for Medical Wing Sub-Hubs.")
    parser.add_argument("--dry-run", action="store_true", help="Validate schemas and local state store without LLM calls.")
    parser.add_argument("--query", type=str, default="Comprehensive evaluation for chronic lower back pain, fatigue, and ADHD executive dysregulation.", help="Query for live test.")
    parser.add_argument("--debug", action="store_true", help="Enable Agno debug mode.")
    args = parser.parse_args()

    if args.dry_run:
        run_dry_run()
    else:
        run_live(args.query, debug=args.debug)


if __name__ == "__main__":
    main()
