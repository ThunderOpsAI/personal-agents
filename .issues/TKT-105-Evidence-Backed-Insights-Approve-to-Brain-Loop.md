# Evidence-Backed Rumble Insights & "Approve to Brain" Learning Loop
Labels: wayfinder:grilling, status:completed
Parent: MAP-RumbleOS-Brain-3.0.md
Blocked-By: TKT-101-Omniscient-Context-Brain-and-Multi-Action-Router.md, TKT-102-Adaptive-Yoga-7AM-Lock-and-Pose-Swapping.md
Blocks: none

## Status
**Completed & Verified** (Vitest: `insight-engine.test.ts` 4/4 passed, full suite 335/335 passed)

## Resolution & Implementation
1. **14-Day Cross-Domain Pattern Detection:** Implemented `generateCrossDomainInsights()` in `dashboard/lib/agents/insight-engine.ts` synthesizing interactions across Pain Logs, Rehab Relief deltas, Weather/Washing, Agenda completion, and Budget/Medical spend.
2. **Deduplication & Classification:** Tagged into `[REHAB RULE]`, `[PAIN TRIGGER]`, `[SCHEDULE HABIT]`, and `[BUDGET/ADMIN]`, checking existing rules in `SOUL.md` to prevent duplicate alerts.
3. **Approve (Teach Rumble) Action:** Implemented `approveInsightToBrain()` and wired the Approve button in `dashboard/app.js` to call `POST /api/v1/agenda` with `action: 'approve_insight'`.
4. **Dual Persistence & Activation:** Persists approved rules into `SOUL.md` via `persistSoulRule`, indexes to `semantic_memories`, updates the agenda item status to completed, and provides live toast confirmation.

## Question
How should `dashboard/lib/agents/insight-engine.ts` and the Agenda Insight Card UI be upgraded so that:
1. Insights are generated from a 14-day cross-domain digest (Pain + Rehab Relief + Weather + Schedule + Budget) with concrete quantitative evidence, deduplicated against existing learned rules, and tagged as `[REHAB RULE]`, `[PAIN TRIGGER]`, `[SCHEDULE HABIT]`, or `[BUDGET/ADMIN]`?
2. Clicking **Approve (Teach Rumble)** on an Insight card persists the rule to both `SOUL.md` and `semantic_memories` **and** wires it directly into the active decision engines (e.g., updating `ExerciseRecalibrationRule` in `rehab-learning.ts`, category rules in `budget-engine.ts`, or scheduling rules in `agenda-engine.ts`)?
