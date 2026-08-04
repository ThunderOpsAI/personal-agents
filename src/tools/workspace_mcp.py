"""
FastMCP Google Workspace Tools.

Defines local MCP tools for Gmail (`chat_with_gmail`) and Google Calendar (`google_calendar`),
including mock fallback capability for dry-run testing and offline operation.
"""

from __future__ import annotations

import json
from typing import Any, Dict, Optional
from fastmcp import FastMCP

from src.tools.google_auth import get_google_credentials

mcp = FastMCP("Google Workspace MCP Server")

# Mock store for dry-run / offline testing
MOCK_EMAILS = [
    {
        "id": "msg_001",
        "sender": "dr.smith@clinic.com",
        "subject": "Lab Results & Follow-up Appointment",
        "snippet": "Your recent blood panel results are ready. Please review and schedule a follow-up.",
        "priority": "High",
        "action_required": True,
        "summary": "Doctor Smith sent lab results with follow-up request.",
    },
    {
        "id": "msg_002",
        "sender": "billing@healthsystem.org",
        "subject": "Statement of Account - Claim #9948",
        "snippet": "Your EOB is ready. Outstanding balance of $120.00 is due by Aug 15.",
        "priority": "Medium",
        "action_required": True,
        "summary": "Medical bill statement for Claim #9948 ($120.00).",
    },
    {
        "id": "msg_003",
        "sender": "newsletter@healthdigest.com",
        "subject": "Weekly Wellness Tips",
        "snippet": "Top 5 posture exercises for desk workers.",
        "priority": "Low",
        "action_required": False,
        "summary": "Wellness newsletter.",
    },
]

MOCK_CALENDAR_EVENTS = [
    {
        "id": "evt_001",
        "summary": "Deep Focus / Spoons Recovery Block",
        "start_time": "2026-07-22T09:00:00+10:00",
        "end_time": "2026-07-22T11:30:00+10:00",
        "location": "Home Office",
        "is_protected_block": True,
        "description": "Shielded energy recovery & deep work block.",
    },
    {
        "id": "evt_002",
        "summary": "Physical Therapy Session",
        "start_time": "2026-07-22T14:00:00+10:00",
        "end_time": "2026-07-22T15:00:00+10:00",
        "location": "Movement Rehab Clinic",
        "is_protected_block": False,
        "description": "Lower back rehab exercises with therapist.",
    },
]


@mcp.tool()
def chat_with_gmail(
    action: str = "list",
    max_results: int = 5,
    query: Optional[str] = None,
    mock: bool = True,
) -> str:
    """
    Read, search, and triage emails from Gmail.

    Parameters:
    - action: 'list' or 'search'
    - max_results: Number of messages to fetch
    - query: Search query string (e.g., 'label:UNREAD')
    - mock: If True, uses mock data for dry-run testing
    """
    if mock:
        emails = MOCK_EMAILS
        if query:
            q_lower = query.lower()
            emails = [
                e for e in MOCK_EMAILS
                if q_lower in e["subject"].lower() or q_lower in e["snippet"].lower()
            ]
        return json.dumps(emails[:max_results], indent=2)

    creds = get_google_credentials()
    if not creds:
        return json.dumps({"error": "Google credentials not available. Run with mock=True for dry-run testing."})

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
            
            # Simple priority heuristic based on keywords or ticket patterns
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
    mock: bool = True,
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
    - mock: If True, uses mock storage for dry-run testing
    """
    global MOCK_CALENDAR_EVENTS

    if mock:
        if action == "list":
            return json.dumps(MOCK_CALENDAR_EVENTS, indent=2)
        elif action == "create":
            if not summary or not start_time or not end_time:
                return json.dumps({"error": "summary, start_time, and end_time required for create"})
            new_evt = {
                "id": f"evt_{len(MOCK_CALENDAR_EVENTS) + 1:03d}",
                "summary": summary,
                "start_time": start_time,
                "end_time": end_time,
                "location": "TBD",
                "is_protected_block": is_protected,
                "description": "Created via Executive Assistant",
            }
            MOCK_CALENDAR_EVENTS.append(new_evt)
            return json.dumps({"status": "success", "event": new_evt})
        elif action == "delete":
            if not event_id:
                return json.dumps({"error": "event_id required for delete"})
            MOCK_CALENDAR_EVENTS = [e for e in MOCK_CALENDAR_EVENTS if e["id"] != event_id]
            return json.dumps({"status": "success", "deleted_id": event_id})
        else:
            return json.dumps({"error": f"Unknown action '{action}'"})

    creds = get_google_credentials()
    if not creds:
        return json.dumps({"error": "Google credentials not available. Run with mock=True for dry-run testing."})

    try:
        from googleapiclient.discovery import build
        service = build("calendar", "v3", credentials=creds)
        if action == "list":
            events_result = service.events().list(calendarId="primary", maxResults=10, singleEvents=True, orderBy="startTime").execute()
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
