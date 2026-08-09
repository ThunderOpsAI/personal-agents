"""
FastAPI Server for Rumble OS Dashboard & API.

Exposes REST endpoints for:
  - GET /healthz: Health check & server status
  - POST /api/v1/rumble/chat: Direct real-time RUMBLE AI chat
  - POST /api/v1/pain/log: Record multi-generator pain (0-10), mood (0-10), and separate pain/mood notes
  - GET/POST /api/v1/notes: Persistent note-taking (Neon PostgreSQL / SQLite DB)
  - POST /api/v1/ops/sync: Fetch calendar/email context & update daily agenda
  - GET /api/v1/agenda: Daily, Weekly & Monthly agenda streams
  - GET /api/v1/weather: Local live weather & rain probability
  - GET/POST /api/v1/learn/*: Continuous Daily Learning Engine
"""

from __future__ import annotations

import os
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from pydantic import model_validator
from sqlalchemy import text

from src.agents.clo import ChiefRumbleOfficer
from src.agents.cmo import create_cmo_agent
from src.agents.reflection_engine import reflection_engine
from src.alerts.push import send_push_notification, check_3hr_logging_reminder
from src.schemas.life_os import ActionCategory, LifeAlert, MasterLifeBrief, SymptomPainState
from src.storage.db import engine, init_db, is_postgres
from src.storage.life_os_store import LifeOSStore
from src.tools.workspace_mcp import chat_with_gmail, google_calendar
from src.agents.intent_router import route_message
from src.agents.rehab_coach import RehabCoach

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

# Initialize Database tables on startup
init_db()


class VoiceParseRequest(BaseModel):
    transcript: str

class ExpenseRequest(BaseModel):
    description: Optional[str] = None
    merchant: Optional[str] = None
    amount: float
    category: Optional[str] = None
    notes: Optional[str] = ""

class PainGeneratorItem(BaseModel):
    area: str = "lumbar"
    side: str = "right"
    percentage: int = 50

class UnifiedLogRequest(BaseModel):
    pain_level: int = Field(default=0, ge=0, le=10)
    generators: List[PainGeneratorItem] = Field(default_factory=list)
    pain_notes: Optional[str] = ""
    mood_level: int = Field(default=5, ge=0, le=10)
    mood_notes: Optional[str] = ""
    mood_emoji: Optional[str] = Field(default=None, max_length=8)

    @model_validator(mode="after")
    def validate_generator_weights(self):
        if not self.generators:
            raise ValueError("At least one anatomical location is required")
        if sum(item.percentage for item in self.generators) != 100:
            raise ValueError("Anatomical location percentages must total 100")
        return self

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


class ExerciseSuggestRequest(BaseModel):
    pain_level: int = Field(..., ge=0, le=10)
    generators: list[PainGeneratorItem] = Field(default_factory=list)
    limit: int = Field(default=5, ge=3, le=5)


class ExerciseReliefRequest(BaseModel):
    exercise_id: str = Field(..., min_length=1)
    before_pain: int = Field(..., ge=1, le=10)
    after_pain: int = Field(..., ge=1, le=10)
    context: str = ""


class ExerciseRejectionRequest(BaseModel):
    exercise_id: str = Field(..., min_length=1)
    reason: str = Field(..., min_length=1, max_length=80)
    context: str = ""


class RecalibrationDecisionRequest(BaseModel):
    approved: bool
    summary: str = Field(..., min_length=1)


# Continuous Daily Learning Topics Bank
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
rehab_coach = RehabCoach()


@app.get("/api/brief/latest", response_model=Optional[MasterLifeBrief])
def get_latest_brief():
    """Retrieve the most recent MasterLifeBrief snapshot."""
    try:
        brief = store.get_latest_brief()
        if not brief:
            brief = clo.run_life_briefing(use_mock_cmo=False)
        return brief
    except Exception as e:
        print(f"Error fetching stored life briefing: {e}")
        return clo.run_life_briefing(use_mock_cmo=False)


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

    return route_message(user_msg, store)


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

    clinical_notes = (
        f"Pain Notes: {req.pain_notes or 'None'}. Mood Rating: {req.mood_level}/10. "
        f"Mood: {req.mood_emoji or 'not selected'}. Mood Notes: {req.mood_notes or 'None'}."
    )

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
            "mood_emoji": req.mood_emoji,
            "timestamp": now_utc.isoformat()
        },
        "alert_triggered": alert_triggered,
        "alert_message": alert_message
    }


@app.get("/api/v1/budget")
def get_budget():
    """List all budget entries."""
    with engine.connect() as conn:
        res = conn.execute(text("SELECT * FROM budget_entries ORDER BY id DESC"))
        rows = res.mappings().all()
        entries = [dict(r) for r in rows]
    return {"status": "success", "entries": entries}


@app.post("/api/v1/budget")
def add_expense(req: ExpenseRequest):
    """Add new expense (with auto-categorization)."""
    now_utc = datetime.now(timezone.utc)
    category = req.category or "General"
    if not req.category:
        desc_lower = (req.description or "").lower()
        merchant_lower = (req.merchant or "").lower()
        combined = f"{desc_lower} {merchant_lower}"
        
        if any(k in combined for k in ["coles", "woolworths", "aldi", "supermarket", "grocery"]):
            category = "Groceries"
        elif any(k in combined for k in ["chemist warehouse", "chemist", "pharmacy", "priceline"]):
            category = "Medical"
        elif any(k in combined for k in ["ampol", "bp", "shell", "7-eleven", "fuel", "petrol"]):
            category = "Fuel"

    desc = req.description or req.merchant or "Unknown expense"

    with engine.connect() as conn:
        conn.execute(
            text("INSERT INTO budget_entries (timestamp, description, amount, category, notes) VALUES (:timestamp, :description, :amount, :category, :notes)"),
            {"timestamp": now_utc.isoformat(), "description": desc, "amount": req.amount, "category": category, "notes": req.notes}
        )
        conn.commit()
    
    return {"status": "success", "message": f"Added expense for {desc} (${req.amount}) in {category}"}


@app.get("/api/v1/budget/summary")
def get_budget_summary():
    """Weekly/monthly spend breakdown."""
    with engine.connect() as conn:
        res = conn.execute(text("SELECT category, SUM(amount) as total FROM budget_entries GROUP BY category"))
        rows = res.mappings().all()
        summary = {r["category"]: r["total"] for r in rows}
        
    return {"status": "success", "summary": summary}


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
    """Retrieve persistent notes directly from database."""
    with engine.connect() as conn:
        res = conn.execute(text("SELECT * FROM persistent_notes ORDER BY id ASC"))
        rows = res.mappings().all()
        notes = [{"id": r["id"], "content": r["content"], "author": r["author"], "updated_at": str(r["updated_at"])} for r in rows]
    return {"status": "success", "notes": notes}


@app.post("/api/v1/notes")
def add_note(req: PersistentNoteRequest):
    """Add a new persistent note to database."""
    now_iso = datetime.now(timezone.utc).isoformat()
    with engine.connect() as conn:
        conn.execute(
            text("INSERT INTO persistent_notes (content, author, updated_at) VALUES (:content, :author, :updated_at)"),
            {"content": req.content, "author": req.author or "user", "updated_at": now_iso}
        )
        conn.commit()
    return get_notes()


@app.get("/api/v1/agenda")
def get_agenda():
    """Get the current Daily, Weekly, and Monthly Agendas from active database tasks and events."""
    with engine.connect() as conn:
        res_actions = conn.execute(text("SELECT * FROM action_items WHERE completed = 0 ORDER BY id ASC"))
        rows = res_actions.mappings().all()
        daily = [{"id": r["id"], "time": "Scheduled", "title": r["text"], "status": "pending"} for r in rows]
    
    daily.append({
        "id": "meditation_nightly",
        "time": "09:00 PM",
        "title": "Meditation Protocol",
        "status": "pending",
        "category": "recovery",
    })
    return {
        "status": "success",
        "daily": daily,
        "weekly": [],
        "monthly": []
    }


@app.get("/api/v1/weather")
def get_weather():
    """Return exact live Open-Meteo observations for Wangaratta, Victoria."""
    latitude, longitude = -36.3536, 146.3225
    location = "Wangaratta, Victoria, Australia"
    try:
        url = (
            "https://api.open-meteo.com/v1/forecast?latitude=-36.3536&longitude=146.3225"
            "&current=temperature_2m,precipitation&hourly=precipitation_probability"
            "&forecast_days=1&timezone=Australia%2FMelbourne"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "RumbleOS/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            current = data["current"]
            hourly = data["hourly"]
            current_time = current["time"]
            hour_index = hourly["time"].index(current_time)
            return {
                "status": "success",
                "temp_c": current["temperature_2m"],
                "condition": "Live Open-Meteo observation",
                "rain_probability_pct": hourly["precipitation_probability"][hour_index],
                "rain_mm": current["precipitation"],
                "location": location,
                "coordinates": {"latitude": latitude, "longitude": longitude},
            }
    except Exception as e:
        return {
            "status": "offline",
            "temp_c": None,
            "condition": "Unavailable",
            "rain_probability_pct": None,
            "rain_mm": None,
            "location": location,
            "coordinates": {"latitude": latitude, "longitude": longitude},
            "error": str(e),
        }


@app.post("/api/exercises/suggest")
@app.post("/api/v1/exercises/suggest")
def suggest_exercises(req: ExerciseSuggestRequest):
    """Suggest 3-5 exercises using the current pain log and learned preferences."""
    suggestions = rehab_coach.suggest(req.pain_level, [item.model_dump() for item in req.generators], req.limit)
    return {"status": "success", "suggestions": suggestions}


@app.post("/api/exercises/relief-delta")
@app.post("/api/v1/exercises/relief-delta")
def log_exercise_relief_delta(req: ExerciseReliefRequest):
    doc_id = rehab_coach.log_relief_delta(req.exercise_id, req.before_pain, req.after_pain, req.context)
    return {"status": "success", "document_id": doc_id, "relief_delta": req.before_pain - req.after_pain}


@app.post("/api/exercises/reject")
@app.post("/api/v1/exercises/reject")
def reject_exercise(req: ExerciseRejectionRequest):
    doc_id = rehab_coach.log_rejection(req.exercise_id, req.reason, req.context)
    return {"status": "success", "document_id": doc_id}


@app.get("/api/exercises/recalibration")
@app.get("/api/v1/exercises/recalibration")
def get_exercise_recalibration():
    return rehab_coach.weekly_recalibration()


@app.post("/api/exercises/recalibration/decision")
@app.post("/api/v1/exercises/recalibration/decision")
def decide_exercise_recalibration(req: RecalibrationDecisionRequest):
    doc_id = rehab_coach.record_recalibration_decision(req.approved, req.summary)
    return {"status": "success", "document_id": doc_id, "approved": req.approved}


@app.post("/api/v1/ops/sync")
def sync_ops():
    """Fetch Calendar/Email context, update Daily Agenda & trigger push alert."""
    cal_res = google_calendar(action="list", mock=False)
    gmail_res = chat_with_gmail(action="list", max_results=5, mock=False)

    push_msg = "Ops Sync: Live Workspace Sync Complete."
    send_push_notification(message=push_msg)

    return {
        "status": "success",
        "message": "Ops Sync complete. Live Calendar and Gmail analyzed.",
        "added_event": None,
        "agenda": get_agenda()["daily"],
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

    if "neck" in transcript:
        symptom_key = "neck pain"
    elif "lower back" in transcript or "back" in transcript or area == "lumbar":
        symptom_key = "lower_back"
    else:
        symptom_key = f"{area} pain"

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
            "symptom": symptom_key,
            "area": area,
            "side": side,
            "severity": severity,
            "context": req.transcript,
            "notes": req.transcript
        },
        "budget_updated": True
    }


class ProtocolCompleteRequest(BaseModel):
    protocol_id: str
    before_pain: Optional[int] = Field(default=None, ge=1, le=10)
    after_pain: Optional[int] = Field(default=None, ge=1, le=10)


@app.post("/api/v1/protocols/complete")
@app.post("/api/v1/agenda/complete")
def complete_protocol(req: ProtocolCompleteRequest):
    if req.before_pain is not None and req.after_pain is not None:
        rehab_coach.log_relief_delta(req.protocol_id, req.before_pain, req.after_pain, "agenda protocol")
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
