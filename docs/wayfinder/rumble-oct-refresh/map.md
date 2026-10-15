---
label: wayfinder:map
title: Rumble October refresh
---

## Destination

A build-ready spec for five changes, each handed to a build agent with no open questions: weekly MacroDroid reminder, yoga image/description alignment, pain-log redesign (presets, mood/soreness, notes), morning-briefing news order, and encyclopaedia topic swap.

## Notes

- Planning only; build happens after hand-off.
- Follow AGENTS.md: live data only, no decorative emoji (mood selector excepted), medical output is decision support and saved to `agent_reports/`.
- Skills: `/grilling`, `/domain-modeling`; `medical-team` for anything nerve/pain related.
- Tracker: local markdown. Tickets are `tickets/NN-*.md` here; `status`, `assignee`, `blocked_by` in frontmatter. Frontier = open, unassigned, all blockers closed.

## Decisions so far

- [MacroDroid weekly reminder](tickets/01-macrodroid-reminder.md) — Bright red persistent top banner every Thursday 10:00 Australia/Melbourne: "Watch 3 ads (+9 days)"; stays until Done tapped.
- [Morning briefing news layout](tickets/02-briefing-news-layout.md) — One scrolling briefing: Schedule/Priorities, OKC/NBA, AI/Tech, Aus/World. No tabs, no Full view, no extra button.
- [Encyclopaedia topic set](tickets/03-encyclopaedia-topics.md) — Keep Pain and Mindset; remove AI and Tech; add Nerves (deep dive), Nutrition + Psychology (combined), and Business Finance (Victorian tiling business: GST, BAS, etc.).
- [Mood and soreness scoring model](tickets/04-mood-soreness-model.md) — Base 5.0, clamped [0, 10], manual override enabled; mood tags (Happy/OK/Calm vs Frustrated/Sad/Anxious); 5 soreness levels (0 to -4); activity & therapy modifiers.
- [Preset loading and clinical note defaults](tickets/05-presets-and-notes.md) — Stage form on click (no auto-save, explicit save button required); 9 total presets; expanded note defaults and smart merge.
- [Yoga step image/description audit](tickets/06-yoga-mismatch-audit.md) — Completed audit across 40 steps: 8 exact matches, 10 multi-poster clutter, 22 mismatches. Report in `agent_reports/2026-10-15_yoga_step_image_mismatch_audit.md`.
- [Yoga alignment fix strategy](tickets/07-yoga-fix-strategy.md) — Hybrid isolated-asset approach: preserve clinical steps, crop multi-panel posters into single poses, deploy 72 existing vetted vector SVGs from `clinical_exercise_library/images/`, generate chair yoga graphics.
- [Nerve connection research](tickets/08-nerve-connection-research.md) — Three likely separate processes (cervical cord UMN, lumbar root sciatica, vascular Raynaud fingertips); report in `agent_reports/2026-10-14_nerve_connection_evidence_review_v1.md`.
- [AI/Tech reading progress](tickets/09-ai-tech-progress.md) — Archive (hide, keep rows); revisit later.
- [Victorian tiling business compliance research](tickets/10-business-finance-research.md) — 16-chapter outline covering GST/BAS, TPAR, Super/STP, contractor rules; report in `docs/research/victorian-tiling-business-compliance.md`.

## Frontier / Ready for Build Execution

All 10 specification tickets are closed. The project is fully chartered and ready for build execution:
1. **Frontend / UI Implementation (`dashboard/public/app.js` & `dashboard/index.html`)**:
   - MacroDroid Thursday banner.
   - Morning Briefing single scrolling feed.
   - Pain logging presets, mood/soreness scoring, and clinical note chip injection.
2. **Exercise Library Graphic Deployment & Runner Sync**:
   - Crop multi-panel poster assets and wire `clinical_exercise_library/images/` SVGs into `dashboard/lib/exercise-db.ts`.
   - Run `scripts/sync_yoga_routines_and_runner.ts` to sync runner routines.
3. **Encyclopaedia Topics Swap**:
   - Stage Nerves, Nutrition + Psychology, and Business Finance content; archive AI/Tech topics.
