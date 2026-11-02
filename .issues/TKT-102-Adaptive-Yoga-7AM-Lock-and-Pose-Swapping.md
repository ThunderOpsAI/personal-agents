# Adaptive Yoga 07:00 AM Lock-In, Intraday Flare Reactivity & Pose Swapping
Labels: wayfinder:grilling, status:completed
Parent: MAP-RumbleOS-Brain-3.0.md
Blocked-By: none
Blocks: TKT-105-Evidence-Backed-Insights-Approve-to-Brain-Loop.md, TKT-106-Proactive-Flare-Triage-and-Pre-Consult-Auto-Prep.md

## Status
**Completed & Verified** (Vitest: `yoga-engine.test.ts` 8/8 passed, full suite 335/335 passed)

## Resolution & Implementation
1. **Dynamic Yoga Selection:** Eliminated hardcoded routines in `agenda/route.ts`; wired `getSuggestedYogaRoutines()` dynamically returning `choices` and `routine_details`.
2. **07:00 AM Australia/Melbourne Lock-In:** Implemented `lockedDailyCache` locking routines by 07:00 AM, with automatic cache invalidation and re-ranking if an acute flare (`score >= 7/10`) is recorded mid-day.
3. **Multi-Factor Scoring (`scoreRoutine`):**
   - Active pain generators matching focus areas (+35 pts)
   - Pain severity >= 7 forces gentle restorative/decompression (+40 pts) and penalizes vigorous flows (-50 pts)
   - Historical relief deltas from `exercise_preferences` (+15 pts per relief point)
   - Dismissal penalties (-25 pts per "Hurts", -10 pts per "Too tired")
   - Hard surgical guardrails (C5-C7 ACDF -80 pts, Right L4-S1 radiculopathy -60 pts)
4. **Step-Level Pose Swapping (`adaptRoutinePoses`):**
   - Swaps contraindicated lumbar flexion/twists/bridges for *Supported Child's Pose Decompression (Adapted)*
   - Swaps cervical hyperextension/shoulder stand for *Seated Axial Retraction - Chin Tuck (Adapted)*
5. **UI Badging:** Surfaced `selection_reason` and adapted pose counts in `dashboard/app.js` agenda stream.

## Question
How should the Adaptive Yoga & Rehab Engine (`dashboard/lib/agents/yoga-engine.ts`, `dashboard/lib/agenda-engine.ts`, and `dashboard/app/api/v1/agenda/route.ts`) be architected to:
1. Eliminate the hardcoded `["Hip Flow", "Lumbar Core", "Shoulder Rehab"]` fallback in `agenda/route.ts` and lock in 3 personalized routines by **07:00 AM Australia/Melbourne** (immediately following the 06:00 AM and overnight pain logs)?
2. Score and select routines using a weighted combination of:
   - Last 24h anatomical pain generators & severity score
   - Historical pre/post relief deltas from `exercise_preferences`
   - Dismissal history (`Hurts`, `Too tired`)
   - Hard surgical/clinician guardrails (C5-C7 ACDF, Right L4-S1 radiculopathy/foot drop)
3. Dynamically swap out individual contraindicated poses/steps inside a selected routine when a specific anatomical generator is flaring, and surface a concise "Why This Routine" explanation badge on the Agenda/Yoga UI?
4. Re-evaluate and update the remaining day's routine suggestions immediately when a new high-pain flare is logged mid-day?
