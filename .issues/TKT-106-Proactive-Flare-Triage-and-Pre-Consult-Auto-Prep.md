# Proactive Flare Triage (Low-Spoon Mode) & 24h Pre-Consult Auto-Prep
Labels: wayfinder:grilling, status:completed
Parent: MAP-RumbleOS-Brain-3.0.md
Blocked-By: TKT-102-Adaptive-Yoga-7AM-Lock-and-Pose-Swapping.md, TKT-104-Clinical-Change-Analytics-and-Physician-Consult-Pack.md
Blocks: none

## Status
**Completed & Verified** (Vitest: `smart-rescheduler.test.ts` 4/4 & `alert-scanner.test.ts` passed, full suite 335/335 passed)

## Resolution & Implementation
1. **Low-Spoon Flare Triage (`smart-rescheduler.ts`):**
   - Implemented `proposeFlareTriage`: activates when pain score >= 7/10, analyzes pending tasks, protects essential health protocols (hydrotherapy, medications, doctor appointments), defers non-urgent administrative/errand tasks to safe non-washing days, and adapts yoga to *Supported Child's Pose & Supine Restorative Decompression*.
   - Implemented `executeFlareTriage`: autonomously reschedules deferred tasks via `rescheduleAgendaItem` and injects an alert into today's agenda.
2. **24h Pre-Consult Auto-Prep (`alert-scanner.ts`):**
   - Automatically scans calendar events within 24-36 hours for medical, allied health, or legal appointments (`dr`, `consult`, `neuro`, `ortho`, `physio`, `lawyer`).
   - Automatically invokes `generateConsultPackMarkdown` with the matched specialist role, saving to `agent_reports/`.
   - Injects a high-priority Agenda alert: `"[Pre-Consult Auto-Prep] Upcoming Consult (${doctorName}) - 1-Tap Review Consult Pack"`.

## Question
How should Rumble OS autonomously reduce cognitive and physical load during two high-stakes moments:
1. **Flare-Aware Schedule Triage ("Low-Spoon Mode"):** When a pain log `>= 7/10` or acute neurological flare is recorded, how should Rumble select which pending Today/Tomorrow tasks to defer, which weather-dependent tasks (like Wangaratta washing days) to protect or shift, and how to present the 1-tap **"Activate Flare Triage"** confirmation card?
2. **24h Pre-Consult Auto-Prep:** During the 06:00 and 14:00 calendar scans, how should Rumble detect upcoming medical, allied health, or legal appointments within the next 24 hours, automatically generate the specialist-specific **Physician/Legal Consult Pack**, and attach it to the Agenda slot for 1-tap review?
