# Rumble OS Product Context

## Purpose and source of truth

Rumble OS is a personal operations and recovery dashboard. The production source of truth is the static frontend in `dashboard/`, Vercel Eve serverless workflows, Neon PostgreSQL, ChromaDB, and live external integrations.



## Architecture and deployment

* Frontend: `dashboard/`, deployed to Vercel. The UI implements 'Universal Intent Capture' where unassigned buttons default to opening Rumble Chat.
* Agent Framework: Vercel Eve, running on Vercel's Edge Network for automatic serverless scaling. The legacy FastAPI backend and `uvicorn` entrypoints have been removed.
* Local development: use the Eve CLI via the `eve dev` command.
* Health endpoint: `/healthz`.
* API routes: `/api/...` and `/api/v1/...`.
* Persistence: Neon PostgreSQL through `NEON_DATABASE_URL` is the production persistence layer. SQLite is permitted only as a local-development fallback when `NEON_DATABASE_URL` is unavailable; it must never be used in production and must never silently mask a missing production database connection. ChromaDB through `RUMBLE_CHROMA_PATH` stores learned rehabilitation preferences.
* Workspace reads: live Gmail and Google Calendar OAuth integrations (built as Eve Tools using `defineTool`).
* Weather: direct Open-Meteo HTTP API, no LLM weather inference.
* Timezone: all scheduled behavior (yoga, meditation, retrieval, washing-day selection) uses Australia/Melbourne, not UTC or server-local time.

## Hard product non-negotiables

### Daily learning and recovery

1. The system features a dynamic Learning capability that stores memories in the database and summarizes them weekly into a `SOUL.md` file.
2. The general Learning card presents three rotating suggestions. The user can rotate them or enter a topic of their own choice.
3. A dynamic Yoga Engine presents 3 adaptive routines daily at 09:00 AM based on pain logs, adapting to surgery history, clinician restrictions, and learned feedback. (Delegated to Eve Subagent).
4. A Meditation Protocol is injected into the chronological agenda at 09:00 PM and 12:00 AM every night. (Delegated to Eve Subagent).
5. Every week targets three hydrotherapy pool sessions. Rumble selects only the sessions still needed to reach three for the current week: if one or more sessions have already occurred earlier in the week (e.g. today's session), Rumble selects the remaining count; a week with zero completed sessions so far gets three Rumble-selected days. The user can adjust any Rumble-selected day before it is written to the calendar.

### Pain logging and learning loop

* Pain entries accept a 1–10 pain score, multiple anatomical locations, side, and relative percentage weights that must total 100%.
* Pain entries also accept the mood selector and notes.
* Exercise suggestions return 3–5 preference-aware ad-hoc routines from `RehabCoach` and `VectorPreferenceStore`.
* Completing a routine prompts for a new 1–10 pain score and stores the before/after relief delta in ChromaDB.
* Dismissing a routine records a rejection reason such as `Too tired` or `Hurts`.
* Sunday morning briefing presents learned rules for explicit approval or rejection.
* Medical and rehabilitation guidance is decision support, not diagnosis, and must include clinician-review guidance where appropriate.

### Live weather and washing agenda

* All weather displayed in Rumble OS must be live.
* Location is fixed to Wangaratta, Victoria, Australia: latitude `-36.3536`, longitude `146.3225`.
* Open-Meteo supplies current temperature, current precipitation, current precipitation probability, and a seven-day forecast.
* Rumble selects exactly two washing days per week from the lowest forecast precipitation probabilities and displays the selected dates and forecast percentages.
* If weather is unavailable, show an explicit unavailable state; never guess conditions.

### Agenda and calendar

* The agenda data model supports 'Options' (like 3 suggested washing days, only 2 required) alongside fixed events.
* Daily agenda includes live pending action items, daily yoga, nightly meditation, hydrotherapy, and relevant user tasks such as "Call Deakin to unlock MFA."
* Weekly and monthly panels pull live Google Calendar events.
* Calendar reads may occur with available OAuth credentials. Calendar creation, modification, or deletion requires the `needsApproval` helper to durably pause execution for explicit user confirmation and must return the provider Event ID.
* Completed daily items expose Dismiss. Dismiss removes the item from the active stream without destroying audit history.

### Live retrieval cadence and agenda alerts

* Automated workflows scrape Gmail and Google Calendar at 06:00 and 14:00 Australia/Melbourne daily. This is a read-only operation and does not require `needsApproval`.
* Each retrieval scans new emails and calendar changes for items requiring user action and, where found, injects an alert into the active daily agenda at the appropriate time slot.
* Example: an email received that requires action by 1:30 PM (e.g. a Hostplus notice) must produce a visible agenda alert placed at that time, not merely appear as an unread email.
* Alerts are read-derived and informational; any resulting reply or calendar write still requires `needsApproval` before execution.

## Data, safety, and privacy invariants

* Production data must come only from Neon PostgreSQL, ChromaDB, or live external APIs. No mock, dummy, demo, seeded, or hard-coded user data is permitted in production UI or API paths.
* Empty states and integration failures must be explicit and visible.
* Never expose secrets, OAuth tokens, database URLs, or service credentials.
* Medical reports are persisted under `agent_reports/` with dates, versions, clean structure, and the existing disclaimer.
* Keep product UI, logs, responses, code, and docs professional and free of decorative emoji; the mood selector is the sole intentional symbol exception.
* AI agents are strictly forbidden from modifying the source-of-truth configuration files—including `CONTEXT.md`, `agent/instructions.md`, and any files within the `agent/skills/` or `agent/tools/` directories—without direct, explicit, and synchronous user authorization.

## Runtime configuration

Required production configuration includes `NEON_DATABASE_URL` and `GEMINI_API_KEY`. Gemini is the model backing `/api/v1/rumble/chat` dynamic agent responses. Optional integrations include `OPENAI_API_KEY`, `AGNO_API_KEY`, `TELEGRAM_BOT_TOKEN`, and `NTFY_TOPIC`. Google OAuth credentials and token storage are required for live Gmail and Calendar reads/writes.