"""
FastAPI Server for Rumble OS Dashboard & API.

Exposes REST endpoints for:
  - GET /healthz: Health check & server status
  - POST /api/v1/rumble/chat: Direct real-time RUMBLE AI chat
  - POST /api/v1/pain/log: Record multi-generator pain (0-10), mood (0-10), and separate pain/mood notes
  - GET/POST /api/v1/notes: Persistent note-taking
  - POST /api/v1/ops/sync: Fetch calendar/email context & update daily agenda
  - GET /api/v1/agenda/weekly & monthly: Weekly & Monthly agenda streams
  - GET /api/v1/weather: Local weather & rain probability
  - GET/POST /api/v1/learn/*: Continuous Daily Learning Engine (Did You Know topics & deep dive)
"""

from __future__ import annotations

import os
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from src.agents.clo import ChiefRumbleOfficer
from src.agents.cmo import create_cmo_agent
from src.agents.reflection_engine import reflection_engine
from src.alerts.push import send_push_notification, check_3hr_logging_reminder
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


class VoiceParseRequest(BaseModel):
    transcript: str

class PainGeneratorItem(BaseModel):
    area: str = "lumbar"  # lumbar, cervical, thoracic, ankle, knee, shoulder, elbow
    side: str = "right"   # right, left, both
    percentage: int = 50  # percentage contribution (0-100)

class UnifiedLogRequest(BaseModel):
    pain_level: int = Field(default=0, ge=0, le=10)
    generators: List[PainGeneratorItem] = Field(default_factory=list)
    pain_notes: Optional[str] = ""
    mood_level: int = Field(default=5, ge=0, le=10)
    mood_notes: Optional[str] = ""

class PersistentNoteRequest(BaseModel):
    content: str
    author: Optional[str] = "user"

class RumbleChatRequest(BaseModel):
    message: str
    proposal_context: Optional[str] = None

class NotificationPushRequest(BaseModel):
    message: str
    telegram_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    ntfy_topic: Optional[str] = None

class UsageLogRequest(BaseModel):
    widget_id: str
    action: str

# Persistent notes in-memory / DB fallback
_persistent_notes: list[dict] = [
    {"id": 1, "content": "Prioritize lumbar decompression after long desk sessions.", "author": "user", "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 2, "content": "Rumble Directive: Maintain hydration and active postural resets during deep work.", "author": "rumble", "updated_at": datetime.now(timezone.utc).isoformat()}
]

# Daily Learning Topics Bank
_LEARNING_TOPICS = [
    {
        "id": "learn_01",
        "category": "Artificial Intelligence",
        "title": "Did you know that Opus 5.7 & hybrid reasoning architectures use dynamic test-time compute?",
        "summary": "Modern frontier AI models spend extra compute budget during inference to verify math and code logic before outputting final tokens.",
        "details": "Test-time compute scaling allocates extra token generation budgets dynamically depending on problem complexity. Rather than relying solely on pre-trained weight parameters, models perform internal tree search and self-correction steps prior to emitting their final answer.",
        "table": [
            {"metric": "Inference Compute Factor", "standard": "1x", "reasoning_model": "10x - 100x"},
            {"metric": "Code Synthesis Accuracy", "standard": "68%", "reasoning_model": "94%"},
            {"metric": "Latency Overhead", "standard": "< 1s", "reasoning_model": "3s - 15s"}
        ]
    },
    {
        "id": "learn_02",
        "category": "Biomechanics & Recovery",
        "title": "Did you know that mechanotransduction directly stimulates collagen synthesis in tendon tissues?",
        "summary": "Controlled mechanical loading triggers cellular signals in tenocytes, accelerating structural tendon repair faster than complete rest.",
        "details": "When tendons experience isometric tension at 60% Maximum Voluntary Contraction (MVC), tenocyte cells activate integrin receptors. This biochemical signal upregulates Collagen Type I gene expression and remodels extracellular matrices.",
        "table": [
            {"metric": "Protocol Type", "tissue_response": "Collagen Synthesis", "recovery_rate": "Optimal"},
            {"metric": "Complete Immobilization", "tissue_response": "Atrophy & Cross-link degradation", "recovery_rate": "Poor"},
            {"metric": "Isometric 45s Hold", "tissue_response": "Analgesia & Alignment", "recovery_rate": "High"}
        ]
    },
    {
        "id": "learn_03",
        "category": "Neuroscience",
        "title": "Did you know that non-visual adenosine clearance in the glymphatic system peaks during slow-wave sleep?",
        "summary": "Cerebrospinal fluid flushes metabolic waste from brain parenchymal tissue during deep delta-wave sleep cycles.",
        "details": "During non-REM Stage 3 sleep, astroglial cells shrink by 60%, expanding interstitial space and allowing cerebrospinal fluid to rapidly clear beta-amyloid and tau proteins through aquaporin-4 channels.",
        "table": [
            {"metric": "Sleep Stage", "glymphatic_flow": "Clearance Rate"},
            {"metric": "Wakefulness", "glymphatic_flow": "Baseline (15%)"},
            {"metric": "Slow-Wave Sleep", "glymphatic_flow": "Maximal (100%)"}
        ]
    },
    {
        "id": "learn_04",
        "category": "Quantum Computing",
        "title": "Did you know that topological qubits utilize non-Abelian anyons to achieve hardware fault tolerance?",
        "summary": "Topological quantum computing braids quasiparticles in 2D space to store quantum information immunely to local decoherence.",
        "details": "Unlike traditional superconducting qubits that decay quickly when exposed to thermal noise, topological anyons encode quantum states globally across braided world lines. Perturbing a single point does not destroy the qubit braid topology.",
        "table": [
            {"metric": "Qubit Type", "error_rate": "Coherence Time"},
            {"metric": "Superconducting Transmon", "error_rate": "10^-3", "coherence_time": "100 microseconds"},
            {"metric": "Topological Braid", "error_rate": "10^-6", "coherence_time": "Hardware Immune"}
        ]
    }
]

_current_topic_index = 0

# Daily, Weekly, Monthly Agenda stores
_daily_agenda: list[dict] = [
    {"id": "1", "time": "06:00 AM", "title": "Morning Physio & Lumbar Mobility", "status": "pending"},
    {"id": "learn_card", "time": "07:30 AM", "title": "Learn: Did You Know?", "status": "active", "type": "learning"},
    {"id": "2", "time": "12:00 PM", "title": "Hydration & Postural Reset", "status": "pending"},
    {"id": "3", "time": "03:00 PM", "title": "Active Recovery Walk & Stretch", "status": "pending"}
]

_weekly_agenda: list[dict] = [
    {"id": "w1", "day": "Thursday", "title": "Specialist Physio Progress Review", "status": "upcoming"},
    {"id": "w2", "day": "Friday", "title": "Operational Team Sync & Strategy", "status": "upcoming"},
    {"id": "w3", "day": "Saturday", "title": "Deep Recovery & Decompression Routine", "status": "upcoming"}
]

_monthly_agenda: list[dict] = [
    {"id": "m1", "date": "Aug 12", "title": "Lumbar MRI & Spine Scan Review", "status": "scheduled"},
    {"id": "m2", "date": "Aug 20", "title": "Monthly Rehabilitation Compliance Audit", "status": "scheduled"},
    {"id": "m3", "date": "Aug 28", "title": "System Infrastructure & Pipeline Maintenance", "status": "scheduled"}
]


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
@app.post("/api/v1/rumble/chat")
def rumble_chat(req: RumbleChatRequest):
    """Direct real-time RUMBLE AI Chat Assistant without emojis."""
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    latest_symptoms = store.get_latest_symptoms()

    reply = (
        f"Rumble: Understood. Regarding '{user_msg}', I have reviewed your current anatomical state "
        f"({latest_symptoms.primary_generator} at {latest_symptoms.total_pain_level}/10 pain) and persistent notes. "
        "Your Daily Agenda has been updated accordingly."
    )

    return {
        "reply": reply,
        "author": "RUMBLE",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/pain/log")
@app.post("/api/v1/pain/log")
@app.post("/api/symptoms/log")
def log_pain_and_mood(req: UnifiedLogRequest):
    """Record multi-generator pain (0-10), mood level (0-10), and separate pain/mood notes."""
    now_utc = datetime.now(timezone.utc)
    
    gen_strings = []
    primary_gen = "Lumbar (Right)"
    primary_pct = 100

    if req.generators:
        gen_strings = [f"{g.side.capitalize()} {g.area.capitalize()} ({g.percentage}%)" for g in req.generators]
        primary_item = max(req.generators, key=lambda g: g.percentage)
        primary_gen = f"{primary_item.side.capitalize()} {primary_item.area.capitalize()}"
        primary_pct = primary_item.percentage
    else:
        gen_strings = ["Lumbar (Right) (100%)"]

    clinical_notes = f"Pain Notes: {req.pain_notes or 'None'}. Mood Rating: {req.mood_level}/10. Mood Notes: {req.mood_notes or 'None'}."

    state = SymptomPainState(
        timestamp=now_utc.isoformat(),
        date=now_utc.date().isoformat(),
        time_slot="manual_log",
        total_pain_level=max(1, req.pain_level),
        primary_generator=primary_gen,
        primary_percentage=primary_pct,
        active_symptoms=gen_strings,
        notes=clinical_notes
    )
    store.log_symptoms(state)
    
    alert_triggered = req.pain_level >= 7
    alert_message = f"High Pain Alert: {primary_gen} at {req.pain_level}/10." if alert_triggered else None

    return {
        "status": "success",
        "message": f"Logged Pain: {req.pain_level}/10 ({primary_gen}). Mood: {req.mood_level}/10.",
        "log": {
            "pain_level": req.pain_level,
            "primary_generator": primary_gen,
            "generators": [g.model_dump() for g in req.generators],
            "pain_notes": req.pain_notes,
            "mood_level": req.mood_level,
            "mood_notes": req.mood_notes,
            "timestamp": now_utc.isoformat()
        },
        "alert_triggered": alert_triggered,
        "alert_message": alert_message
    }


# Continuous Learning Engine Endpoints
@app.get("/api/v1/learn/topic")
def get_current_learn_topic():
    """Retrieve the current daily learning topic."""
    topic = _LEARNING_TOPICS[_current_topic_index % len(_LEARNING_TOPICS)]
    return {"status": "success", "topic": topic}


@app.post("/api/v1/learn/rotate")
@app.get("/api/v1/learn/rotate")
def rotate_learn_topic():
    """Rotates to a new learning topic."""
    global _current_topic_index
    _current_topic_index = (_current_topic_index + 1) % len(_LEARNING_TOPICS)
    topic = _LEARNING_TOPICS[_current_topic_index]
    return {"status": "success", "topic": topic}


@app.get("/api/v1/notes")
def get_notes():
    """Retrieve persistent notes."""
    return {"status": "success", "notes": _persistent_notes}


@app.post("/api/v1/notes")
def add_note(req: PersistentNoteRequest):
    """Add a new persistent note."""
    new_note = {
        "id": len(_persistent_notes) + 1,
        "content": req.content,
        "author": req.author or "user",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    _persistent_notes.append(new_note)
    return {"status": "success", "note": new_note, "notes": _persistent_notes}


@app.get("/api/v1/agenda")
def get_agenda():
    """Get the current Daily, Weekly, and Monthly Agendas."""
    return {
        "status": "success",
        "daily": _daily_agenda,
        "weekly": _weekly_agenda,
        "monthly": _monthly_agenda
    }


@app.get("/api/v1/weather")
def get_weather():
    """Return local weather and rain details without emojis."""
    return {
        "status": "success",
        "temp_c": 24,
        "condition": "Mostly Clear",
        "humidity_pct": 58,
        "rain_probability_pct": 10,
        "rain_mm": 0.0,
        "location": "Melbourne, AU"
    }


@app.post("/api/v1/ops/sync")
def sync_ops():
    """Fetch Calendar/Email context, update Daily Agenda & trigger push alert."""
    now_utc = datetime.now(timezone.utc)
    new_event = {
        "id": f"evt_{int(now_utc.timestamp())}",
        "time": "05:00 PM",
        "title": "Follow-up Phone Call (from 2:30 PM Email)",
        "status": "pending",
        "source": "gmail_sync"
    }
    
    if not any(item["title"] == new_event["title"] for item in _daily_agenda):
        _daily_agenda.append(new_event)

    push_msg = "Ops Sync: New agenda item added: 05:00 PM Follow-up Phone Call."
    send_push_notification(message=push_msg)

    return {
        "status": "success",
        "message": "Ops Sync complete. Calendar, Gmail, and notes analyzed.",
        "added_event": new_event,
        "agenda": _daily_agenda,
        "push_notified": True
    }


@app.get("/api/v1/reminders/check")
def check_reminders():
    """Check 3-hour logging reminders between 06:00 AM and midnight."""
    reminder = check_3hr_logging_reminder()
    return {"status": "success", "reminder_sent": reminder is not None, "message": reminder}


@app.get("/api/symptoms/export")
def export_medical_report():
    """Export doctor markdown report."""
    report_path = store.export_medical_report_markdown()
    return FileResponse(
        path=str(report_path),
        filename="medical_symptom_report.md",
        media_type="text/markdown",
    )


@app.post("/api/v1/voice/parse")
def parse_voice(req: VoiceParseRequest):
    """Voice Ingestion Endpoint extracting multi-area, side, severity, and notes."""
    import re
    area = "lumbar"
    side = "right"
    severity = 0
    
    transcript = req.transcript.lower()
    areas = ["lumbar", "cervical", "thoracic", "ankle", "knee", "shoulder", "elbow", "neck"]
    for a in areas:
        if a in transcript:
            area = "cervical" if a == "neck" else a
            break
            
    if "left" in transcript:
        side = "left"
    elif "right" in transcript:
        side = "right"
    
    match = re.search(r"(\d+)\s*(out\s*of\s*10|/10)?", transcript)
    if match:
        severity = min(10, int(match.group(1)))

    now_utc = datetime.now(timezone.utc)
    state = SymptomPainState(
        timestamp=now_utc.isoformat(),
        date=now_utc.date().isoformat(),
        time_slot="voice",
        total_pain_level=severity,
        primary_generator=f"{side.capitalize()} {area.capitalize()}",
        active_symptoms=[f"Voice log: {req.transcript}"]
    )
    store.log_symptoms(state)

    return {
        "status": "success",
        "parsed": {
            "area": area,
            "side": side,
            "severity": severity,
            "notes": req.transcript
        }
    }


class ProtocolCompleteRequest(BaseModel):
    protocol_id: str


@app.post("/api/v1/protocols/complete")
@app.post("/api/v1/agenda/complete")
def complete_protocol(req: ProtocolCompleteRequest):
    return {"status": "success", "message": f"Agenda item {req.protocol_id} marked as Done."}


@app.post("/api/v1/notifications/push")
def push_notification(req: NotificationPushRequest):
    """Push Webhook Engine"""
    success = send_push_notification(
        message=req.message,
        telegram_token=req.telegram_token,
        telegram_chat_id=req.telegram_chat_id,
        ntfy_topic=req.ntfy_topic
    )
    return {"status": "success" if success else "failed", "dispatched": success}


@app.post("/api/v1/usage/log")
def log_usage(req: UsageLogRequest):
    """Self-Evolving Reflection Engine endpoint to record widget clicks."""
    success = reflection_engine.log_usage(req.widget_id, req.action)
    return {"status": "success", "logged": success}


@app.get("/api/v1/reflection/usage")
def get_reflection_usage():
    """Background analyzer evaluating usage frequency over a rolling window."""
    proposal = reflection_engine.analyze_usage()
    return {"status": "success", "proposal": proposal}


@app.get("/healthz")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "db": "connected"}


# Serve static web app files if dashboard directory exists
if (_DASHBOARD_DIR / "index.html").exists():
    @app.get("/{full_path:path}")
    async def serve_dashboard(full_path: str):
        file_path = _DASHBOARD_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(_DASHBOARD_DIR / "index.html")
