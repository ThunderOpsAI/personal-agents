"""
FastAPI/HTTP Server for Rumble OS Dashboard & Data Persistence.
Serves static dashboard assets and REST API endpoints.
"""

from __future__ import annotations

import os
import json
import random
import re
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

PROJECT_ROOT = Path(__file__).resolve().parent
DASHBOARD_DIR = PROJECT_ROOT / "dashboard"
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

PAIN_FILE = DATA_DIR / "pain.json"
BUDGET_FILE = DATA_DIR / "budget.json"
NOTES_FILE = DATA_DIR / "notes.json"
VOICE_FILE = DATA_DIR / "voice.json"
WEATHER_FILE = DATA_DIR / "weather.json"
REHAB_FILE = DATA_DIR / "rehab.json"
AGENDA_FILE = DATA_DIR / "agenda.json"

def load_json(filepath: Path, default_data: Any) -> Any:
    if not filepath.exists():
        save_json(filepath, default_data)
        return default_data
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default_data

def save_json(filepath: Path, data: Any) -> None:
    temp_path = filepath.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    temp_path.replace(filepath)

def init_data_store():
    load_json(PAIN_FILE, [
        {
            "id": 1,
            "pain_score": 4,
            "mood": 7,
            "location_breakdown": {"lumbar": 80, "cervical": 20},
            "notes": "Mild right lumbar tightness in morning",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ])
    load_json(BUDGET_FILE, [
        {
            "id": 1,
            "description": "Coles Express",
            "amount": 64.50,
            "category": "Groceries",
            "notes": "Weekly essential groceries",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": 2,
            "description": "Chemist Warehouse",
            "amount": 28.95,
            "category": "Medical",
            "notes": "Magnesium supplements & pain patches",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ])
    load_json(NOTES_FILE, [
        {
            "id": 1,
            "title": "Physio Follow-up",
            "content": "Ask physiotherapist about eccentric calf raises and lumbar decompression progression.",
            "category": "follow_up",
            "author": "user",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ])
    load_json(VOICE_FILE, [])
    load_json(AGENDA_FILE, {
        "daily": [
            {"id": "task_1", "time": "08:00 AM", "title": "Morning Rehab Routine & Hydration", "status": "pending", "category": "rehab"},
            {"id": "task_2", "time": "12:30 PM", "title": "Midday Lumbar Micro-Break & Walk", "status": "pending", "category": "break"},
            {"id": "task_3", "time": "06:00 PM", "title": "Evening Core Activation & Journal", "status": "pending", "category": "rehab"}
        ]
    })

init_data_store()

def categorize_expense(description: str, explicit_category: Optional[str] = None) -> str:
    if explicit_category and explicit_category.strip():
        return explicit_category.strip()
    desc = description.lower()
    if any(k in desc for k in ["coles", "woolworths", "aldi", "supermarket", "grocery"]):
        return "Groceries"
    elif any(k in desc for k in ["chemist warehouse", "chemist", "pharmacy", "medical"]):
        return "Medical"
    elif any(k in desc for k in ["ampol", "bp", "shell", "7-eleven fuel", "fuel", "petrol"]):
        return "Fuel"
    return "General"

def parse_amount(text: str) -> Optional[float]:
    match = re.search(r'\$?([0-9]+(?:\.[0-9]{1,2})?)', text)
    if match:
        value = float(match.group(1))
        if value > 0:
            return round(value, 2)
    return None

def parse_pain_score(text: str) -> Optional[int]:
    match = re.search(r'(?:pain|ache|hurt|sore|tightness|stiff).*?(\d{1,2})(?:\s*/\s*10| out of 10)?', text)
    if match:
        score = int(match.group(1))
        return max(0, min(10, score))
    match = re.search(r'\b(ten|nine|eight|seven|six|five|four|three|two|one|zero)\b', text)
    if match:
        words = {
            'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
            'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        }
        return words.get(match.group(1), None)
    return None

def parse_pain_locations(text: str) -> Dict[str, int]:
    location = {}
    mapping = {
        'lumbar': 'lumbar', 'lower back': 'lumbar', 'cervical': 'cervical', 'neck': 'cervical',
        'knee': 'knee', 'shoulder': 'shoulder', 'ankle': 'ankle', 'hip': 'hip', 'thoracic': 'thoracic'
    }
    for phrase, key in mapping.items():
        if phrase in text:
            location[key] = 100
    if not location:
        location['lumbar'] = 100
    return location

def generate_medical_triage_advice() -> str:
    medical_context_file = PROJECT_ROOT / 'agent_reports' / 'MEDICAL_CONTEXT.md'
    if medical_context_file.exists():
        try:
            with open(medical_context_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if content:
                    summary = content.splitlines()[:4]
                    return ' '.join(line.strip() for line in summary if line.strip())[:540] + '...'
        except Exception:
            pass
    return 'Review your medical context file and consult a clinician for tailored guidance on symptoms, rehab, and medication.'

def append_agenda_item(title: str, category: str = 'task') -> Dict[str, Any]:
    agenda_data = load_json(AGENDA_FILE, {})
    daily = agenda_data.setdefault('daily', [])
    next_id = f'task_{len(daily) + 1}'
    item = {
        'id': next_id,
        'time': 'ASAP',
        'title': title,
        'status': 'pending',
        'category': category
    }
    daily.append(item)
    save_json(AGENDA_FILE, agenda_data)
    return item

def build_voice_parse_response(transcript: str) -> Dict[str, Any]:
    normalized = transcript.lower()
    if any(keyword in normalized for keyword in ['expense', 'paid', 'bought', 'purchase', 'receipt', 'bill', 'spend']):
        amount = parse_amount(normalized)
        merchant = None
        merchant_match = re.search(r'at ([\w\s]+?)(?: for| of |\.|,|$)', normalized)
        if merchant_match:
            merchant = merchant_match.group(1).strip()
        description = merchant or 'Expense'
        if amount is None:
            amount = 0.0
        expense_payload = ExpensePayload(description=description, merchant=merchant, amount=amount)
        expense_response = add_expense(expense_payload)
        return {
            'intent': 'ADD_EXPENSE',
            'reply': f"RUMBLE: Logged expense {description} for ${amount:.2f}.",
            'expense': expense_response['expense']
        }
    if any(keyword in normalized for keyword in ['task', 'todo', 'to-do', 'follow up', 'follow-up', 'remind me', 'agenda']):
        title = transcript.strip()
        if len(title) > 200:
            title = title[:200]
        task = append_agenda_item(title)
        return {
            'intent': 'ADD_TASK',
            'reply': f"RUMBLE: Added agenda item: {task['title']}",
            'task': task
        }
    if any(keyword in normalized for keyword in ['triage', 'medical advice', 'doctor', 'physio', 'rehab advice', 'medical']):
        advice = generate_medical_triage_advice()
        return {
            'intent': 'MEDICAL_TRIAGE',
            'reply': f"RUMBLE: {advice}",
            'advice': advice
        }
    pain_score = parse_pain_score(normalized)
    if pain_score is not None or any(keyword in normalized for keyword in ['pain', 'ache', 'hurt', 'sore', 'tight']):
        score = pain_score if pain_score is not None else 5
        location_breakdown = parse_pain_locations(normalized)
        pain_payload = PainLogPayload(
            pain_score=score,
            mood=5,
            location_breakdown=location_breakdown,
            notes=transcript,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        pain_response = log_pain(pain_payload)
        return {
            'intent': 'LOG_PAIN',
            'reply': f"RUMBLE: Recorded pain at {score}/10 for {', '.join(location_breakdown)}.",
            'log': pain_response['log']
        }
    return {
        'intent': 'UNKNOWN',
        'reply': 'RUMBLE: I logged your note for review, but could not identify a specific intent from the voice input.',
        'note': process_voice(VoicePayload(transcript=transcript))
    }

app = FastAPI(title="Rumble OS Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PainLogPayload(BaseModel):
    pain_score: Optional[int] = Field(None, ge=0, le=10)
    pain_level: Optional[int] = Field(None, ge=0, le=10)
    mood: Optional[int] = Field(None, ge=0, le=10)
    mood_level: Optional[int] = Field(None, ge=0, le=10)
    location_breakdown: Optional[Any] = None
    generators: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = ""
    pain_notes: Optional[str] = ""
    timestamp: Optional[str] = None

class ExpensePayload(BaseModel):
    description: Optional[str] = None
    merchant: Optional[str] = None
    amount: float
    category: Optional[str] = ""
    notes: Optional[str] = ""
    timestamp: Optional[str] = None

class NotePayload(BaseModel):
    title: Optional[str] = "Quick Note"
    content: str
    category: Optional[str] = "quick_note"
    author: Optional[str] = "user"

class VoicePayload(BaseModel):
    transcript: str

class RumbleChatRequest(BaseModel):
    message: str

@app.get("/healthz")
def health_check():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/api/pain")
def get_pain_logs():
    logs = load_json(PAIN_FILE, [])
    latest = logs[-1] if logs else None
    return {"status": "success", "count": len(logs), "latest": latest, "logs": logs}

@app.post("/api/pain")
@app.post("/api/v1/pain/log")
def log_pain(payload: PainLogPayload):
    logs = load_json(PAIN_FILE, [])
    score = payload.pain_score if payload.pain_score is not None else payload.pain_level
    score = score if score is not None else 0
    mood_val = payload.mood if payload.mood is not None else payload.mood_level
    mood_val = mood_val if mood_val is not None else 5
    notes_str = payload.notes or payload.pain_notes or ""
    location = payload.location_breakdown or payload.generators or {"lumbar": 80}

    entry = {
        "id": len(logs) + 1,
        "pain_score": score,
        "pain_level": score,
        "mood": mood_val,
        "mood_level": mood_val,
        "location_breakdown": location,
        "notes": notes_str,
        "timestamp": payload.timestamp or datetime.now(timezone.utc).isoformat()
    }
    logs.append(entry)
    save_json(PAIN_FILE, logs)
    return {"status": "success", "log": entry}

@app.get("/api/budget")
def get_budget():
    expenses = load_json(BUDGET_FILE, [])
    summary = {}
    total = 0.0
    for item in expenses:
        cat = item.get("category", "General")
        amt = float(item.get("amount", 0.0))
        summary[cat] = summary.get(cat, 0.0) + amt
        total += amt
    summary["Total"] = round(total, 2)
    return {"status": "success", "count": len(expenses), "summary": summary, "expenses": expenses}

@app.post("/api/budget")
def add_expense(payload: ExpensePayload):
    expenses = load_json(BUDGET_FILE, [])
    desc = payload.description or payload.merchant or "Expense"
    category = categorize_expense(desc, payload.category)
    entry = {
        "id": len(expenses) + 1,
        "description": desc,
        "amount": round(payload.amount, 2),
        "category": category,
        "notes": payload.notes or "",
        "timestamp": payload.timestamp or datetime.now(timezone.utc).isoformat()
    }
    expenses.append(entry)
    save_json(BUDGET_FILE, expenses)
    return {"status": "success", "expense": entry}

@app.post("/api/voice")
def process_voice(payload: VoicePayload):
    voice_logs = load_json(VOICE_FILE, [])
    transcript = payload.transcript.strip()
    voice_entry = {
        "id": len(voice_logs) + 1,
        "transcript": transcript,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    voice_logs.append(voice_entry)
    save_json(VOICE_FILE, voice_logs)
    return {"status": "success", "transcript": transcript}

@app.get("/api/rehab")
def get_rehab():
    logs = load_json(PAIN_FILE, [])
    latest_pain = logs[-1].get("pain_score", 4) if logs else 4
    return {
        "status": "success",
        "latest_pain": latest_pain,
        "morning_routine": {"title": "Morning Lumbar Decompression", "duration": "25-45m"},
        "evening_routine": {"title": "Evening Unloading & Ice", "duration": "25-45m"}
    }

@app.get("/api/agenda")
@app.get("/api/v1/agenda")
def get_agenda():
    agenda_data = load_json(AGENDA_FILE, {})
    return {
        "status": "success",
        "daily": agenda_data.get("daily", []),
        "weekly": agenda_data.get("weekly", []),
        "monthly": agenda_data.get("monthly", []),
        "agenda": agenda_data
    }

@app.get("/api/weather")
@app.get("/api/v1/weather")
def get_weather():
    return {
        "status": "success",
        "temp_c": 22.0,
        "condition": "Mostly Clear",
        "location": "Melbourne, AU",
        "rain_probability_pct": 10,
        "rain_mm": 0.0,
        "drying_recommendation_3day": {
            "best_days": ["Tuesday", "Thursday", "Saturday"]
        }
    }

@app.get("/api/notes")
@app.get("/api/v1/notes")
def get_notes():
    notes = load_json(NOTES_FILE, [])
    return {"status": "success", "notes": notes}

@app.post("/api/notes")
@app.post("/api/v1/notes")
def save_note(payload: NotePayload):
    notes = load_json(NOTES_FILE, [])
    entry = {
        "id": len(notes) + 1,
        "title": payload.title,
        "content": payload.content,
        "category": payload.category,
        "author": payload.author or "user",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    notes.append(entry)
    save_json(NOTES_FILE, notes)
    return {"status": "success", "note": entry}

@app.post("/api/v1/voice/parse")
def parse_voice_payload(payload: VoicePayload):
    return build_voice_parse_response(payload.transcript)

@app.post("/api/v1/rumble/chat")
def rumble_chat(req: RumbleChatRequest):
    response = build_voice_parse_response(req.message)
    return {"reply": response.get("reply", "RUMBLE: Received directive."), "author": "RUMBLE", **response}

@app.post("/api/v1/ops/sync")
def ops_sync():
    agenda_data = load_json(AGENDA_FILE, {})
    added_event = {
        "id": f"task_{len(agenda_data.get('daily', [])) + 1}",
        "time": "ASAP",
        "title": "Sync-generated Rehab Check-in",
        "status": "pending",
        "category": "rehab"
    }
    agenda_data.setdefault('daily', []).append(added_event)
    save_json(AGENDA_FILE, agenda_data)
    return {"status": "success", "added_event": added_event}

@app.get("/api/v1/reflection/usage")
def reflection_usage():
    return {"status": "success", "proposal": "Focus on lumbar mobility, hydration, and task pacing this afternoon."}

@app.get("/api/v1/learn/topic")
def learn_topic():
    return {
        "status": "success",
        "topic": {
            "category": "Recovery",
            "title": "Micro-Break Posture Reset",
            "summary": "Short, frequent posture resets reduce cumulative lower-back strain.",
            "details": "Stand, reset your spine alignment, and perform three deep diaphragmatic breaths every hour.",
            "table": [
                {"Action": "Reset posture", "Frequency": "Hourly"},
                {"Action": "Deep breaths", "Frequency": "3 reps"}
            ]
        }
    }

@app.post("/api/v1/learn/rotate")
def learn_rotate():
    topics = [
        {
            "category": "Recovery",
            "title": "Hip hinge awareness",
            "summary": "Use the hips to bend instead of the lower back during lifting.",
            "details": "Keep chest high and hinge from your hips while maintaining a neutral spine.",
            "table": [{"Tip": "Bend knees slightly", "Reps": "5 slow reps"}]
        },
        {
            "category": "Hydration",
            "title": "Morning fluid strategy",
            "summary": "Start the day with 500mL of water to support tissue perfusion.",
            "details": "Drink before coffee and spread intake across the morning.",
            "table": [{"Tip": "Water first thing", "Amount": "500mL"}]
        }
    ]
    return {"status": "success", "topic": random.choice(topics)}

@app.post("/api/v1/protocols/complete")
def complete_protocol(payload: Dict[str, Any]):
    return {"status": "success", "completed": True, "protocol_id": payload.get("protocol_id")}

from fastapi.staticfiles import StaticFiles
if (DASHBOARD_DIR / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(DASHBOARD_DIR), html=True), name="dashboard")


