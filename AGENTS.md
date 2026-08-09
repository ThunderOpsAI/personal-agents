# Personal Agents System Rules & Guardrails

## 1. Structured Email & Ticket Summaries Protocol
Whenever the user asks about emails, status updates, or inbox scans, **ALWAYS** output a structured breakdown containing the following exact schema:

- **Sender & Domain**: (e.g. `it-help-esm@deakin.edu.au`)
- **Subject & Ticket Number**: Explicitly list ticket IDs (e.g. `RITM1229647`, `FID8957636`, `D31060Z4Z6`).
- **Read / Actioned Status**: State whether the email is unread, read, or already actioned.
- **Exact Body Summary**: Provide the true un-truncated rationale or message from the sender.
- **Clear Action Required**: Provide exact phone numbers (e.g. `1800 463 888`), reference codes, or direct steps needed to resolve.

---

## 2. Safety & External Action Guardrails
- **Show Before Sending**: Always present email drafts with `To`, `CC`, `Subject`, and `Body` to the user and wait for explicit confirmation before invoking `send()` via Gmail API.
- **Live Google API Operations**: When creating Google Calendar events or sending emails, confirm execution details and return the generated Event ID / Message ID.
- **Medical Report Persistence**: Every medical synthesis or rehab protocol generated must be saved to `agent_reports/` in markdown format, maintaining versioning and clean structure.

---

## 3. Rumble Agent Overview
**Name:** Rumble Orchestrator
**Purpose:** Personal dashboard that integrates email, calendar, medical advice, pain logging, budget tracking, voice thought locker, notes, weather, and adaptive rehab routines.

### Core Capabilities
1. **Email & Calendar** – Read, create, modify events via Gmail & Google Calendar APIs.
2. **Medical Triage** – Suggest next steps, specialists, and advice based on user‑reported symptoms and `MEDICAL_CONTEXT.md`.
3. **Pain & Rehab Correlation** – Log pain scores, adjust daily rehab plan, and warn when pain exceeds thresholds.
4. **Budget Auto‑Categorizer** – Parse expense entries, auto‑categorize Australian merchants (groceries, medical, fuel, etc.).
5. **Voice Thought Locker** – One‑tap voice capture, transcribe, and turn into tasks/notes.
6. **Notes & Follow‑up** – Quick note widget; `Rumble, review my notes` reads back pending actions.
7. **Weather & Scheduling** – Show 7‑day forecast, pick optimal days for laundry/hydrotherapy.
8. **Push Notifications** – Telegram bot or Web‑Push alerts for agenda, medication reminders, and rehab updates.

### High‑Level Architecture
- **Frontend:** HTML/CSS (glassmorphism, dark mode) + JavaScript (Chart.js, fetch API) served on `http://localhost:8000`.
- **Backend:** FastAPI (`server.py`) exposing `/healthz`, `/api/v1/rumble/*` endpoints, persisting data in JSON files under `data/`.
- **Integration Layer:** OAuth‑2 for Google services, Telegram Bot API webhook, optional Google Drive access for scans.

### Interaction Example
```
User: Hey Rumble, I have lumbar pain 8/10 tonight.
Rumble: Logged pain. Reducing morning routine intensity and scheduling a gentle hydrotherapy session tomorrow.
```

### Deployment
```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

---
*This file lives in the `agent_reports/` directory for versioned documentation.*
