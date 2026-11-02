# 4D Clinical Change Analytics & 1-Tap Physician Consult Pack
Labels: wayfinder:prototype, status:completed
Parent: MAP-RumbleOS-Brain-3.0.md
Blocked-By: none
Blocks: TKT-106-Proactive-Flare-Triage-and-Pre-Consult-Auto-Prep.md

## Status
**Completed & Verified** (Vitest: `pain_analytics_periods.test.ts` 7/7 passed, full suite 335/335 passed)

## Resolution & Implementation
1. **Period-over-Period Deltas:** Implemented `period_deltas` in `dashboard/app/api/v1/pain/analytics/route.ts` calculating mean score delta, severe flares delta (≥7/10), and diurnal escalation slope for 7d vs prior 7d and 30d vs prior 30d.
2. **Anatomical Migration Shifts:** Implemented `anatomical_migration` calculating percentage shift per body region over time with trend indicators (`increasing`, `decreasing`, `stable`).
3. **Intervention & Trigger Correlation Matrix:** Live correlation of `exercise_preferences` relief deltas vs schedule density and weather aggravators, ranking Top Relief Drivers vs Top Flare Triggers.
4. **NLP Symptom Progression Timeline:** Implemented `symptom_progression` keyword scanning across log notes for Foot Drop & Gait, Sciatic Shockwaves, Numbness, Paraspinal Spasms, and Nocturnal Sleep Interruption with recent clinical snippets.
5. **1-Tap Specialist-Tailored Consult Pack:** Implemented `generateConsultPackMarkdown` supporting Neurosurgeon, Orthopaedic, GP, Physio, and WorkCover/Legal, writing clean Markdown files to `agent_reports/` with `MEDICAL_GUARDRAIL` and download export in `dashboard/app.js`.

## Question
How should `dashboard/app/api/v1/pain/analytics/route.ts` and the Pain Analytics / Clinical Synopsis UI be designed and prototyped to deliver:
1. **Period-over-Period Delta Cards:** Side-by-side comparison of *Last 7 Days vs. Prior 7 Days* and *Last 30 Days vs. Prior 30 Days* (mean pain, severe flare frequency `>= 7/10`, and diurnal morning-to-evening escalation slope).
2. **Anatomical Migration Shift Visualizer:** Tracking how pain distribution percentages shift across body regions over time (e.g., Right Lumbar vs. Cervical vs. Sciatic radiation) to help clinicians distinguish LMN root compression vs. UMN cord changes.
3. **Intervention & Trigger Correlation Matrix:** Correlating `exercise_preferences` relief deltas, Hydrotherapy completion, Wangaratta weather/barometric changes, and schedule density against pain shifts to rank **Top Relief Drivers** vs. **Top Aggravators**.
4. **NLP Symptom Progression Timeline:** Tracking frequency of clinical red-flag terms from log notes and chat (*foot drop / tripping*, *sciatic shockwaves*, *numbness*, *spasms*).
5. **1-Tap Specialist-Tailored Physician Consult Pack:** Replacing static synopsis strings with a live, dynamic 1-page printable/PDF/Markdown clinical handoff tailored by specialist type (Neurosurgeon, Orthopaedic, GP, Physio, WorkCover/Legal).
