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
- [Nerve connection research](tickets/08-nerve-connection-research.md) — Three likely separate processes (cervical cord UMN, lumbar root sciatica, vascular Raynaud fingertips); report in `agent_reports/2026-10-14_nerve_connection_evidence_review_v1.md`.
- [AI/Tech reading progress](tickets/09-ai-tech-progress.md) — Archive (hide, keep rows); revisit later.

## Not yet specified

- Content outline for the Nerves and Nutrition + Psychology encyclopaedias (draft outlines agreed; ready to generate/stage).
- Business Finance encyclopaedia outline and content for Victorian tiling business (> $75k GST/BAS).
- Implementation plan for Yoga step image/description alignment (pending audit completion in Ticket 06 & strategy in Ticket 07).

## Out of scope
