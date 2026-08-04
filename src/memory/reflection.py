"""
Reflection & Feedback Loop Module.

Intercepts user corrections, schedule overrides, or explicit medical preferences
(e.g., "Never schedule physical therapy on high-pain days") and logs them into
the vector preference store as structured events.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional
from src.memory.vector_store import VectorPreferenceStore


class ReflectionEngine:
    """
    Analyzes input interactions and explicit user feedback to extract and persist structured rules.
    """

    def __init__(self, vector_store: VectorPreferenceStore) -> None:
        """
        Initialize the ReflectionEngine with a vector preference store.

        Parameters
        ----------
        vector_store : VectorPreferenceStore
            The vector store instance where learned preferences will be logged.
        """
        self.vector_store = vector_store

    def analyze_and_log(
        self,
        user_input: str,
        category: Optional[str] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """
        Detect if user input contains a correction, override, or rule preference,
        and log it into the vector store.

        Parameters
        ----------
        user_input : str
            Raw text input or feedback from the user.
        category : str | None
            Override category. If None, auto-detected.
        extra_metadata : dict | None
            Additional metadata to attach.

        Returns
        -------
        str | None
            The document ID if logged, otherwise None.
        """
        detected_category = category or self._classify_category(user_input)
        
        # Log constraint/preference
        meta = extra_metadata.copy() if extra_metadata else {}
        meta["raw_input"] = user_input
        
        doc_id = self.vector_store.add_preference(
            text=user_input.strip(),
            category=detected_category,
            metadata=meta,
        )
        return doc_id

    def _classify_category(self, text: str) -> str:
        """Simple heuristic to classify preference type."""
        lower_text = text.lower()
        if any(word in lower_text for word in ["never", "don't", "do not", "avoid", "stop"]):
            return "medical_constraint"
        elif any(word in lower_text for word in ["schedule", "day", "appointment", "time"]):
            return "schedule_override"
        elif any(word in lower_text for word in ["prefer", "always", "like", "format"]):
            return "style_preference"
        return "user_preference"
