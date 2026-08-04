"""
Chief Medical Officer (CMO) Lead Orchestrator Agent.

Factory function that builds the primary Agno `Agent` configured with:
  • The CMO persona system prompt.
  • Pydantic `PersonalAdvisorBrief` as the structured output schema.
  • Configurable model backend (defaults to OpenAI gpt-4o).
  • Inter-Agent protocol for synthesizing sub-hub outputs.
"""

from __future__ import annotations

import os
from typing import Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from src.agents.prompts import CMO_SYSTEM_PROMPT
from src.schemas.hubs import (
    InternalHolisticHubOutput,
    MentalHealthHubOutput,
    StructuralHubOutput,
)
from src.schemas.medical import PersonalAdvisorBrief


def create_cmo_agent(
    *,
    model_id: Optional[str] = None,
    debug_mode: bool = False,
) -> Agent:
    """
    Construct and return the CMO orchestrator agent.

    Parameters
    ----------
    model_id : str | None
        OpenAI model identifier. Falls back to ``CMO_MODEL_ID`` env var,
        then to ``"gpt-4o"`` as the default.
    debug_mode : bool
        When True, enables Agno's verbose debug logging.

    Returns
    -------
    Agent
        A fully-configured Agno agent ready to accept medical queries via
        ``agent.run()`` and return ``PersonalAdvisorBrief`` objects.
    """
    resolved_model = model_id or os.getenv("CMO_MODEL_ID", "gpt-4o")

    agent = Agent(
        name="CMO",
        role="Chief Medical Officer — Expert Personal Medical Research Analyst & Strategist",
        model=OpenAIChat(id=resolved_model),
        instructions=CMO_SYSTEM_PROMPT,
        output_schema=PersonalAdvisorBrief,
        markdown=False,  # We want raw JSON, not markdown-wrapped output
        debug_mode=debug_mode,
    )

    return agent


class CMOOrchestrator:
    """Lead Orchestrator synthesizing reports from all 3 medical sub-hubs into a PersonalAdvisorBrief."""

    def __init__(
        self,
        model_id: Optional[str] = None,
        debug_mode: bool = False,
    ) -> None:
        self.cmo_agent = create_cmo_agent(model_id=model_id, debug_mode=debug_mode)

    def synthesize(
        self,
        query: str,
        structural_output: Optional[StructuralHubOutput] = None,
        internal_output: Optional[InternalHolisticHubOutput] = None,
        mental_health_output: Optional[MentalHealthHubOutput] = None,
    ) -> PersonalAdvisorBrief:
        """Synthesize user query and all active sub-hub reports into a unified PersonalAdvisorBrief."""
        prompt_parts = [f"User Primary Query: {query}\n"]

        if structural_output:
            prompt_parts.append(
                f"\n--- Sub-Hub 1 (Structural & Surgical) ---\n"
                f"{structural_output.model_dump_json(indent=2)}\n"
            )
        if internal_output:
            prompt_parts.append(
                f"\n--- Sub-Hub 2 (Internal Medicine & Holistic) ---\n"
                f"{internal_output.model_dump_json(indent=2)}\n"
            )
        if mental_health_output:
            prompt_parts.append(
                f"\n--- Sub-Hub 3 (Mental Health & Daily Function) ---\n"
                f"{mental_health_output.model_dump_json(indent=2)}\n"
            )

        prompt_parts.append(
            "\nSynthesize all sub-hub findings into a unified, ranked, evidence-based PersonalAdvisorBrief."
        )

        full_prompt = "".join(prompt_parts)
        response = self.cmo_agent.run(full_prompt)

        if isinstance(response.content, PersonalAdvisorBrief):
            return response.content
        elif isinstance(response.content, str):
            return PersonalAdvisorBrief.model_validate_json(response.content)
        elif isinstance(response.content, dict):
            return PersonalAdvisorBrief.model_validate(response.content)
        else:
            raise ValueError(f"Unexpected response content type: {type(response.content)}")
