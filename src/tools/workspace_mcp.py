"""
FastMCP Google Workspace Tools.

Defines local MCP tools for Gmail (`chat_with_gmail`) and Google Calendar (`google_calendar`)
connecting to live Google Workspace APIs via OAuth2.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional
from fastmcp import FastMCP

from src.tools.google_auth import get_google_credentials

mcp = FastMCP("Google Workspace MCP Server")


@mcp.tool()
def chat_with_gmail(
    action: str = "list",
    max_results: int = 5,
    query: Optional[str] = None,
    mock: bool = False,
) -> str:
    """
    Read, search, and triage emails from Gmail.

    Parameters:
    - action: 'list' or 'search'
    - max_results: Number of messages to fetch
    - query: Search query string (e.g., 'label:UNREAD')
    - mock: Deprecated parameter kept for signature compatibility
    """
    creds = get_google_credentials()
    if not creds:
        return json.dumps({"error": "Google Workspace credentials not available. Please authorize via OAuth2."})

    try:
        from googleapiclient.discovery import build
        service = build("gmail", "v1", credentials=creds)
        q_str = query or ""
        results = service.users().messages().list(userId="me", maxResults=max_results, q=q_str).execute()
        messages = results.get("messages", [])
        
        summaries = []
        for msg in messages:
            detail = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
            headers = {h["name"].lower(): h["value"] for h in detail.get("payload", {}).get("headers", [])}
            sender = headers.get("from", "Unknown")
            subject = headers.get("subject", "(No Subject)")
            snippet = detail.get("snippet", "")
            
            is_high = any(k in subject.lower() or k in snippet.lower() for k in ["urgent", "action", "ticket", "ritm", "fid", "due", "important", "deakin"])
            
            summaries.append({
                "id": detail.get("id"),
                "sender": sender,
                "subject": subject,
                "snippet": snippet,
                "priority": "High" if is_high else "Medium",
                "action_required": is_high,
                "summary": snippet,
            })
        return json.dumps(summaries, indent=2)

    except Exception as exc:
        return json.dumps({"error": f"Failed to execute Gmail request: {str(exc)}"})


@mcp.tool()
def google_calendar(
    action: str = "list",
    event_id: Optional[str] = None,
    summary: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    is_protected: bool = False,
    mock: bool = False,
) -> str:
    """
    Inspect or update Google Calendar events.

    Parameters:
    - action: 'list', 'create', or 'delete'
    - event_id: Target event ID (for delete)
    - summary: Event title (for create)
    - start_time: Start time ISO string (for create)
    - end_time: End time ISO string (for create)
    - is_protected: Marks event as a protected recovery/focus block
    - mock: Deprecated parameter kept for signature compatibility
    """
    creds = get_google_credentials()
    if not creds:
        return json.dumps({"error": "Google Workspace credentials not available. Please authorize via OAuth2."})

    try:
        from googleapiclient.discovery import build
        service = build("calendar", "v3", credentials=creds)
        if action == "list":
            list_kwargs = {"calendarId": "primary", "maxResults": 250, "singleEvents": True, "orderBy": "startTime"}
            if start_time:
                list_kwargs["timeMin"] = start_time
            if end_time:
                list_kwargs["timeMax"] = end_time
            events_result = service.events().list(**list_kwargs).execute()
            items = events_result.get("items", [])
            formatted = []
            for item in items:
                formatted.append({
                    "id": item.get("id"),
                    "summary": item.get("summary", "(No Title)"),
                    "start_time": item.get("start", {}).get("dateTime") or item.get("start", {}).get("date"),
                    "end_time": item.get("end", {}).get("dateTime") or item.get("end", {}).get("date"),
                    "location": item.get("location"),
                    "is_protected_block": "recovery" in item.get("summary", "").lower() or "focus" in item.get("summary", "").lower(),
                    "description": item.get("description"),
                })
            return json.dumps(formatted, indent=2)
        elif action == "create":
            body = {
                "summary": summary,
                "start": {"dateTime": start_time},
                "end": {"dateTime": end_time},
            }
            created = service.events().insert(calendarId="primary", body=body).execute()
            return json.dumps({"status": "success", "event_id": created.get("id")})
        elif action == "delete":
            service.events().delete(calendarId="primary", eventId=event_id).execute()
            return json.dumps({"status": "success", "deleted_id": event_id})
        else:
            return json.dumps({"error": f"Unknown action '{action}'"})
    except Exception as exc:
        return json.dumps({"error": f"Failed to execute Calendar request: {str(exc)}"})


def create_tools_package() -> Dict[str, Any]:
    """Expose tools to python code directly without launching full MCP server transport."""
    return {
        "chat_with_gmail": chat_with_gmail,
        "google_calendar": google_calendar,
    }
