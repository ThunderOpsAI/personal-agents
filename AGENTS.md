# Rumble OS Agent Instructions

Read `CONTEXT.md` before changing terminology, agenda behavior, persistence, integrations, or deployment configuration. `CONTEXT.md` is the product source of truth; this file governs agent behavior and safety.

## Procedural Safety Rule

> **AI agents are strictly forbidden from modifying the source-of-truth configuration files—including `CONTEXT.md`, `agent/instructions.md`, and any files within the `agent/skills/` or `agent/tools/` directories—without direct, explicit, and synchronous user authorization.**

## Vercel Eve Architecture

* **Instructions:** This file (`agent/instructions.md`) defines the agent identity and non-negotiable rules.
* **Skills (`agent/skills/`):** Markdown files encoding domain knowledge (e.g., weather rules, rehab logic).
* **Tools (`agent/tools/`):** TypeScript tool implementations using the `defineTool` helper for external integrations (Gmail, Calendar).
* **Subagents (`agent/subagents/`):** Specialist subagents (Yoga routine, Meditation Protocol) defined with the `defineAgent` helper, each executing with distinct context.

## Non-negotiable product behavior

* Rumble OS is live-data-only in production. Never add mock, dummy, seeded, guessed, or hard-coded user data to production paths.
* The general Learning card rotates through three suggestions and lets the user choose a topic.
* The agent will maintain a database of 25-30 yoga routines, dynamically presenting 3 options every 09:00 AM based on the previous night's and 06:00 AM's pain logs. Suggestions must account for surgeries, clinician restrictions, and learned rehabilitation feedback (Implemented via Subagent).
* A Meditation Protocol appears every night at 09:00 PM (Implemented via Subagent).
* Weekly agenda targets three hydrotherapy sessions. Rumble selects only the sessions still needed to reach three for the current week — e.g. if today's session is already completed, Rumble selects the remaining two; a week with none completed yet gets three Rumble-selected days. The user may adjust any Rumble-selected day before it is written to the calendar.
* Weather-based washing scheduling: select exactly 2 optimal days from the live Wangaratta forecast using the lowest precipitation probabilities.
* Current weather and forecast must come directly from Open-Meteo for Wangaratta, Victoria, Australia: latitude `-36.3536`, longitude `146.3225`.
* Weekly and monthly agenda panels must pull live Google Calendar events. If OAuth is unavailable, show an explicit authorization state; never silently invent events.
* Pain logging supports multiple anatomical locations, relative percentage weights totalling 100%, pain score, mood selector, and notes.
* Daily agenda items support three actions: Done (marks completed, greys out the card, moves to bottom of day's agenda), Dismiss (permanently deletes with confirmation), and Move to Tomorrow (reschedules remaining pending items to next day).
* The agent uses a `SOUL.md` file for synthesized weekly learning.

## Safety, Human-in-the-Loop, and external actions

* `needsApproval` is required only for tools that modify or send: Google Calendar event modification/deletion, and email sends. Emails can be drafted but NEVER sent without explicit user permission. Calendar events can be added autonomously, but edits/deletes require confirmation. It durably pauses execution until explicit user authorization.
* Gmail and Google Calendar **reads** are not side-effecting and do not require `needsApproval`. They run on the automated retrieval schedule below without pausing for approval.
* Medical output is decision support, not diagnosis. Preserve the medical disclaimer and recommend clinician review when appropriate.
* Never recommend pushing through worsening pain or ignoring surgery/clinician restrictions.
* Save every medical synthesis or rehabilitation protocol to `agent_reports/` with versioned, clean Markdown.
* Confirm Google Calendar edits/deletes and email sends before execution; return the resulting Event ID or Message ID.
* Never expose secrets from `.env`, OAuth files, database URLs, logs, commits, or reports.
* For email or ticket summaries, always include sender/domain, subject/ticket number, read/actioned status, exact body summary, and clear action required.

## Automated retrieval and agenda alerts

* Email and calendar scraping happens automatically twice daily, at 06:00 and 14:00 Australia/Melbourne time.
* Each retrieval evaluates new items for required action and, where action is required, injects an alert into the daily agenda at the relevant time slot rather than waiting for the user to check inbox or calendar manually.
* The daily agenda will surface actionable email alerts. Clicking 'Show Me' on an alert opens Rumble Chat for intent capture.
* Alert injection is a read-derived UI/agenda update, not a send or a calendar write, so it does not require `needsApproval`. Any resulting action the user takes (replying, modifying a calendar event) does.

## Orchestration and concurrency

* Rumble OS build work is coordinated by an orchestrator agent that delegates to subagents per domain (agenda/persistence, controls/UI, yoga, learning, pain/rehab loop, weather/washing, calendar/email retrieval, verification).
* Subagents that read or write the same file must never run concurrently. The orchestrator sequences any subagents with overlapping file scope one after another; only subagents with fully disjoint file scope may run in parallel.
* Before dispatching subagents in parallel, the orchestrator must confirm their target files do not overlap. If overlap is uncertain, default to sequential.

## Source-of-truth conflicts

* Running code is the source of truth for current behavior. `CONTEXT.md` and `AGENTS.md` describe intended behavior.
* If an agent finds code and documentation in conflict, it must not silently resolve the conflict in either direction (neither "fix the code to match the docs" nor "update the docs to match the code"). It must STOP and raise the conflict with the owner for a decision before proceeding.

## Engineering rules

* Production frontend is `dashboard/`.
* Production persistence is Neon PostgreSQL via `NEON_DATABASE_URL`; local-disk SQLite and ChromaDB are for local dev/staging only.
* The agent runs on Vercel's global edge network with automatic serverless scaling.
* Keep product UI, logs, responses, code, and documentation free of decorative emoji; mood selection is the intentional exception.
* Before claiming deployment health, verify frontend, `/healthz`, and at least one read-only API endpoint.
* Every unassigned UI button falls back to opening Rumble Chat with context (Universal Intent Capture).