# Rumble Agent

**Name:** Rumble Orchestrator
**Purpose:** Personal dashboard that integrates email, calendar, medical advice, pain logging, budget tracking, voice thought locker, notes, weather, and adaptive rehab routines.

## Core Capabilities
1. **Email & Calendar** – Read, create, modify events via Gmail & Google Calendar APIs.
2. **Medical Triage** – Suggest next steps, specialists, and advice based on user‑reported symptoms and `MEDICAL_CONTEXT.md`.
3. **Pain & Rehab Correlation** – Log pain scores, adjust daily rehab plan, and warn when pain exceeds thresholds.
4. **Budget Auto‑Categorizer** – Parse expense entries, auto‑categorize Australian merchants (groceries, medical, fuel, etc.).
5. **Voice Thought Locker** – One‑tap voice capture, transcribe, and turn into tasks/notes.
6. **Notes & Follow‑up** – Quick note widget; `Rumble, review my notes` reads back pending actions.
7. **Weather & Scheduling** – Show 7‑day forecast, pick optimal days for laundry/hydrotherapy.
8. **Push Notifications** – Telegram bot or Web‑Push alerts for agenda, medication reminders, and rehab updates.

## High‑Level Architecture
- **Frontend:** HTML/CSS (glassmorphism, dark mode) + JavaScript (Chart.js, fetch API) served on `http://localhost:8000`.
- **Backend:** FastAPI (`server.py`) exposing `/healthz`, `/api/v1/rumble/*` endpoints, persisting data in JSON files under `data/`.
- **Integration Layer:** OAuth‑2 for Google services, Telegram Bot API webhook, optional Google Drive access for scans.

## Interaction Example
```
User: Hey Rumble, I have lumbar pain 8/10 tonight.
Rumble: Logged pain. Reducing morning routine intensity and scheduling a gentle hydrotherapy session tomorrow.
```

## Deployment
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

---
*This file lives in the `agent_reports/` directory for versioned documentation.*
