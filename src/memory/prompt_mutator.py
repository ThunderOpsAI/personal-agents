"""
Dynamic Prompt Mutator.

Decorator / helper that queries ChromaDB per turn for relevant user rules
and appends them dynamically as a `[Learned User Preferences]` block to
agent system prompts without overwriting base system prompts or safety boundaries.
"""

from __future__ import annotations

from typing import List, Dict, Any
from src.memory.vector_store import VectorPreferenceStore


class DynamicPromptMutator:
    """
    Safely mutates system prompts by retrieving relevant preferences from ChromaDB.
    """

    def __init__(self, vector_store: VectorPreferenceStore) -> None:
        """
        Initialize the DynamicPromptMutator.

        Parameters
        ----------
        vector_store : VectorPreferenceStore
            The vector store containing learned preferences.
        """
        self.vector_store = vector_store

    def mutate_prompt(self, base_prompt: str, query: str, n_results: int = 3) -> str:
        """
        Query vector store for query-relevant preferences and append a
        [Learned User Preferences] block to the base prompt.

        Parameters
        ----------
        base_prompt : str
            The base immutable system prompt of the agent.
        query : str
            Current user query context to search relevant preferences for.
        n_results : int
            Number of relevant preferences to include.

        Returns
        -------
        str
            The augmented system prompt.
        """
        preferences = self.vector_store.query_preferences(query=query, n_results=n_results)
        
        if not preferences:
            # Fallback to get general preferences if semantic search returned nothing
            preferences = self.vector_store.get_all_preferences()[:n_results]

        if not preferences:
            return base_prompt

        pref_lines: List[str] = []
        for p in preferences:
            text = p["text"]
            cat = p.get("metadata", {}).get("category", "preference")
            pref_lines.append(f"- [{cat.upper()}] {text}")

        preference_block = (
            "\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "## [Learned User Preferences]\n"
            "The following user constraints, feedback, and preferences have been learned from past interactions. "
            "You MUST adhere to these rules alongside your base identity and safety rules:\n\n"
            + "\n".join(pref_lines)
            + "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        )

        # Append to base prompt (ensures base prompt & safety bounds remain pristine)
        return base_prompt + preference_block
