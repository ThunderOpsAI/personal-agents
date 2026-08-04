"""
Google OAuth2 Token Manager.

Handles initial authorization, token persistence, and automatic refresh capability.
"""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/calendar",
]

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
TOKEN_PATH = _PROJECT_ROOT / "token.json"
CREDENTIALS_PATH = _PROJECT_ROOT / "credentials.json"


def get_google_credentials(
    credentials_path: Path = CREDENTIALS_PATH,
    token_path: Path = TOKEN_PATH,
    interactive: bool = False,
) -> Optional[Credentials]:
    """
    Load stored user credentials, auto-refresh if expired, or initiate OAuth2 flow.

    Returns Credentials if valid or refreshed; returns None if credentials are missing
    and interactive mode is disabled.
    """
    creds: Optional[Credentials] = None

    if token_path.exists():
        try:
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
        except Exception:
            creds = None

    if creds and creds.valid:
        return creds

    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(token_path, "w", encoding="utf-8") as token_file:
                token_file.write(creds.to_json())
            return creds
        except Exception:
            creds = None

    if not creds and interactive and credentials_path.exists():
        flow = InstalledAppFlow.from_client_secrets_file(str(credentials_path), SCOPES)
        creds = flow.run_local_server(port=0)
        with open(token_path, "w", encoding="utf-8") as token_file:
            token_file.write(creds.to_json())
        return creds

    return creds
