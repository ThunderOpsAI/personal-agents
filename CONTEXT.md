# Domain Context: Rumble OS

## System Boundary and Source of Truth

Rumble OS is the dashboard product in `dashboard/` plus the production FastAPI service in `src/api/server.py`. The root-level `server.py` is a legacy/local JSON-backed server and is not the Render production entrypoint. Production data must come from Neon PostgreSQL (`NEON_DATABASE_URL`) or live external integrations; seeded JSON data in `data/` is not production data.

## Deployment Topology

- **Frontend:** Vercel static deployment from `dashboard/`, configured by the root `vercel.json`.
- **Backend:** Render web service named `rumble-os-backend`, configured by `render.yaml`, running `uvicorn src.api.server:app --host 0.0.0.0 --port $PORT`.
- **Public backend URL:** `https://rumble-os-backend.onrender.com`.
- **Routing:** Vercel rewrites `/api/*` and `/healthz` to the Render backend. The dashboard normally uses same-origin relative API paths.
- **Health check:** `GET /healthz`.
- **Keep-alive:** `.github/workflows/keep_alive.yml` pings the Render health endpoint every 14 minutes to reduce free-tier cold starts.
- **Deployment automation:** `.github/workflows/deploy.yml` runs lint, tests, and a frontend build check on pushes/PRs. It does not itself deploy to Vercel or Render; those services must be connected to the GitHub repository separately.

The repository proves that deployment is configured, not that a current deployment is healthy. A live-status claim requires checking the Vercel URL and the Render `/healthz` response.

## Glossary

### Dashboard Layout & Surface Architecture

- **Executive Command Center:** Unified dashboard for personal operations, schedule, health monitoring, and rehabilitation protocols.
- **Hybrid Sidebar & Timeline Layout:** Persistent left Quick-Log Sidebar with a right-hand Chronological Timeline Stream.
- **Persistent Quick-Log Sidebar:** Sidebar for pain logging, generator tracking, doctor report exports, and pipeline sync.
- **Chronological Timeline Stream:** Time-ordered stream grouping daily actions into protocol blocks.

### Health & Recovery

- **Pain Generator:** Anatomical structure or region identified as contributing to the dominant symptom load, with a percentage weight.
- **Symptom Log:** Record of pain severity, anatomical locations, primary generator, generator weight, and notes.
- **Physio Routine:** Structured, time-bounded rehabilitation protocol.
- **Doctor Report:** Markdown synthesis of pain logs, generator trends, and physio compliance for a clinician.

### Operations & Tasks

- **Chief Rumble Officer Assessment:** Executive synthesis of system health, active alerts, and immediate priorities.
- **Active Alert:** Urgent notification requiring attention or action.
- **Action Item:** Prioritized task derived from multi-agent ingestion.
- **Pipeline Ingest:** Synchronization of Google Calendar, Gmail, and agent outputs into application storage.

## Runtime Configuration

Render requires `NEON_DATABASE_URL`; optional integrations use `OPENAI_API_KEY`, `AGNO_API_KEY`, `TELEGRAM_BOT_TOKEN`, and `NTFY_TOPIC`. Google OAuth credentials and token storage are required for live Gmail and Calendar operations. Never commit these values or token files. Keep `.env.example` aligned with actual required variables.

## Data and Safety Invariants

- Do not introduce mock, dummy, fallback, or seeded values into production dashboard paths.
- Database initialization must be safe for the configured Neon/PostgreSQL environment.
- Health logs, notes, budget entries, agenda items, and generated reports must remain auditable.
- Email sending and calendar writes require explicit user confirmation; reads may use live OAuth credentials when available.
- Medical reports belong in `agent_reports/` with clear dates/versioning and the existing medical disclaimer.
- **NO EMOJIS:** Keep Rumble OS UI, logs, responses, code, and documentation text-based and professional.
