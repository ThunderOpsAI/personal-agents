"""
Agent Memory Wrapper.

Wraps any Agno Agent instance to automatically intercept reflections/feedback
and dynamically mutate instructions per turn using vector preference search.
"""

from __future__ import annotations

from typing import Any, Optional
from agno.agent import Agent

from src.memory.vector_store import VectorPreferenceStore
from src.memory.reflection import ReflectionEngine
from src.memory.prompt_mutator import DynamicPromptMutator


class MemoryWrappedAgent:
    """
    Wrapper class around Agno Agent that injects self-improving memory capabilities.
    """

    def __init__(
        self,
        agent: Agent,
        vector_store: Optional[VectorPreferenceStore] = None,
        persist_directory: Optional[str] = None,
        ephemeral: bool = False,
    ) -> None:
        """
        Initialize the MemoryWrappedAgent.

        Parameters
        ----------
        agent : Agent
            The base Agno agent instance.
        vector_store : VectorPreferenceStore | None
            Vector store instance. Created if not provided.
        persist_directory : str | None
            Persist path if creating vector store.
        ephemeral : bool
            Whether vector store should be ephemeral.
        """
        self.agent = agent
        self.base_instructions = agent.instructions

        if vector_store:
            self.vector_store = vector_store
        else:
            self.vector_store = VectorPreferenceStore(
                collection_name=f"{agent.name.lower()}_preferences" if agent.name else "agent_preferences",
                persist_directory=persist_directory,
                ephemeral=ephemeral,
            )

        self.reflection_engine = ReflectionEngine(self.vector_store)
        self.prompt_mutator = DynamicPromptMutator(self.vector_store)

    def log_user_override(
        self,
        override_text: str,
        category: Optional[str] = None,
    ) -> str:
        """
        Explicitly log a user correction or override rule.

        Parameters
        ----------
        override_text : str
            The correction/preference statement.
        category : str | None
            Category label.

        Returns
        -------
        str
            Document ID.
        """
        doc_id = self.reflection_engine.analyze_and_log(
            user_input=override_text,
            category=category,
        )
        return doc_id or ""

    def run(self, message: str, **kwargs: Any) -> Any:
        """
        Run the agent with dynamic system prompt mutation based on message context.

        Parameters
        ----------
        message : str
            User message / query.
        **kwargs
            Additional arguments passed to agent.run().

        Returns
        -------
        Any
            Response from agent.run().
        """
        # Mutate system prompt dynamically based on query
        mutated_instructions = self.prompt_mutator.mutate_prompt(
            base_prompt=self.base_instructions,
            query=message,
        )

        # Apply mutated instructions to agent
        self.agent.instructions = mutated_instructions

        try:
            response = self.agent.run(message, **kwargs)
        finally:
            # Restore base instructions to prevent persistent pollution
            self.agent.instructions = self.base_instructions

        return response
