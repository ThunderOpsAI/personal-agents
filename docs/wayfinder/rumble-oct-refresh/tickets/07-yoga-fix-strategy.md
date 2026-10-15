---
title: Yoga alignment fix strategy
label: wayfinder:grilling
status: closed
assignee: agent
blocked_by: [06-yoga-mismatch-audit]
---

## Question

Given the audit, how do we make images and descriptions agree: remap existing posters, rewrite steps to match posters, generate one image per exercise, or crop poster panels per step? Must respect surgery/clinician restrictions.

## Resolution

**Hybrid Isolated-Asset Strategy (No Compromise on Clinical Safety):**

1. **Strictly Preserve Step Text & Clinical Constraints:**
   - Under `AGENTS.md`, never rewrite clinically prescribed steps to fit legacy posters. The exercises adhere to post-C5-C7 cervical fusion, right frozen shoulder (< 80° elevation), and knee/ankle surgical constraints.

2. **Crop Existing Multi-Exercise Posters into Isolated Single Poses:**
   - For poses that already exist in multi-panel posters (`cervical_neck_mobility.jpg`, `thoracic_spine_mobility.jpg`, `lumbar_core_routine.jpg`, `hip_mobility_routine.jpg`), crop the individual panels into standalone graphics:
     - Cervical: `/exercises/chin_tuck.jpg`, `/exercises/lateral_ear_shoulder.jpg`, `/exercises/shoulder_shrug.jpg`
     - Thoracic: `/exercises/thread_needle.jpg`, `/exercises/supine_twist.jpg`, `/exercises/cactus_opener.jpg`
     - Core: `/exercises/cat_cow.jpg`
     - Hip: `/exercises/kneeling_lunge.jpg`, `/exercises/ninety_ninety_hip.jpg`, `/exercises/glute_bridge.jpg`, `/exercises/reclined_figure_four.jpg`

3. **Deploy Dedicated Assets from `clinical_exercise_library/images/`:**
   - Substitute missing/mismatched poses with existing vetted SVGs/PNGs from `clinical_exercise_library/`:
     - Sphinx Micro-Lifts (`y3` step 3) → `supported-sphinx-micro-lifts.svg`
     - Supine Strap Leg Extension & Flutters (`y9` steps 1 & 3) → `supine-strap-hamstring-calf.svg`
     - Supported Bridge Pose (`y10` step 2) → `supported-bridge-block.svg`
     - Legs Up the Wall (`y3` step 4) → `legs-elevated-relaxation.svg`
     - Bound Angle & Constructive Rest (`y3` step 1, `y4` step 4, `y6` step 4) → `constructive-rest.svg`

4. **Seated Chair Yoga Generation (`y7`):**
   - Provide 4 dedicated seated chair illustrations (`seated_cat_cow`, `seated_figure_four`, `seated_trap_drop`, `seated_chest_expansion`) so floor graphics are never shown for desk decompression.

5. **Execution Plan:**
   - Implement cropped and library assets into `dashboard/public/exercises/`.
   - Update `dashboard/lib/exercise-db.ts` step `frames`.
   - Execute `scripts/sync_yoga_routines_and_runner.ts` to push into `dashboard/public/app.js` and `dashboard/app.js`.
