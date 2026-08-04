"""
Open-Ended Medical Advisory Schema Protocol.

Defines the `PersonalAdvisorBrief` Pydantic output model and all supporting
types used as the structured contract between the CMO orchestrator and its
downstream consumers / sub-hub agents.

The schema enforces:
  • A ranked list of actionable interventions with explicit recommendation tiers.
  • Automated safety / drug-interaction / contraindication flags.
  • Optional "questions for your doctor" to support appointment preparation.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enumerations ────────────────────────────────────────────────────────────


class RecommendationLevel(str, Enum):
    """Tiered recommendation strength for each intervention."""

    HIGHLY_RECOMMENDED = "Highly Recommended"
    CONSIDER_WITH_CAUTION = "Consider with Caution"
    EXPERIMENTAL = "Experimental"


class RiskSeverity(str, Enum):
    """Severity classification for contraindication / interaction flags."""

    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"
    CRITICAL = "Critical"


# ── Supporting Models ───────────────────────────────────────────────────────


class RankedRecommendation(BaseModel):
    """A single actionable intervention, ranked by evidence strength."""

    name: str = Field(
        ...,
        description="Short, descriptive name of the recommendation (e.g. 'Magnesium Glycinate Supplementation').",
    )
    recommendation_level: RecommendationLevel
    rationale: str = Field(
        ...,
        description="Evidence-based rationale explaining *why* this is recommended.",
    )
    pros: list[str] = Field(
        default_factory=list,
        description="Key benefits and supporting evidence points.",
    )
    cons: list[str] = Field(
        default_factory=list,
        description="Known downsides, caveats, or limitations.",
    )


class ContraindicationFlag(BaseModel):
    """An automated safety / drug-interaction / contraindication warning."""

    title: str = Field(
        ...,
        description="Concise label for the flag (e.g. 'SSRI + St John's Wort Interaction').",
    )
    severity: RiskSeverity
    description: str = Field(
        ...,
        description="Plain-language explanation of the risk and its mechanism.",
    )
    affected_items: list[str] = Field(
        default_factory=list,
        description="List of drugs, supplements, or conditions involved.",
    )


class DoctorQuestion(BaseModel):
    """A targeted question the user can bring to their next medical appointment."""

    question: str = Field(
        ...,
        description="The specific question to ask the doctor.",
    )
    context: str = Field(
        ...,
        description="Brief background explaining why this question is important.",
    )
    priority: str = Field(
        default="Medium",
        description="Relative priority: 'High', 'Medium', or 'Low'.",
    )


# ── Root Output Model ──────────────────────────────────────────────────────


class PersonalAdvisorBrief(BaseModel):
    """
    Root structured output for the CMO agent.

    Every medical advisory response is serialised into this schema so that
    downstream consumers (UI, sub-agents, audit logs) receive a predictable,
    type-safe contract with zero ambiguity.
    """

    primary_synthesis: str = Field(
        ...,
        description=(
            "Chief assessment and direct summary. "
            "A concise yet thorough synthesis of the medical query, integrating "
            "evidence, biomechanics, and holistic health considerations."
        ),
    )

    direct_recommendations: list[RankedRecommendation] = Field(
        default_factory=list,
        description=(
            "Ranked list of actionable interventions, ordered from highest "
            "confidence to most experimental."
        ),
    )

    contraindications_and_risks: list[ContraindicationFlag] = Field(
        default_factory=list,
        description=(
            "Automated safety, drug-interaction, and contraindication flags. "
            "If no risks are identified, this may be an empty list."
        ),
    )

    questions_for_doctor: Optional[list[DoctorQuestion]] = Field(
        default=None,
        description=(
            "Optional list of targeted questions the user can bring to their "
            "next medical appointment. Omitted when not applicable."
        ),
    )

    disclaimer: str = Field(
        default=(
            "This analysis is for informational and educational purposes only. "
            "It does not constitute medical advice, diagnosis, or treatment. "
            "Always consult a qualified healthcare professional before making "
            "any changes to your health regimen."
        ),
        description="Mandatory safety disclaimer attached to every brief.",
    )
