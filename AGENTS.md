# Personal Agents / Rumble OS — Agent Instructions

These instructions apply to work in this repository. Read `CONTEXT.md` before changing domain terminology, persistence, dashboard behavior, or deployment configuration.

## Structured Email & Ticket Summaries

Whenever the user asks about emails, status updates, or inbox scans, **ALWAYS** output a structured breakdown containing the following exact schema:

- **Sender & Domain**: (e.g. `it-help-esm@deakin.edu.au`)
- **Subject & Ticket Number**: Explicitly list ticket IDs (e.g. `RITM1229647`, `FID8957636`, `D31060Z4Z6`).
- **Read / Actioned Status**: State whether the email is unread, read, or already actioned.
- **Exact Body Summary**: Provide the true un-truncated rationale or message from the sender.
- **Clear Action Required**: Provide exact phone numbers (e.g. `1800 463 888`), reference codes, or direct steps needed to resolve.

## Safety & External Action Guardrails

- **Show Before Sending**: Always present email drafts with `To`, `CC`, `Subject`, and `Body` to the user and wait for explicit confirmation before invoking `send()` via Gmail API.
- **Live Google API Operations**: When creating Google Calendar events or sending emails, confirm execution details and return the generated Event ID / Message ID.
- **Medical Report Persistence**: Every medical synthesis or rehab protocol generated must be saved to `agent_reports/` in markdown format, maintaining versioning and clean structure.
- Treat medical output as decision support, not diagnosis. Preserve the project's medical disclaimer and recommend clinician review when appropriate.
- Never expose secrets from `.env`, OAuth token files, database URLs, or service credentials in responses, logs, commits, or reports.

## Rumble OS Product Context

**Name:** Rumble Orchestrator
**Purpose:** Personal dashboard integrating email, calendar, medical advice, pain logging, budget tracking, voice thought capture, notes, weather, and adaptive rehabilitation routines.

### Core Capabilities

1. **Email & Calendar** — Read, create, and modify events through Gmail and Google Calendar APIs.
2. **Medical Triage** — Suggest next steps, specialists, and advice based on reported symptoms and `agent_reports/MEDICAL_CONTEXT.md`.
3. **Pain & Rehab Correlation** — Log pain scores, adjust routines, and warn when pain exceeds thresholds.
4. **Budget Auto-Categorizer** — Categorize Australian merchants such as groceries, medical, and fuel.
5. **Voice Thought Locker** — Capture voice, transcribe it, and turn it into tasks or notes.
6. **Notes & Follow-up** — Store notes and surface pending actions.
7. **Weather & Scheduling** — Show forecasts and help choose suitable days for activities.
8. **Push Notifications** — Support Telegram or ntfy notifications.

### Current Architecture

- **Frontend:** Static HTML/CSS/JavaScript in `dashboard/`, hosted by Vercel.
- **Production backend:** FastAPI in `src/api/server.py`, hosted by Render as `rumble-os-backend`; health endpoint `/healthz`; application endpoints under `/api/...` and `/api/v1/...`.
- **Production persistence:** Neon PostgreSQL via `NEON_DATABASE_URL`. Google Workspace OAuth2 supplies Gmail and Calendar data; Telegram/ntfy are optional notification adapters.
- **Local/legacy server:** Root `server.py` is a separate standalone server with JSON persistence under `data/`. Do not treat it as the production entrypoint or add its seeded/demo data to production flows.
- **Deployment routing:** Root `vercel.json` serves `dashboard/` and rewrites `/api/*` and `/healthz` to `https://rumble-os-backend.onrender.com`.

### Interaction Example

```text
User: Hey Rumble, I have lumbar pain 8/10 tonight.
Rumble: Logged pain. Reducing morning routine intensity and scheduling a gentle hydrotherapy session tomorrow.
```

## Local Development

```bash
source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.api.server:app --host 0.0.0.0 --port 8000
```

For the standalone JSON-backed local server only:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

## Engineering Conventions

- Keep `AGENTS.md` for agent behavior and repository guardrails; keep domain vocabulary, architecture, deployment facts, and known gaps in `CONTEXT.md`.
- Use live integrations in production. Mock data is permitted only in explicitly named tests or local prototypes.
- Preserve the no-emoji product rule in Rumble OS UI, logs, responses, code, and documentation. Existing legacy scripts may still contain violations and should be cleaned up when touched.
- When changing API routes, persistence, environment variables, or deployment manifests, update `CONTEXT.md` and relevant README/deployment documentation in the same change.
- Before claiming a deployment works, verify the deployed frontend and backend health endpoint, then exercise at least one read-only API request.
