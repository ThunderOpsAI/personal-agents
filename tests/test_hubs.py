"""Unit tests for the 3 Medical Sub-Hubs, SpoonStore SQLite, and Inter-Agent protocol."""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

_PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_PROJECT_ROOT))

from src.agents.cmo import CMOOrchestrator  # noqa: E402
from src.agents.hubs.internal import PubChemOpenFDATool, create_internal_hub_agent  # noqa: E402
from src.agents.hubs.mental_health import create_mental_health_hub_agent  # noqa: E402
from src.agents.hubs.structural import create_structural_hub_agent  # noqa: E402
from src.schemas.hubs import (  # noqa: E402
    BiomarkerResult,
    InternalHolisticHubOutput,
    MentalHealthHubOutput,
    StructuralHubOutput,
)
from src.schemas.medical import (  # noqa: E402
    ContraindicationFlag,
    DoctorQuestion,
    PersonalAdvisorBrief,
    RankedRecommendation,
    RecommendationLevel,
    RiskSeverity,
)
from src.storage.spoon_store import SpoonStore  # noqa: E402


def test_spoon_store_sqlite() -> None:
    """Test SpoonStore SQLite operations (logging state, spending spoons, history)."""
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test_spoons.db"
        store = SpoonStore(db_path=db_path)

        state = store.log_state(pain_level=4, focus_state="hyperfocus", total_spoons=12.0)
        assert state.pain_level == 4
        assert state.focus_state == "hyperfocus"
        assert state.spoons_remaining == 12.0

        after_spend = store.spend_spoons(spoon_cost=3.5, activity="Writing documentation")
        assert after_spend.spoons_remaining == 8.5

        latest = store.get_latest_state()
        assert latest is not None
        assert latest.spoons_remaining == 8.5

        history = store.get_history(limit=5)
        assert len(history) >= 2


def test_sub_hub_schemas() -> None:
    """Test Pydantic schema validation & serialization for all sub-hubs."""
    structural = StructuralHubOutput(
        summary="Spinal test summary",
        key_findings=["L4-L5 disc protrusion"],
        biomechanical_assessments=["Pelvic tilt"],
        surgical_considerations=["Conservative therapy recommended"],
        recommended_interventions=[
            RankedRecommendation(
                name="McGill Big 3",
                recommendation_level=RecommendationLevel.HIGHLY_RECOMMENDED,
                rationale="Spinal stability",
                pros=["Safe"],
                cons=["Needs consistency"],
            )
        ],
        risk_flags=[
            ContraindicationFlag(
                title="Axial loading warning",
                severity=RiskSeverity.HIGH,
                description="Avoid heavy squats",
                affected_items=["Heavy Squats"],
            )
        ],
    )
    s_json = structural.model_dump_json()
    assert StructuralHubOutput.model_validate_json(s_json) == structural

    internal = InternalHolisticHubOutput(
        summary="Blood panel summary",
        biomarkers_analyzed=[
            BiomarkerResult(name="HbA1c", value="5.2%", reference_range="4.0-5.6%", status="Normal")
        ],
        abnormalities_identified=["Suboptimal ferritin"],
        drug_supplement_interactions=[],
        holistic_recommendations=[],
        questions_for_doctor=[],
    )
    i_json = internal.model_dump_json()
    assert InternalHolisticHubOutput.model_validate_json(i_json) == internal

    mental_health = MentalHealthHubOutput(
        summary="Mental health summary",
        current_pain_level=5,
        current_focus_state="balanced",
        spoons_remaining=7.0,
        total_spoons=12.0,
        pacing_and_coping_strategies=[],
        risk_flags=[],
        questions_for_doctor=[],
    )
    m_json = mental_health.model_dump_json()
    assert MentalHealthHubOutput.model_validate_json(m_json) == mental_health


def test_hub_factory_creations() -> None:
    """Verify that factory functions create agent instances properly."""
    struct_agent = create_structural_hub_agent()
    assert struct_agent is not None

    internal_agent = create_internal_hub_agent()
    assert internal_agent is not None

    mh_agent = create_mental_health_hub_agent()
    assert mh_agent is not None


def test_pubchem_openfda_tool() -> None:
    """Verify tool wrapper structure for PubChem / OpenFDA."""
    tool = PubChemOpenFDATool()
    res = tool.check_interaction("Ibuprofen", "Curcumin")
    assert "item_a" in res
    assert "item_b" in res
    assert "pubchem_info" in res
    assert "openfda_warnings" in res
