# Rumble OS Agent Instructions

Read `CONTEXT.md` before changing terminology, agenda behavior, persistence, integrations, or deployment configuration. `CONTEXT.md` is the product source of truth; this file governs agent behavior and safety.

## Non-negotiable product behavior

- Rumble OS is live-data-only in production. Never add mock, dummy, seeded, guessed, or hard-coded user data to production paths.
- The general Learning card rotates through three suggestions and lets the user choose a topic.
- A separate adaptive Yoga routine appears every day at 09:00 AM. Suggestions must account for live pain logs, surgeries, clinician restrictions, and learned rehabilitation feedback.
- A Meditation Protocol appears every night at 09:00 PM and 12:00 AM.
- Weekly agenda includes three hydrotherapy sessions: today’s completed session plus two Rumble-selected days that the user may adjust.
- Weekly agenda includes exactly two washing days selected from the live Wangaratta forecast using the lowest precipitation probabilities.
- Current weather and forecast must come directly from Open-Meteo for Wangaratta, Victoria, Australia: latitude `-36.3536`, longitude `146.3225`.
- Weekly and monthly agenda panels must pull live Google Calendar events. If OAuth is unavailable, show an explicit authorization state; never silently invent events.
- Pain logging supports multiple anatomical locations, relative percentage weights totalling 100%, pain score, mood selector, and notes.
- Completed daily items expose Dismiss. Dismiss removes the item from the active stream while preserving auditability.

## Safety and external actions

- Medical output is decision support, not diagnosis. Preserve the medical disclaimer and recommend clinician review when appropriate.
- Never recommend pushing through worsening pain or ignoring surgery/clinician restrictions.
- Save every medical synthesis or rehabilitation protocol to `agent_reports/` with versioned, clean Markdown.
- Show email drafts with `To`, `CC`, `Subject`, and `Body`; wait for explicit confirmation before sending.
- Confirm Google Calendar writes and email sends before execution; return the resulting Event ID or Message ID.
- Never expose secrets from `.env`, OAuth files, database URLs, logs, commits, or reports.
- For email or ticket summaries, always include sender/domain, subject/ticket number, read/actioned status, exact body summary, and clear action required.

## Engineering rules

- Production frontend is `dashboard/`; production API is `src/api/server.py`.
- Production persistence is Neon PostgreSQL via `NEON_DATABASE_URL`; ChromaDB stores learned exercise preferences and feedback.
- The root `server.py` is legacy/local JSON persistence and is not the production entrypoint.
- Keep API, persistence, deployment, and domain documentation synchronized in `CONTEXT.md` and relevant README/deployment docs.
- Keep product UI, logs, responses, code, and documentation free of decorative emoji; mood selection is the intentional exception.
- Before claiming deployment health, verify frontend, `/healthz`, and at least one read-only API endpoint.

## Local development

```bash
source .venv/bin/activate
uvicorn src.api.server:app --host 0.0.0.0 --port 8000
```
