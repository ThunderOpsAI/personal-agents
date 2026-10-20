# Agent Master Prompt: AI Studio Feature Upgrades (`bet-mate`, `stock-exchange`, & Core Workspace Projects)

> **How to use this file:** Copy the prompt block you need below (Part 1 for **`bet-mate` + `stock-exchange`** on your PC, or Part 2 for the **3 local workspace upgrades**: `cv-scan`, `ai-customs-code-classifier` / `eu-ai-act-compliance-checker`, and `class-action-app` / `legal`).

---

## PART 1: Master Prompt for `bet-mate` & `stock-exchange` (Run on PC)

Copy and paste the block below directly into your coding agent on PC:

```markdown
You are tasked with implementing high-impact UI and AI workflow upgrades across two flagship repositories (`ThunderOpsAI/bet-mate` and `ThunderOpsAI/stock-exchange`), inspired by Google AI Studio's bundled app architectures (`tickr`, `ai-data-analyst`, `versatile_execution_agent`, and `research_visualization`).

Before writing code in either repository:
1. Inspect the existing project structure, `CONTEXT.md`, `SPEC.md`, and `AGENTS.md`.
2. Preserve all existing architectural and safety invariants (e.g., `bet-mate`'s responsible gambling / non-transactional analytics focus and proxy patterns; `stock-exchange`'s strict $100.00 paper-trading invariants, 3 max concurrent positions, $10 cash buffer, $3 max risk cap, and two-tier $80/$70 circuit breakers).
3. Match the existing tech stack and styling conventions (Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Lucide React, Framer Motion, Recharts, TanStack Query, FastAPI/Python).
4. Ensure all TypeScript checks, linting, and Python/JS test suites pass with zero regressions.

---

### PROJECT 1: `ThunderOpsAI/bet-mate`
**Target Stack:** `apps/web` (Next.js 16 / React 19 / Tailwind v4 / Recharts), `apps/api` (Express / Prisma), and `services/prediction-engine` (FastAPI / Modal).

#### Upgrade 1A: `tickr` — Live Odds Movement, Steamer/Drifter & Model Edge Strip
1. **Top Signal Ticker Bar & Expandable Drawer (`apps/web`):**
   - Build a sleek, toggleable `LiveSignalTicker` component across the main dashboard supporting Horse Racing (Betfair), NBA, AFL, NRL, Soccer, Golf, and MMA.
   - Each ticker card/pill displays:
     - Event / Runner / Matchup label (e.g., `Flemington R6 #4`, `Lakers vs Nuggets`)
     - Live market movement & mini sparkline (e.g., `Steamer: $5.50 -> $3.80` or `Line Move: -3.5 -> -5.5`)
     - Model Edge & Confidence Badge (`+7.8% Edge | High Confidence` vs `Market Overreaction`)
     - A 1-sentence explainable AI signal takeaway explaining *why* the model agrees or disagrees with the market move.
2. **Filter Controls:**
   - Allow filtering the live strip by Sport, Signal Type (`Steamers`, `Drifters`, `Positive EV / Model Edge`, `Late Scratches / Injury Impact`), and minimum confidence threshold.

#### Upgrade 1B: `ai-data-analyst` — Conversational Bankroll, ROI & Strategy Analyst Panel
1. **"Ask My Bankroll & Model Analyst" View (`apps/web` + API route):**
   - Create an interactive Data Analyst tab inside the Bankroll / Paper Bets / Nightly Strategy section.
   - Pre-load or query the user's settled paper bets and model prediction history (`/api/predictions/results` and `/api/paper-bets`) including metrics like Hit Rate, ROI %, Brier Score, Log Loss, Sport, Track/Venue, Odds Bracket, and Strategy Profile.
2. **Natural-Language Query + Auto-Charting:**
   - Provide starter prompt chips (e.g., *"Where is my model generating the highest ROI over the last 30 days?"*, *"Compare my Brier score and win rate across Horse Racing vs NBA vs AFL"*, *"Show performance on odds > $4.00 vs favourites"*).
   - When queried (or when a CSV of historical bets is dropped in), return:
     - Structured KPI summary cards (Net Paper Profit/Loss, ROI %, Win Strike Rate, Calibration / Brier delta, Best/Worst segment).
     - Dynamic Recharts visualizations (Bar, Line/Equity Curve, or Scatter calibration chart) automatically selected based on the query.
     - Actionable strategy tuning recommendations that link to the Nightly Strategy Runner profiles.

#### Upgrade 1C: `research_visualization` — Explainable Form & Matchup Factor Graph
1. **Visual Prediction Breakdown Card:**
   - On individual race/match prediction modals, add a visual factor-weight breakdown (showing how recent form, track/surface condition, pace/tempo, head-to-head history, and market implied probability contributed to the final model probability).

---

### PROJECT 2: `ThunderOpsAI/stock-exchange` (and/or `stock-mate`)
**Target Stack:** Python 3.12 (`src/`, `tests/`) + Dashboard/Web UI (or local FastAPI/React monitoring interface).

#### Upgrade 2A: `versatile_execution_agent` — LLM Committee Deliberation & Deterministic Risk Pipeline View
1. **Multi-Step Execution DAG / Pipeline Visualizer:**
   - Build a live execution trace view (and structured JSON audit emitter) that visualizes every trade cycle as a 5-stage deterministic pipeline:
     - `[Stage 1: Market & News Signal Ingestion]` -> Shows data freshness check (Fail-Closed validation).
     - `[Stage 2: LLM Committee Deliberation]` -> Displays each committee agent's vote (`BULLISH`, `BEARISH`, `HOLD`), thesis snippet, and consensus score.
     - `[Stage 3: Deterministic $100 Sandbox Risk Gate]` -> Explicitly shows pass/fail badges for every hard invariant:
       - Sandbox Capital = `$100.00`
       - Open Positions `<= 3` (`$28–$30` sizing)
       - Uninvested Cash Buffer `>= $10.00 (10%)`
       - Max Trade Risk ($R$) `<= $3.00 (3.0%)`
       - Circuit Breaker Status: `NORMAL (> $80)`, `TIER 1 SOFT FREEZE (<= $80)`, or `TIER 2 HARD LIQUIDATION / HALTED.lock (<= $70)`.
     - `[Stage 4: Paper Bracket Order Execution]` -> Entry, Stop-Loss, and Take-Profit bracket levels.
     - `[Stage 5: Post-Trade Audit Log]` -> Timestamped immutable audit entry.

#### Upgrade 2B: `tickr` + `ai-data-analyst` — Sandbox Equity Monitor & Two-Tier Backtest Tear-Sheet Explorer
1. **Live Sandbox Header Strip (`tickr` pattern):**
   - Real-time status strip showing Total Equity (`$100.00` baseline), Cash Reserve (`>= $10.00`), Active Slots (`X / 3`), Distance to Tier 1 (`$80`) and Tier 2 (`$70`) Circuit Breakers, and `HALTED.lock` indicator.
2. **Two-Tier Backtest Analyst (`ai-data-analyst` pattern):**
   - Allow loading two-tier backtest outputs/CSV logs to automatically chart equity curves, drawdown vs. the $80/$70 circuit breaker lines, win/loss distribution, and committee agent accuracy breakdown.

---

### Verification Checklist
- Run all unit and integration tests (`pytest` in `stock-exchange` and `services/prediction-engine`; `pnpm lint`, `pnpm typecheck`, and `pnpm build` in `bet-mate`).
- Verify that no real-money execution paths or invariant overrides were introduced.
```

---

## PART 2: Master Prompt for the 3 Core Workspace Upgrades (`cv-scan`, `ai-customs-code-classifier` / `eu-ai-act`, `class-action-app` / `legal`)

```markdown
You are tasked with implementing 3 high-impact UI and AI workflow upgrades across our projects in `/Users/thunderopsai/Documents/Workspace/01_Projects`:

1. **`scribe` + `global_kit_generator` -> `cv-scan` (`cv-scan/app`)**:
   - Add an inline Co-Writing & Diff Editor to the scan results view so users can click any tailored resume bullet or cover letter paragraph to trigger quick AI actions (`Tighten & Punchier`, `Add Quantifiable Metrics`, `Match Job Keywords Harder`, and `AU/UK CV <-> US Resume Localization Toggle`).
   - Show an inline visual diff (old text vs. highlighted new text) with `Accept` (✓), `Reject` (✕), and `Retry` buttons, syncing accepted edits with Copy/Export actions.
   - Verify with `npm run quality`.

2. **`category_generator` + `ai-data-analyst` -> `ai-customs-code-classifier` & `eu-ai-act-compliance-checker`**:
   - In `ai-customs-code-classifier`: Add a Hierarchical Taxonomy Path card (`Section -> Chapter -> Heading -> HS Subheading`) with confidence meters, ruled-out alternatives, and a Batch Manifest CSV Upload tab with summary KPI cards and enriched CSV export.
   - In `eu-ai-act-compliance-checker`: Render a 4-tier visual Risk Classification Matrix (`Unacceptable`, `High-Risk`, `Limited-Risk`, `Minimal-Risk`) with confidence scores, matched Annex/Article pills, and an interactive compliance checklist.
   - Verify with typecheck and build in both repos.

3. **`research_visualization` + `tickr` -> `class-action-app` & `legal`**:
   - In `class-action-app`: Add a top `tickr`-style Regulatory & ASX Alert Strip (ASIC, ACCC, ASX continuous disclosure drops, court filings with impact badges) and a split-pane Case Visualizer (left chronological event timeline + right interactive entity & evidence relationship cards).
   - In `legal`: Add a reusable Chronology & Entity-Evidence Graph view/template linking dates, actors, claims, and exhibit citations.
   - Verify with typecheck and build.
```
