"""
Hub 3: Mental Health & Daily Function Sub-Hub Agent.

Integrates with the `SpoonStore` SQLite state store to manage ADHD focus state,
chronic pain levels (1-10), and Spoon-Theory energy budgets. Outputs structured
`MentalHealthHubOutput` models.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from src.schemas.hubs import MentalHealthHubOutput
from src.storage.spoon_store import DailySpoonState, SpoonStore

MENTAL_HEALTH_HUB_SYSTEM_PROMPT = """\
You are the Mental Health & Daily Function Sub-Hub Specialist.
Your focus is neurodivergence (ADHD / executive function), chronic pain management,
occupational therapy pacing, and Spoon-Theory energy budgeting.

When analyzing the patient's current state:
1. Synthesize the interaction between ADHD focus state (e.g. hyperfocus vs executive dysfunction) and chronic pain load.
2. Evaluate remaining Spoon energy units and daily functional headroom.
3. Recommend specific energy pacing, sensory adaptation, and focus strategies.
4. Flag risk factors such as imminent burnout, sensory overload, or pain flares.
5. Formulate questions for therapists, psychiatrists, or occupational therapists.

Respond with valid JSON matching the `MentalHealthHubOutput` schema.
"""


class MentalHealthHubAgent:
    """Sub-Hub 3 Agent for Mental Health, ADHD Focus & Energy Budgeting."""

    def __init__(
        self,
        model_id: Optional[str] = None,
        db_path: Optional[str | Path] = None,
        debug_mode: bool = False,
    ) -> None:
        self.model_id = model_id or os.getenv("MENTAL_HEALTH_MODEL_ID", "gpt-4o")
        self.debug_mode = debug_mode
        self.store = SpoonStore(db_path=db_path)
        
        self.agent = Agent(
            name="MentalHealthHub",
            role="Mental Health & Daily Function Specialist",
            model=OpenAIChat(id=self.model_id),
            instructions=MENTAL_HEALTH_HUB_SYSTEM_PROMPT,
            output_schema=MentalHealthHubOutput,
            markdown=False,
            debug_mode=self.debug_mode,
        )

    def log_daily_state(
        self,
        pain_level: int,
        focus_state: str,
        total_spoons: float = 12.0,
        notes: str = "",
    ) -> DailySpoonState:
        """Record a new daily focus, pain, and energy baseline in SQLite."""
        return self.store.log_state(
            pain_level=pain_level,
            focus_state=focus_state,
            total_spoons=total_spoons,
            notes=notes,
        )

    def spend_energy(self, spoon_cost: float, activity: str) -> DailySpoonState:
        """Deduct spoons for a daily task or activity."""
        return self.store.spend_spoons(spoon_cost=spoon_cost, activity=activity)

    def analyze_daily_function(
        self,
        current_query: str = "Analyze my current daily functional capacity and pacing strategy.",
        pain_level: Optional[int] = None,
        focus_state: Optional[str] = None,
    ) -> MentalHealthHubOutput:
        """Fetch latest state (or log new state) and run structured analysis."""
        if pain_level is not None and focus_state is not None:
            state = self.log_daily_state(pain_level=pain_level, focus_state=focus_state)
        else:
            state = self.store.get_latest_state()
            if state is None:
                state = self.log_daily_state(pain_level=4, focus_state="balanced", total_spoons=12.0)

        prompt = (
            f"User Query: {current_query}\n\n"
            f"Current Spoon-Store Snapshot:\n"
            f"- Pain Level (1-10): {state.pain_level}\n"
            f"- ADHD Focus State: {state.focus_state}\n"
            f"- Available Spoons: {state.spoons_remaining} / {state.total_spoons}\n"
            f"- State Notes: {state.notes}\n"
        )

        response = self.agent.run(prompt)
        if isinstance(response.content, MentalHealthHubOutput):
            return response.content
        elif isinstance(response.content, str):
            return MentalHealthHubOutput.model_validate_json(response.content)
        elif isinstance(response.content, dict):
            return MentalHealthHubOutput.model_validate(response.content)
        else:
            raise ValueError(f"Unexpected response type: {type(response.content)}")


def create_mental_health_hub_agent(
    *,
    model_id: Optional[str] = None,
    db_path: Optional[str | Path] = None,
    debug_mode: bool = False,
) -> MentalHealthHubAgent:
    """Factory function to build and return a MentalHealthHubAgent instance."""
    return MentalHealthHubAgent(model_id=model_id, db_path=db_path, debug_mode=debug_mode)
