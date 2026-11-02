# Rumble OS Brain 3.0 & Zero-Friction Personalization Map
Labels: wayfinder:map, status:completed

## Destination
Deliver the complete architecture, interactive prototypes, and implementation spec for **Rumble OS Brain 3.0 & Zero-Friction Capture**:
1. **Omniscient Context Brain & 1-Sentence Multi-Action Router** (`buildRumbleSystemPrompt` 3.0 grounded in live Budget, `SOUL.md`, `semantic_memories`, 7-day Pain/Rehab deltas, and natural-language multi-action unpacking).
2. **Adaptive 07:00 AM + Reactive Yoga/Rehab Engine** (replacing hardcoded routine choices with live pain-log + relief-delta scoring locked in by 07:00 AM, real-time flare re-ranking, step-level contraindicated pose swapping, and "Why This Routine" badges).
3. **Universal Snap-and-Route Multimodal Capture** (photo capture in Rumble Chat that splits mixed receipts across Budget categories, dual-logs clinical invoices to `medical_receipts`, tracks recurring `bills_subscriptions` price creep, and routes appointment letters/medications to Calendar, Tasks, and Semantic Memory).
4. **4-Dimensional Clinical Change Analytics & 1-Tap Physician Consult Pack** (Period-over-Period 7d/30d deltas, Anatomical Migration tracking, Intervention/Weather/Schedule correlation matrix, NLP symptom progression timeline, and specialist-tailored printable/exportable consult briefs).
5. **Evidence-Backed Rumble Insights ("Approve to Brain" Loop)** (14-day cross-domain pattern detection categorized into `[REHAB RULE]`, `[PAIN TRIGGER]`, `[SCHEDULE HABIT]`, and `[BUDGET/ADMIN]`, where clicking Approve persists to `SOUL.md` + `semantic_memories` and activates the rule in the live engines).
6. **Proactive Autonomy** (1-tap "Flare Triage / Low-Spoon Mode" when pain >= 7/10, and 24-hour Pre-Consult Auto-Prep before medical/legal calendar events).

## Completion Summary
All 6 tickets have been implemented, tested, and verified with zero regressions:
- **TKT-101 (Completed):** Omniscient Context Brain 3.0 & Multi-Action Router in `intent-router.ts`.
- **TKT-102 (Completed):** Adaptive Yoga 07:00 AM Lock-In, Smart Scoring & Pose-Level Swapping in `yoga-engine.ts` and `agenda/route.ts`.
- **TKT-103 (Completed):** Snap-and-Route Receipt & Document Pipeline in `ocr-parser.ts` and `app.js`.
- **TKT-104 (Completed):** 4D Clinical Change Analytics & 1-Tap Physician Consult Pack in `pain/analytics/route.ts` and `app.js`.
- **TKT-105 (Completed):** Evidence-Backed Insights & "Approve to Brain" Loop in `insight-engine.ts`.
- **TKT-106 (Completed):** Proactive Flare Triage (Low-Spoon Mode) & 24h Pre-Consult Auto-Prep in `smart-rescheduler.ts` and `alert-scanner.ts`.
- **Full Test Suite:** 41 passed test files, 335 passed tests, 0 failures.
- **Health Verification:** `/healthz`, `/api/healthz`, `/api/v1/agenda`, `/api/v1/pain/analytics` all verified.

## Notes
- Domains: Agent Brain & Memory (`dashboard/lib/agents/intent-router.ts`, `semantic-memory.ts`, `SOUL.md`), Adaptive Yoga & Rehab (`yoga-engine.ts`, `rehab-learning.ts`, `agenda/route.ts`), Multimodal OCR & Budgeting (`ocr-parser.ts`, `budget-engine.ts`), Clinical Analytics (`pain/analytics/route.ts`), Insight Engine (`insight-engine.ts`).
- Standing preferences: Live-data-only in production (zero mock fallbacks); maximum clinical utility, accessibility, and zero-friction UX over token-saving shortcuts; preserve `MEDICAL_GUARDRAIL` on all clinical outputs; respect `CONTEXT.md` procedural safety (request explicit synchronous approval before updating `CONTEXT.md` for the 07:00 AM Yoga lock-in refinement).
- Skills to consult: `grilling`, `domain-modeling`, `prototype`, `medical-team`.

## Decisions so far
- **Scope & Destination Locked** — Full 3-pillar upgrade covering Universal Snap-and-Route Capture, Omniscient Context & Memory Brain, Adaptive Yoga/Rehab + Clinical Change Analytics, and Proactive Cross-Domain Autonomy.
- **Adaptive Yoga Timing & Granularity** — Synthesize and lock in the 3 daily routines by **07:00 AM** (incorporating the previous night's + 06:00 AM pain logs in case the user wakes early), dynamically re-rank on intraday flares, auto-swap contraindicated individual poses inside routines, and display "Why This Routine" badges.
- **Clinical Change Analytics & Physician Pack** — Include all 4 dimensions: Period-over-Period (7d/30d) delta cards, Anatomical Migration shift tracking, Intervention/Trigger correlation matrix, NLP symptom keyword timeline, and a 1-Click Specialist-Tailored Physician Consult Pack.
- **Evidence-Backed Insights Loop** — Feed 14-day cross-domain data into Insight generation, classify into 4 tags (`[REHAB RULE]`, `[PAIN TRIGGER]`, `[SCHEDULE HABIT]`, `[BUDGET/ADMIN]`), and wire an explicit **Approve (Teach Rumble) / Edit / Dismiss** action that writes directly to `SOUL.md`, `semantic_memories`, and active engine rules.
- **Snap-and-Route Multimodal Capture** — Support multi-category line-item splitting on mixed receipts, automatic dual-logging of clinical receipts to `budget_items` (`Medical`) + `medical_receipts`, recurring bill price-creep detection in `bills_subscriptions`, and document routing for referral letters and medication boxes.
- **Proactive Autonomy** — Include Flare-Aware Schedule Triage (Low-Spoon Mode on >= 7/10 pain), 24h Pre-Consult Auto-Prep from Google Calendar, Unified Context Brain 3.0, and 1-sentence messy voice/text multi-action unpacking.

## Not yet specified
- How should conflicting learned rules in `SOUL.md` / `semantic_memories` be reconciled or superseded when a user approves a newer Insight that contradicts an older rule?
- What is the exact visual layout for printing/exporting the 1-page Physician Consult Pack so it reads cleanly on both mobile screens (handing phone to doctor) and A4 PDF printouts?
- When "Flare Triage (Low-Spoon Mode)" proposes moving non-urgent tasks to a lower-pain day, how does it weigh Wangaratta weather constraints (e.g., washing days) against Google Calendar density?

## Out of scope
