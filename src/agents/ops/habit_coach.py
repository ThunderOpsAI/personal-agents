"""
Habit & Focus Coach Agent.

Reads spoon energy / pain state to adjust daily goals dynamically.
"""

from __future__ import annotations

import os
from typing import Optional

from agno.agent import Agent
from src.agents.model_config import DEFAULT_GEMINI_MODEL, gemini_model

from src.schemas.ops import SpoonState

HABIT_COACH_PROMPT = """\
You are the Habit & Focus Coach.
Your purpose is to evaluate the user's current spoon (energy) and pain state and dynamically adjust daily productivity expectations.

Rulebook:
- Spoons 8-10, Pain 0-2: High energy! Recommend up to 6 hours deep focus time. Push ambitious goals.
- Spoons 5-7, Pain 3-5: Moderate state. Cap focus at 3-4 hours with frequent 15-min recovery blocks.
- Spoons 1-4, Pain 6-10: Low energy / high pain flare. Strict energy preservation! Limit to 1-2 essential tasks (max 1.5 hours focus total). Mandatory rest blocks.
"""


class HabitCoach:
    """Helper engine for spoon state calculation."""

    @staticmethod
    def calculate_spoon_state(energy_level: int, pain_level: int) -> SpoonState:
        if energy_level >= 8 and pain_level <= 2:
            return SpoonState(
                energy_level=energy_level,
                pain_level=pain_level,
                recommended_focus_hours=8.0,
                advice="High energy day! Full 8.0 hours focus target for deep work and strategic execution.",
            )
        elif energy_level >= 5 and pain_level <= 5:
            return SpoonState(
                energy_level=energy_level,
                pain_level=pain_level,
                recommended_focus_hours=5.0,
                advice="Moderate spoons. Target 5.0 focus hours with structured heat pack & recovery breaks.",
            )
        else:
            return SpoonState(
                energy_level=energy_level,
                pain_level=pain_level,
                recommended_focus_hours=2.5,
                advice="Low spoons / elevated pain. Pace yourself! Limit to 2.5 focus hours with active recovery.",
            )



def create_habit_coach_agent(
    *,
    model_id: Optional[str] = None,
    debug_mode: bool = False,
) -> Agent:
    """Build the Habit & Focus Coach agent."""
    resolved_model = model_id or os.getenv("COACH_MODEL_ID", DEFAULT_GEMINI_MODEL)

    return Agent(
        name="HabitCoach",
        role="Habit & Focus Coach — Energy & Spoon Manager",
        model=gemini_model(resolved_model),
        instructions=HABIT_COACH_PROMPT,
        output_schema=SpoonState,
        debug_mode=debug_mode,
    )
