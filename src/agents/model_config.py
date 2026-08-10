"""Shared model configuration for Rumble OS agents."""
from __future__ import annotations
import os
from agno.models.google import Gemini

DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"

def gemini_model(model_id: str | None = None) -> Gemini:
    return Gemini(
        id=model_id or DEFAULT_GEMINI_MODEL,
        api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"),
    )
