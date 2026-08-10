# Rumble OS Product Context

## Purpose and source of truth

Rumble OS is a personal operations and recovery dashboard. The production source of truth is the static frontend in `dashboard/`, the FastAPI service in `src/api/server.py`, Neon PostgreSQL, ChromaDB, and live external integrations.

The root `server.py` is a legacy/local JSON-backed server. It is not the Render production entrypoint and must not seed production flows.

## Architecture and deployment

- Frontend: `dashboard/`, deployed to Vercel.
- Backend: `src/api/server.py`, deployed to Render as `rumble-os-backend`.
- Backend command: `uvicorn src.api.server:app --host 0.0.0.0 --port $PORT`.
- Health endpoint: `/healthz`.
- API routes: `/api/...` and `/api/v1/...`.
- Persistence: Neon PostgreSQL through `NEON_DATABASE_URL`; ChromaDB through `RUMBLE_CHROMA_PATH` for learned rehabilitation preferences.
- Workspace reads: live Gmail and Google Calendar OAuth integrations.
- Weather: direct Open-Meteo HTTP API, no LLM weather inference.
- Vercel rewrites `/api/*` and `/healthz` to `https://rumble-os-backend.onrender.com`.

## Hard product non-negotiables

### Daily learning and recovery

1. The general Learning card presents three rotating suggestions. The user can rotate them or enter a topic of their own choice.
2. A separate Yoga routine is scheduled every day at 09:00 AM. It offers three choices and adapts to current pain, surgery history, clinician restrictions, and learned feedback.
3. A Meditation Protocol is injected into the chronological agenda at 09:00 PM and 12:00 AM every night.
4. Every week contains three hydrotherapy pool sessions. The user’s session today is retained and Rumble selects two additional days; the user can adjust the schedule before calendar writes.

### Pain logging and learning loop

- Pain entries accept a 1–10 pain score, multiple anatomical locations, side, and relative percentage weights that must total 100%.
- Pain entries also accept the mood selector and notes.
- Exercise suggestions return 3–5 preference-aware ad-hoc routines from `RehabCoach` and `VectorPreferenceStore`.
- Completing a routine prompts for a new 1–10 pain score and stores the before/after relief delta in ChromaDB.
- Dismissing a routine records a rejection reason such as `Too tired` or `Hurts`.
- Sunday morning briefing presents learned rules for explicit approval or rejection.
- Medical and rehabilitation guidance is decision support, not diagnosis, and must include clinician-review guidance where appropriate.

### Live weather and washing agenda

- All weather displayed in Rumble OS must be live.
- Location is fixed to Wangaratta, Victoria, Australia: latitude `-36.3536`, longitude `146.3225`.
- Open-Meteo supplies current temperature, current precipitation, current precipitation probability, and a seven-day forecast.
- Rumble selects exactly two washing days per week from the lowest forecast precipitation probabilities and displays the selected dates and forecast percentages.
- If weather is unavailable, show an explicit unavailable state; never guess conditions.

### Agenda and calendar

- Daily agenda includes live pending action items, daily yoga, nightly meditation, hydrotherapy, and relevant user tasks such as “Call Deakin to unlock MFA.”
- Weekly and monthly panels pull live Google Calendar events.
- Calendar reads may occur with available OAuth credentials. Calendar creation, modification, or deletion requires explicit user confirmation and must return the provider Event ID.
- Completed daily items expose Dismiss. Dismiss removes the item from the active stream without destroying audit history.

## Data, safety, and privacy invariants

- Production data must come only from Neon PostgreSQL, ChromaDB, or live external APIs. No mock, dummy, demo, seeded, or hard-coded user data is permitted in production UI or API paths.
- Empty states and integration failures must be explicit and visible.
- Never expose secrets, OAuth tokens, database URLs, or service credentials.
- Medical reports are persisted under `agent_reports/` with dates, versions, clean structure, and the existing disclaimer.
- Keep product UI, logs, responses, code, and docs professional and free of decorative emoji; the mood selector is the sole intentional symbol exception.

## Runtime configuration

Required production configuration includes `NEON_DATABASE_URL`. Optional integrations include `OPENAI_API_KEY`, `AGNO_API_KEY`, `TELEGRAM_BOT_TOKEN`, and `NTFY_TOPIC`. Google OAuth credentials and token storage are required for live Gmail and Calendar reads/writes.

## Verification standard

The repository proves configuration, not deployment health. A deployment claim requires checking the deployed frontend, Render `/healthz`, and at least one read-only API request. Local development uses:

```bash
source .venv/bin/activate
uvicorn src.api.server:app --host 0.0.0.0 --port 8000
```
