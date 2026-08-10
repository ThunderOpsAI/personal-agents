"""
Application-wide configuration helpers.

Loads environment variables from ``.env`` and exposes a typed
``Settings`` object for the rest of the codebase.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root (two levels up from src/config.py)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
_ENV_PATH = _PROJECT_ROOT / ".env"

load_dotenv(dotenv_path=_ENV_PATH)


def get_gemini_api_key() -> str:
    """Return the Gemini API key or raise with a helpful message."""
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")
    if not key or key.startswith("your_"):
        raise EnvironmentError(
            "GEMINI_API_KEY is not set. "
            "Copy .env.example → .env and add your real key."
        )
    return key


# Backward-compatible alias for older callers; model agents now use Gemini.
get_openai_api_key = get_gemini_api_key
