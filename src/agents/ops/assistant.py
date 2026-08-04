"""
Executive Personal Assistant Agent.

Integrates FastMCP Google Workspace tools to manage schedule and email.
Enforces Calendar Recovery Guardrail:
  - Shields focus blocks & energy windows from meeting overrides.
  - Requires human-in-the-loop confirmation before applying mutations.
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

from agno.agent import Agent
from agno.models.openai import OpenAIChat

from src.schemas.ops import CalendarEvent, GuardrailDecision
from src.tools.workspace_mcp import chat_with_gmail, google_calendar

ASSISTANT_SYSTEM_PROMPT = """\
You are an Executive Personal Assistant.
Your job is to help manage the user's daily schedule, email communications, and operational tasks.

Guardrail Rules:
1. NEVER overwrite or override a protected focus block or recovery window without explicit human confirmation.
2. For any mutation (creating events, deleting events, sending emails), check the Calendar Recovery Guardrail rule first.
3. Keep the user informed with clear, concise, executive-level summaries.
"""


class CalendarRecoveryGuardrail:
    """Rule engine that shields focus blocks and energy windows from meeting overrides."""

    @staticmethod
    def evaluate_override(
        existing_events: List[Dict[str, Any]],
        new_event_start: str,
        new_event_end: str,
    ) -> GuardrailDecision:
        """Check if proposed new event overlaps with any protected focus/recovery block."""
        for evt in existing_events:
            if evt.get("is_protected_block"):
                # Overlap check (simplified string comparison for mock window matching)
                if (
                    evt.get("start_time") <= new_event_end
                    and evt.get("end_time") >= new_event_start
                ):
                    return GuardrailDecision(
                        allowed=False,
                        reason=f"Blocked! Proposed event conflicts with protected block '{evt.get('summary')}'.",
                        requires_human_confirmation=True,
                    )

        return GuardrailDecision(
            allowed=True,
            reason="No protected recovery blocks violated.",
            requires_human_confirmation=True,
        )


def create_executive_assistant_agent(
    *,
    model_id: Optional[str] = None,
    debug_mode: bool = False,
) -> Agent:
    """Build the Executive Personal Assistant agent equipped with FastMCP tools."""
    resolved_model = model_id or os.getenv("ASSISTANT_MODEL_ID", "gpt-4o")

    return Agent(
        name="ExecutiveAssistant",
        role="Executive Personal Assistant — Schedule & Email Manager",
        model=OpenAIChat(id=resolved_model),
        instructions=ASSISTANT_SYSTEM_PROMPT,
        tools=[chat_with_gmail, google_calendar],
        debug_mode=debug_mode,
    )
