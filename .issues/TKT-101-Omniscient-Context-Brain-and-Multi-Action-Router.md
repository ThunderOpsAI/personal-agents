# Omniscient Context Brain & 1-Sentence Multi-Action Router
Labels: wayfinder:grilling, status:completed
Parent: MAP-RumbleOS-Brain-3.0.md
Blocked-By: none
Blocks: TKT-105-Evidence-Backed-Insights-Approve-to-Brain-Loop.md

## Status
**Completed & Verified** (Vitest: 41 suites, 335 tests passed)

## Resolution & Implementation
1. **Omniscient Context Injection (`buildRumbleSystemPrompt` 3.0):** Injected live context blocks in `intent-router.ts`:
   - Current Month Budget & Category Totals (via `getMonthRange` + `calculateBudgetBreakdown`)
   - Active Recurring Bills & Due Dates (`bills_subscriptions`)
   - 7-Day Pain Trend & Top Relief Drivers (`getPainLogsFromDb` + `getExercisePreferences`)
   - Top 5 Query-Relevant Semantic Memories (`searchSemanticMemories`)
   - Active `SOUL.md` Learned Rules (`getSoulLearnedRules`)
2. **Deterministic 1-Sentence Multi-Action Unpacking:** Added `parseMultiActionSentence` to unpack mixed updates (e.g., hydro + pain drop + entry fee + follow-up task) into `multi_action` previews with automatic calculation of scheduled times and relief deltas.
3. **Intent Mapping Resolution:** Upgraded `dashboard/app/api/v1/rumble/chat/route.ts` line 19 with `resolveActionIntent` and `resolveAllActionIntents` returning arrays of intents (`ADD_EXPENSE`, `LOG_PAIN`, `ADD_NOTE`, `ADD_TASK`) to auto-refresh all panels concurrently.
4. **Execution Branches:** Added execution branches in `executeConfirmedAction` for `medical_receipt` (with dual-logging), `bill_subscription` (with price-creep detection), and `rehab_relief`.

## Question
How should `buildRumbleSystemPrompt` 3.0 and `routerActionSchema` in `dashboard/lib/agents/intent-router.ts` be structured so that:
1. Rumble Chat has live visibility into Current Month Budget & Category Totals, Top Semantic Memories (`semantic_memories`), Active `SOUL.md` Rules, 7-Day Pain/Rehab Relief History, and Active Legal/Admin Context without latency spikes or context bloat?
2. A single messy voice or text message (e.g., *"Had hydro today, pain dropped from 7 to 5, cost $8.50 entry, and remind me to ask Dr. Riandito about the referral Friday"*) deterministically unpacks into a unified `multi_action` confirmation preview covering `rehab_relief`, `pain_log`, `budget_item`, `medical_receipt`, and `task`—and properly triggers UI refreshes (`ADD_EXPENSE`, `LOG_PAIN`, `ADD_TASK`) in `dashboard/app/api/v1/rumble/chat/route.ts`?
