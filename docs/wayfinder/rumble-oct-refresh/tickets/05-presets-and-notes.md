---
title: Preset loading and clinical note defaults
label: wayfinder:grilling
status: closed
assignee: agent
blocked_by: []
---

## Question

Fixed: tapping a preset loads its values into the form (no auto-save); user must press Save. Decide: what each preset fills (locations/weights, pain score, mood tags/soreness, notes); the expanded clinical-note chip list (user wants many more); how preset-filled notes merge with typed text; and which new preset buttons to add.

## Resolution

1. **Preset Click Behavior:**
   - Tapping any preset button populates/stages all fields into the form state (anatomical locations, percentage splits, overall pain score, active mood & modifier chips, and pre-filled clinical notes).
   - Does NOT trigger auto-submission. The user retains full control to inspect, tweak values, or cancel, and must explicitly tap "Save pain log" at the bottom to submit.

2. **Full Preset Button Suite (9 Presets Total):**
   - *Original 4 (Preserved):*
     - `Standard`: 70% Lumbar (7.5), Rotates Ankle/Knee.
     - `Hydro`: Post-hydro relief (-1.5 vs previous).
     - `Thoracic`: 70% Thoracic, 15% Neck, 15% Scapula @ 7.5.
     - `Sciatica`: Pain 9.5, 100% Sciatica attack flare.
   - *New 5 Presets Added:*
     - `Post-Walk / Activity Flare`: Lumbar/Leg loading fatigue, soreness -2, note "Post-walk loading flare".
     - `Morning Stiffness`: Lumbar + thoracic stiffness, soreness -2, note "Severe morning stiffness, slow mobility".
     - `Neck / Shoulder Tension`: Cervical & scapular strain, note "Cervical/trapezius spasm, guarding".
     - `Nerve Flare / White Fingers`: Cold-triggered pallor/numbness in index fingers + radicular tingling, note "Index fingertip pallor and numbness on cold exposure, radicular flare".
     - `Rest / Low-Pain Day`: Baseline pain low (~3-4), mood calm/ok, note "Rest day, managed baseline pain".

3. **Clinical Notes & Quick-Chip Defaults:**
   - Greatly expanded default chip inventory:
     - *State/Triggers:* Morning stiffness, Desk fatigue, Weather flare, Post-walk, Cold exposure, Long drive, Overexertion, Rested well, Poor sleep.
     - *Therapies/Relief:* Post-hydro, TENS active, Heat pack applied, Cupping, Massage gun, Chiro visit, Stretches/Yoga done, Meditated.
   - Text Area Behavior: Clicking preset buttons or chips appends/merges neatly into the clinical notes text area without wiping out existing user-typed notes.

