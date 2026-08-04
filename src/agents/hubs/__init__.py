"""Sub-Hub agents for Structural/Surgical, Internal Medicine, and Mental Health wings."""

from src.agents.hubs.internal import InternalHubAgent, create_internal_hub_agent
from src.agents.hubs.mental_health import MentalHealthHubAgent, create_mental_health_hub_agent
from src.agents.hubs.structural import StructuralHubAgent, create_structural_hub_agent

__all__ = [
    "InternalHubAgent",
    "MentalHealthHubAgent",
    "StructuralHubAgent",
    "create_internal_hub_agent",
    "create_mental_health_hub_agent",
    "create_structural_hub_agent",
]
