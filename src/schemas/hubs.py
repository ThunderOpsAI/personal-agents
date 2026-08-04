"""
Sub-Hub Pydantic Output Schemas.

Defines structured output models for each of the 3 medical sub-hubs:
  1. Structural & Surgical Hub
  2. Internal Medicine & Holistic Hub
  3. Mental Health & Daily Function Hub
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field

from src.schemas.medical import (
    ContraindicationFlag,
    DoctorQuestion,
    RankedRecommendation,
)


class BiomarkerResult(BaseModel):
    """Lab biomarker analysis result."""

    name: str = Field(..., description="Name of the biomarker (e.g. 'HbA1c', 'Ferritin', 'TSH')")
    value: str = Field(..., description="Observed value with units (e.g. '5.8%', '15 ng/mL')")
    reference_range: str = Field(..., description="Normal reference range (e.g. '4.0 - 5.6%')")
    status: str = Field(..., description="Interpretation status (e.g. 'Normal', 'Elevated', 'Low')")


class StructuralHubOutput(BaseModel):
    """Structured report returned by Hub 1 (Structural & Surgical)."""

    summary: str = Field(..., description="Primary structural and biomechanical assessment")
    imaging_type: Optional[str] = Field(default=None, description="Modality analyzed (e.g. 'MRI', 'CT', 'Radiology Report PDF')")
    key_findings: list[str] = Field(default_factory=list, description="Primary anatomical or radiological findings")
    biomechanical_assessments: list[str] = Field(default_factory=list, description="Posture, load-bearing, or spinal dynamics analysis")
    surgical_considerations: list[str] = Field(default_factory=list, description="Surgical trade-offs, conservative vs operative routes")
    recommended_interventions: list[RankedRecommendation] = Field(default_factory=list, description="Targeted rehabilitation or physical therapy options")
    risk_flags: list[ContraindicationFlag] = Field(default_factory=list, description="Biomechanical red flags or contraindicated movements")


class InternalHolisticHubOutput(BaseModel):
    """Structured report returned by Hub 2 (Internal Medicine & Holistic)."""

    summary: str = Field(..., description="Comprehensive internal medicine, metabolic, and lab synthesis")
    biomarkers_analyzed: list[BiomarkerResult] = Field(default_factory=list, description="Structured lab results from blood/urine panels")
    abnormalities_identified: list[str] = Field(default_factory=list, description="Out-of-range biomarkers or metabolic red flags")
    drug_supplement_interactions: list[ContraindicationFlag] = Field(default_factory=list, description="Cross-referenced drug-drug or drug-supplement interactions")
    holistic_recommendations: list[RankedRecommendation] = Field(default_factory=list, description="Dietary, supplement, and pharmaceutical discussion points")
    questions_for_doctor: list[DoctorQuestion] = Field(default_factory=list, description="Targeted questions for PCP/Specialist appointment prep")


class MentalHealthHubOutput(BaseModel):
    """Structured report returned by Hub 3 (Mental Health & Daily Function)."""

    summary: str = Field(..., description="Executive summary of ADHD focus state, pain load, and daily functional capacity")
    current_pain_level: int = Field(..., ge=1, le=10, description="Chronic pain rating from 1 to 10")
    current_focus_state: str = Field(..., description="Current ADHD focus state (e.g. 'executive_dysfunction', 'hyperfocus')")
    spoons_remaining: float = Field(..., ge=0.0, description="Available spoon-theory energy units")
    total_spoons: float = Field(..., ge=0.0, description="Daily total spoon capacity")
    pacing_and_coping_strategies: list[RankedRecommendation] = Field(default_factory=list, description="Actionable pacing, focus, and energy conservation recommendations")
    risk_flags: list[ContraindicationFlag] = Field(default_factory=list, description="Burnout, sensory overload, or pain flare warnings")
    questions_for_doctor: list[DoctorQuestion] = Field(default_factory=list, description="Questions for therapist, psychiatrist, or OT")
