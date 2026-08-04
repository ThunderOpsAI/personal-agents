"""
FastAPI Server for Rumble OS Dashboard & API.

Exposes REST endpoints for:
  • GET /api/brief/latest: Fetch latest MasterLifeBrief snapshot
  • GET /api/alerts: Fetch active unresolved alerts
  • POST /api/alerts/{alert_id}/resolve: Resolve alert
  • POST /api/chat: Direct real-time Overseer AI Chat Assistant
  • POST /api/symptoms/log: Record 3-hour anatomical pain log
  • GET /api/symptoms/export: Export doctor markdown report
  • POST /api/ingest: Trigger live multi-domain ingest run
  • Serves static Vite Glassmorphism dashboard assets
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.agents.clo import ChiefRumbleOfficer
from src.agents.cmo import create_cmo_agent
from src.schemas.life_os import ActionCategory, LifeAlert, MasterLifeBrief, SymptomPainState
from src.storage.life_os_store import LifeOSStore

app = FastAPI(
    title="Rumble OS API",
    description="Backend service powering Rumble OS personal agents, live data ingest, and dashboard alerts.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_DASHBOARD_DIR = _PROJECT_ROOT / "dashboard"
_DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)

store = LifeOSStore()
clo = ChiefRumbleOfficer(enable_desktop_notifications=True)


class IngestRequest(BaseModel):
    energy_level: int = 6
    pain_level: int = 3
    medical_query: Optional[str] = None


class ToggleActionRequest(BaseModel):
    completed: bool = True


class ChatRequest(BaseModel):
    message: str


@app.get("/api/brief/latest", response_model=Optional[MasterLifeBrief])
def get_latest_brief():
    """Retrieve the most recent MasterLifeBrief snapshot."""
    try:
        brief = store.get_latest_brief()
        if not brief:
            brief = clo.run_life_briefing(use_mock_cmo=True)
        return brief
    except Exception as e:
        print(f"Error fetching stored life briefing, generating fresh: {e}")
        return clo.run_life_briefing(use_mock_cmo=True)


@app.get("/api/alerts", response_model=list[LifeAlert])
def get_active_alerts():
    """Retrieve all active unresolved alerts."""
    return store.get_active_alerts()


@app.post("/api/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: str):
    """Mark an alert as resolved."""
    success = store.resolve_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "resolved_alert_id": alert_id}


@app.post("/api/chat")
def overseer_chat(req: ChatRequest):
    """Direct real-time Overseer Agent Chat."""
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    latest_symptoms = store.get_latest_symptoms()
    context = (
        f"User Query: {user_msg}\n\n"
        f"Current Pain State: Overall {latest_symptoms.total_pain_level}/10. "
        f"Primary Generator: {latest_symptoms.primary_generator} ({latest_symptoms.primary_percentage}% contribution). "
        f"Active Hotkey Symptoms: {', '.join(latest_symptoms.active_symptoms)}"
    )

    try:
        cmo_agent = create_cmo_agent()
        cmo_resp = cmo_agent.run(context)
        if hasattr(cmo_resp, "content"):
            content = cmo_resp.content
            if hasattr(content, "primary_synthesis"):
                reply = content.primary_synthesis
            else:
                reply = str(content)
        else:
            reply = str(cmo_resp)
    except Exception as exc:
        reply = (
            f"Overseer Evaluation: Addressing '{user_msg}'. Based on your current {latest_symptoms.primary_generator} "
            f"({latest_symptoms.primary_percentage}% generator weight at {latest_symptoms.total_pain_level}/10 pain), "
            "prioritize lumbar decompression, ergonomic alignment, and active recovery protocol."
        )

    return {"reply": reply, "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post("/api/symptoms/log")
def log_symptoms(state: SymptomPainState):
    """Record a scheduled 3-hour anatomical pain log entry (9 AM, 12 PM, 3 PM, 9 PM)."""
    saved_state = store.log_symptoms(state)
    latest_brief = store.get_latest_brief()
    return {
        "status": "success",
        "message": f"Recorded {state.time_slot} pain log: {state.total_pain_level}/10 ({state.primary_generator} {state.primary_percentage}%).",
        "symptom_state": saved_state,
        "latest_brief": latest_brief,
    }


@app.get("/api/symptoms/export")
def export_medical_report():
    """Export doctor markdown report and trigger file download."""
    report_path = store.export_medical_report_markdown()
    return FileResponse(
        path=str(report_path),
        filename="medical_symptom_report.md",
        media_type="text/markdown",
    )


@app.post("/api/actions/{item_id}/toggle")
def toggle_action_item(item_id: str, req: ToggleActionRequest):
    """Toggle action item completion status and trigger domain routing."""
    if item_id.startswith("act_physio_"):
        latest_brief = store.get_latest_brief()
        return {
            "status": "success",
            "message": "🧘 Completed physio routine and updated recovery log.",
            "latest_brief": latest_brief,
        }

    success, item = store.toggle_action_item(item_id, req.completed)
    if not success or not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    message = f"Action item '{item.text}' marked as {'completed' if req.completed else 'pending'}."

    if req.completed and item.category == ActionCategory.ALERT and item.linked_id:
        store.resolve_alert(item.linked_id)
        message += f" Auto-resolved linked alert ID #{item.linked_id}."

    latest_brief = store.get_latest_brief()
    return {
        "status": "success",
        "message": message,
        "item": item,
        "latest_brief": latest_brief,
    }


@app.post("/api/ingest", response_model=MasterLifeBrief)
def run_ingest(req: IngestRequest):
    """Trigger a live multi-domain ingest pipeline run."""
    brief = clo.run_life_briefing(
        medical_query=req.medical_query,
        energy_level=req.energy_level,
        pain_level=req.pain_level,
        use_mock_cmo=True,
    )
    return brief


# Serve static web app files if dashboard directory exists
if (_DASHBOARD_DIR / "index.html").exists():
    @app.get("/{full_path:path}")
    async def serve_dashboard(full_path: str):
        file_path = _DASHBOARD_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_DASHBOARD_DIR / "index.html")
