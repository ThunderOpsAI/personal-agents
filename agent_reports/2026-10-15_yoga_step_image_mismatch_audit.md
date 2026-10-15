# Yoga Step Image & Description Alignment Audit

**Document Reference**: `agent_reports/2026-10-15_yoga_step_image_mismatch_audit.md`  
**Date**: 2026-10-15  
**Version**: 1.0.0  
**Context**: Wayfinder Ticket 06 ([`tickets/06-yoga-mismatch-audit.md`](file:///Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/docs/wayfinder/rumble-oct-refresh/tickets/06-yoga-mismatch-audit.md))  
**Target Codebase**: [`dashboard/lib/exercise-db.ts`](file:///Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/dashboard/lib/exercise-db.ts), [`dashboard/public/app.js`](file:///Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/dashboard/public/app.js)  
**Status**: Completed (Read-Only Audit)

---

## 1. Executive Summary & Root Cause

An exhaustive, step-by-step audit of all 10 yoga routines (`y1` through `y10`, comprising 40 individual steps) in `dashboard/lib/exercise-db.ts` was conducted to evaluate visual alignment between step names/descriptions and their associated image files.

### Overall Audit Findings
- **Total Steps Audited**: 40
- **Exact Matches (Isolated Single Exercise)**: 8 steps (20.0%)
- **Partial Matches (Multi-Exercise Poster / Cluttered Frame)**: 10 steps (25.0%)
- **Complete Mismatches (Wrong Exercise / Conflicting Posture / Absent Pose)**: 22 steps (55.0%)

### Root Cause
In commit `328ac78`, a heuristic keyword matcher (`scripts/update_exercise_infographics.js`) bulk-mapped all 40 yoga steps to one of 9 general infographic poster images. Because several images are composite posters containing 3 to 4 distinct exercises (e.g. `cervical_neck_mobility.jpg`, `thoracic_spine_mobility.jpg`, `lumbar_core_routine.jpg`, `hip_mobility_routine.jpg`), and fallback keywords assigned unrelated exercises (e.g. Cat-Cow assigned to Savasana, Hamstring Straps assigned to Bird-Dog), the majority of routines currently show confusing, extraneous, or contradictory visual cues during the live protocol countdown.

### Clinical & Usability Risks
1. **Conflicting Postural Orientation**: Steps calling for seated or prone positions (e.g. `y2` Seated Retraction, `y6` Prone Rest, `y7` Chair Yoga) display a supine lying-down graphic (`restorative_savasana.jpg`), causing user disorientation.
2. **Cervical & Post-Surgical Safety**: For a user with C4–C7 anterior cervical fusion and lumbar pathology, glancing at a multi-exercise poster while holding a timed pose creates neck torque and visual confusion.
3. **Missing Guidance**: High-value restorative poses (Sphinx, Legs-Up-The-Wall, Reclined Bound Angle, Strap Hamstring Stretch) lack accurate postural representation entirely.

---

## 2. Inventory of Current Image Assets

The 9 image files currently referenced across all yoga steps:

| Image Path | Format | Dimensions / Content | Actually Depicts |
|---|---|---|---|
| `/exercises/supine_pelvic_tilts.jpg` | Single Topic | 2-Panel Infographic | Posterior pelvic tilt (flatten lower back) vs Anterior/neutral pelvic tilt (gentle arch). |
| `/exercises/supported_childs_pose.jpg` | Single Topic | Single Infographic | Supported Child's Pose over bolster between wide knees. |
| `/exercises/knee_to_chest_stretch.jpg` | Single Topic | Single Infographic | Supine Single Knee-to-Chest hold with sacral grounding (plus double knee inset). |
| `/exercises/restorative_savasana.jpg` | Single Topic | Single Infographic | Supine Savasana lying flat on mat with bolster under knees, 360 diaphragmatic breath. |
| `/exercises/cervical_neck_mobility.jpg` | Multi-Poster | 3-Panel Poster | 1. Seated Axial Retraction (chin tucks)<br>2. Gentle Lateral Ear-to-Shoulder<br>3. Shoulder Shrug & Release |
| `/exercises/thoracic_spine_mobility.jpg` | Multi-Poster | 3-Panel Poster | 1. Thread the Needle<br>2. Gentle Supine Spinal Twist<br>3. Seated Cactus Chest Expansion |
| `/lumbar_core_routine.jpg` | Multi-Poster | 4-Panel Poster | 1. Lumbar Spine Stability<br>2. Cat-Cow Mobility<br>3. Bird-Dog Exercise<br>4. Dead Bug Hold |
| `/shoulder_rehab_routine.jpg` | Multi-Poster | 3-Panel Poster | 1. Wall Slides<br>2. Scapular Squeezes<br>3. Thoracic Extension on Foam Roller |
| `/hip_mobility_routine.jpg` | Multi-Poster | 4-Panel Poster | 1. Kneeling Hip Flexor Lunge<br>2. 90/90 Hip Stretch<br>3. Glute Bridges<br>4. Piriformis Stretch (Figure-Four) |

---

## 3. Comprehensive Step-by-Step Audit Table (y1 - y10)

| Routine ID & Name | Step # | Step Title & Duration | Staged Cue & Instruction | Referenced Image File | What Image Actually Depicts | Audit Status | Clinical / Alignment Analysis |
|---|---|---|---|---|---|---|---|
| **y1**: Gentle Lumbar Release | 1 | Supine Pelvic Tilts (225s) | "Flatten lower back against the mat on exhale, gentle arch on inhale." | `/exercises/supine_pelvic_tilts.jpg` | Two-panel guide showing posterior flatten and anterior arch tilts. | **Match** | Perfect 1:1 match with visual cues and breathing markers. |
| **y1**: Gentle Lumbar Release | 2 | Supported Child's Pose (225s) | "Widen knees, rest torso forward on bolster, lengthen spine." | `/exercises/supported_childs_pose.jpg` | Supported Child's Pose over bolster between wide knees. | **Match** | Perfect 1:1 match with bolster setup. |
| **y1**: Gentle Lumbar Release | 3 | Supine Single Knee-to-Chest (225s) | "Gently hug right knee, then left knee. Keep sacrum grounded." | `/exercises/knee_to_chest_stretch.jpg` | Supine single knee hug with sacral grounding cues. | **Match** | Perfect 1:1 match. |
| **y1**: Gentle Lumbar Release | 4 | Restorative Savasana with Bolster (225s) | "Place bolster under knees to release psoas and lumbar pressure." | `/exercises/restorative_savasana.jpg` | Supine corpse pose with bolster under knees. | **Match** | Perfect 1:1 match. |
| **y2**: Cervical Mobility Flow | 1 | Seated Axial Retraction (150s) | "Gently draw chin backwards creating a double chin, lengthening back of neck." | `/exercises/cervical_neck_mobility.jpg` | 3-exercise poster (Panel 1: Seated Chin Tuck; Panel 2: Ear-to-Shoulder; Panel 3: Shrugs). | **Partial Match** | Depicted in Panel 1, but runner presents full 3-exercise poster rather than isolating chin tucks. |
| **y2**: Cervical Mobility Flow | 2 | Gentle Lateral Ear-to-Shoulder (150s) | "Drop right ear to right shoulder without lifting left shoulder. Repeat left." | `/exercises/cervical_neck_mobility.jpg` | 3-exercise poster (Panel 2: Gentle Lateral Ear-to-Shoulder). | **Partial Match** | Depicted in Panel 2, but cluttered with Panels 1 and 3. |
| **y2**: Cervical Mobility Flow | 3 | Shoulder Shrug & Release (150s) | "Inhale lift shoulders to ears, exhale drop down with sigh." | `/exercises/cervical_neck_mobility.jpg` | 3-exercise poster (Panel 3: Shoulder Shrug & Controlled Release). | **Partial Match** | Depicted in Panel 3, but cluttered with Panels 1 and 2. |
| **y2**: Cervical Mobility Flow | 4 | Restorative Alignment Breathing (150s) | "Sit upright, focus on diaphragmatic 360 breathing relaxing neck muscles." | `/exercises/restorative_savasana.jpg` | Supine lying down Savasana on floor with bolster. | **Mismatch** | Cue specifically instructs sitting upright; image depicts lying supine on floor. |
| **y3**: Full Body Restorative Yin | 1 | Supported Reclined Bound Angle (375s) | "Feet together, knees open supported by pillows, hands on lower abdomen." | `/exercises/restorative_savasana.jpg` | Standard Savasana (straight legs over bolster). | **Mismatch** | Reclined Bound Angle (Supta Baddha Konasana) requires soles together and knees wide; image shows straight legs. |
| **y3**: Full Body Restorative Yin | 2 | Gentle Cat-Cow Spine Wave (375s) | "Flow gently with breath, avoiding end-range extremes." | `/lumbar_core_routine.jpg` | 4-exercise core poster (Panel 2: Cat-Cow; Panels 1, 3, 4: Stability, Bird-Dog, Dead Bug). | **Partial Match** | Cat-Cow is present on panel 2, but surrounded by high-effort core conditioning exercises. |
| **y3**: Full Body Restorative Yin | 3 | Supported Gentle Sphinx (375s) | "Rest elbows on mat, gentle passive thoracic extension." | `/exercises/thoracic_spine_mobility.jpg` | 3-exercise poster (Thread the Needle, Supine Twist, Cactus Arms). | **Mismatch** | Sphinx pose (prone passive extension on forearms) is completely absent from the assigned graphic. |
| **y3**: Full Body Restorative Yin | 4 | Legs Up the Wall Relaxation (375s) | "Elevate legs against wall to facilitate venous return and spinal decompression." | `/exercises/restorative_savasana.jpg` | Supine Savasana (legs horizontal on floor bolster). | **Mismatch** | Viparita Karani requires vertical legs against wall; image depicts horizontal floor rest. |
| **y4**: Shoulder & Thoracic Opener | 1 | Thread the Needle (300s) | "Slide right arm under torso, rest right shoulder and temple on mat." | `/exercises/thoracic_spine_mobility.jpg` | 3-exercise poster (Panel 1: Thread the Needle). | **Partial Match** | Depicted in Panel 1, but runner displays full 3-exercise poster. |
| **y4**: Shoulder & Thoracic Opener | 2 | Puppy Pose Thoracic Stretch (300s) | "Hips stay over knees, walk hands forward melting chest towards floor." | `/exercises/supported_childs_pose.jpg` | Supported Child's Pose (hips resting back on heels over bolster). | **Mismatch** | Puppy pose keeps hips elevated vertically over knees; image shows hips sunken onto heels on a bolster. |
| **y4**: Shoulder & Thoracic Opener | 3 | Seated Cactus Arm Openers (300s) | "Draw elbows back and down, opening anterior chest wall." | `/exercises/thoracic_spine_mobility.jpg` | 3-exercise poster (Panel 3: Seated Cactus Chest Expansion). | **Partial Match** | Depicted in Panel 3, but cluttered with Panels 1 and 2. |
| **y4**: Shoulder & Thoracic Opener | 4 | Scapular Retraction & Rest (300s) | "Rest in prone or seated, focusing on mid-back breathing." | `/exercises/restorative_savasana.jpg` | Supine lying down Savasana. | **Mismatch** | Cue directs prone or seated positioning; image shows supine lying flat. |
| **y5**: Hip Flexor & Psoas Flow | 1 | Low Kneeling Lunge (225s) | "Step right foot forward, tuck tailbone, feel stretch in left front hip." | `/hip_mobility_routine.jpg` | 4-exercise poster (Panel 1: Kneeling Lunge; Panels 2-4: 90/90, Bridges, Figure-4). | **Partial Match** | Lunge is depicted in Panel 1, but cluttered with 3 other lower-body exercises. |
| **y5**: Hip Flexor & Psoas Flow | 2 | 90/90 Seated Hip Flow (225s) | "Rotate knees side to side gently to mobilize internal and external rotation." | `/exercises/thoracic_spine_mobility.jpg` | Thoracic Mobility poster (Thread the Needle, Supine Twist, Cactus). | **Mismatch** | Severe mismatch. 90/90 hip flow is on `/hip_mobility_routine.jpg`, but was incorrectly mapped to thoracic spine mobility. |
| **y5**: Hip Flexor & Psoas Flow | 3 | Gentle Reclined Figure-4 (225s) | "Cross right ankle over left thigh, hold left hamstring gently." | `/exercises/knee_to_chest_stretch.jpg` | Single knee hug to chest (straight line, no cross-over). | **Mismatch** | Figure-4 piriformis cross is depicted on `/hip_mobility_routine.jpg`, but step was mapped to knee-to-chest. |
| **y5**: Hip Flexor & Psoas Flow | 4 | Savasana Psoas Rest (225s) | "Lie flat with gentle diaphragmatic expansion." | `/exercises/restorative_savasana.jpg` | Supine Savasana with bolster under knees. | **Match** | Perfect 1:1 match. |
| **y6**: Morning Spine Awakening | 1 | Cat-Cow Spine Awakening (225s) | "Coordinate slow spinal flexion and extension with deep breathing." | `/exercises/restorative_savasana.jpg` | Supine corpse pose with bolster. | **Mismatch** | Cat-cow is quadruped on hands and knees; image depicts lying flat on back. |
| **y6**: Morning Spine Awakening | 2 | Gentle Side Body Lateral Stretch (225s) | "Walk hands to the right in child's pose, then left." | `/exercises/supported_childs_pose.jpg` | Standard straight-forward Supported Child's Pose. | **Partial Match** | Base child's pose is depicted, but lateral side-body reach is absent. |
| **y6**: Morning Spine Awakening | 3 | Gentle Supine Torso Twist (225s) | "Drop knees gently to right, look center or left. Keep shoulders relaxed." | `/exercises/thoracic_spine_mobility.jpg` | 3-exercise poster (Panel 2: Gentle Supine Spinal Twist). | **Partial Match** | Twist is depicted in Panel 2, but cluttered with Thread the Needle and Cactus. |
| **y6**: Morning Spine Awakening | 4 | Restorative Prone Rest (225s) | "Rest face down on hands, allowing spine to settle in neutral." | `/exercises/restorative_savasana.jpg` | Supine (face-up) Savasana. | **Mismatch** | Cue directs face-down prone rest; image depicts face-up supine rest. |
| **y7**: Chair Yoga for Desk Decompression | 1 | Seated Cat-Cow (150s) | "Hands on knees, inhale arch chest forward, exhale round mid-back." | `/exercises/cervical_neck_mobility.jpg` | Cervical poster (chin tucks, ear-to-shoulder, shoulder shrugs). | **Mismatch** | Spinal flexion/extension cat-cow is not on this cervical poster. |
| **y7**: Chair Yoga for Desk Decompression | 2 | Seated Figure-4 Hip Opener (150s) | "Ankle on opposite knee, lean gently forward with straight back." | `/exercises/cervical_neck_mobility.jpg` | Cervical neck mobility poster. | **Mismatch** | Seated hip opener has no connection to cervical neck mobility graphics. |
| **y7**: Chair Yoga for Desk Decompression | 3 | Seated Upper Trapezius Drop (150s) | "Hold chair base with right hand, tilt head to left." | `/exercises/cervical_neck_mobility.jpg` | Cervical poster (Panel 2: Gentle Lateral Ear-to-Shoulder). | **Partial Match** | Lateral neck tilt is shown in Panel 2, though chair anchor cue is specific. |
| **y7**: Chair Yoga for Desk Decompression | 4 | Seated Chest Expansion (150s) | "Interlace hands behind lower back or chair frame, gently lift collarbones." | `/exercises/cervical_neck_mobility.jpg` | Cervical poster (chin tucks, ear-to-shoulder, shoulder shrugs). | **Mismatch** | Chest expansion is absent from this poster (depicted as Cactus on thoracic poster). |
| **y8**: Vagus Nerve & Restorative Breath | 1 | 4-7-8 Parasympathetic Breathing (225s) | "Inhale 4 sec through nose, hold 7 sec, exhale 8 sec through pursed lips." | `/exercises/restorative_savasana.jpg` | Restorative Savasana guide emphasizing 360 diaphragmatic breath. | **Match** | Plausible clinical match for supine breathwork downshift. |
| **y8**: Vagus Nerve & Restorative Breath | 2 | Suboccipital Massage with Towel (225s) | "Rest base of skull on rolled towel, gentle micro-turns of head." | `/exercises/cervical_neck_mobility.jpg` | Seated active chin tucks and shrugs. | **Mismatch** | Rolled-towel passive suboccipital release is not depicted; poster shows seated active retractions. |
| **y8**: Vagus Nerve & Restorative Breath | 3 | Oculomotor Vagal Reset (225s) | "Keep head straight, look fully right for 30s until swallow/sigh, then left." | `/exercises/restorative_savasana.jpg` | Savasana resting. | **Mismatch** | Specific oculomotor lateral gaze technique has zero representation on Savasana graphic. |
| **y8**: Vagus Nerve & Restorative Breath | 4 | Gentle Heart-Belly Grounding (225s) | "One hand on heart, one on belly. Feel warmth and safety." | `/exercises/restorative_savasana.jpg` | Savasana with arms resting passively at sides. | **Partial Match** | Restorative supine posture fits, but hand placement on heart/belly is missing. |
| **y9**: Hamstring & Posterior Chain Release | 1 | Supine Strap Leg Extension (225s) | "Loop strap under right foot, extend leg upward keeping pelvis flat." | `/exercises/knee_to_chest_stretch.jpg` | Knee-to-chest hold (knee bent tight to torso, no strap, no upward extension). | **Mismatch** | Direct conflict: instruction calls for extended leg with strap; image shows fully flexed knee hug. |
| **y9**: Hamstring & Posterior Chain Release | 2 | Gentle IT Band Cross-Body (225s) | "Draw straight leg slightly across midline (2-3 inches max)." | `/lumbar_core_routine.jpg` | Core stability poster (Bird-Dog, Cat-Cow, Dead Bug). | **Mismatch** | Completely unrelated core strengthening poster mapped to supine IT band stretch. |
| **y9**: Hamstring & Posterior Chain Release | 3 | Reclined Hamstring Flutter (225s) | "Gentle micro-bends and straightening of knee to desensitize nerve." | `/exercises/knee_to_chest_stretch.jpg` | Static bent knee-to-chest hold. | **Mismatch** | Nerve-flossing vertical leg flutter not represented by static knee hug. |
| **y9**: Hamstring & Posterior Chain Release | 4 | Restorative Leg Rest (225s) | "Rest legs long on mat, noticing length through lower back." | `/lumbar_core_routine.jpg` | Core stability poster (active conditioning). | **Mismatch** | Restorative rest mapped to high-effort core stability graphic. |
| **y10**: Evening Restorative Wind-Down | 1 | Wide Knee Child's Pose (300s) | "Allow belly to soften between thighs, long slow exhales." | `/exercises/supported_childs_pose.jpg` | Supported Child's Pose over bolster between wide knees. | **Match** | Perfect 1:1 match. |
| **y10**: Evening Restorative Wind-Down | 2 | Supported Bridge Pose (300s) | "Block or pillow under sacrum, arms relaxed overhead." | `/exercises/supine_pelvic_tilts.jpg` | Supine Pelvic Tilts (pelvis on floor; flattening/arching). | **Mismatch** | Supported Bridge requires elevated hips with sacral block; image shows hips flat on floor. |
| **y10**: Evening Restorative Wind-Down | 3 | Supine Spinal Twist with Pillow (300s) | "Pillow between knees, slow gentle twist to each side." | `/exercises/thoracic_spine_mobility.jpg` | 3-exercise poster (Panel 2: Gentle Supine Spinal Twist). | **Partial Match** | Depicted in Panel 2, but cluttered with Thread the Needle and Cactus. |
| **y10**: Evening Restorative Wind-Down | 4 | Corpse Pose Deep Relaxation (300s) | "Complete still surrender into mattress or mat." | `/exercises/restorative_savasana.jpg` | Restorative Savasana guide. | **Match** | Perfect 1:1 match. |

---

## 4. Routine Summary & Mismatch Breakdown

| Routine ID | Routine Name | Total Steps | Exact Match | Partial Match (Multi-Poster) | Complete Mismatch | Primary Failure Mode |
|---|---|---|---|---|---|---|
| **y1** | Gentle Lumbar Release | 4 | 4 (100%) | 0 (0%) | 0 (0%) | **Baseline benchmark**: perfect 1:1 single-topic graphic alignment. |
| **y2** | Cervical Mobility Flow | 4 | 0 (0%) | 3 (75%) | 1 (25%) | Steps 1-3 mapped to multi-panel poster; Step 4 mapped to supine Savasana while instructing upright sitting. |
| **y3** | Full Body Restorative Yin | 4 | 0 (0%) | 1 (25%) | 3 (75%) | Sphinx pose completely missing; Bound Angle & Legs-up-wall mapped to standard Savasana. |
| **y4** | Shoulder & Thoracic Opener | 4 | 0 (0%) | 2 (50%) | 2 (50%) | Thread the Needle & Cactus mapped to 3-panel poster; Puppy pose & Prone rest mismatched. |
| **y5** | Hip Flexor & Psoas Flow | 4 | 1 (25%) | 1 (25%) | 2 (50%) | 90/90 mapped to thoracic poster; Figure-4 mapped to knee-to-chest despite existing on hip poster. |
| **y6** | Morning Spine Awakening | 4 | 0 (0%) | 2 (50%) | 2 (50%) | Cat-Cow mapped to Savasana; Prone rest mapped to Supine Savasana. |
| **y7** | Chair Yoga for Desk Decompression | 4 | 0 (0%) | 1 (25%) | 3 (75%) | All chair steps mapped to floor cervical poster; zero chair yoga graphics exist. |
| **y8** | Vagus Nerve & Restorative Breath | 4 | 1 (25%) | 1 (25%) | 2 (50%) | Towel suboccipital release and oculomotor gaze mapped to generic Savasana/cervical graphics. |
| **y9** | Hamstring & Posterior Chain Release | 4 | 0 (0%) | 0 (0%) | 4 (100%) | Strap leg extensions and IT band cross mapped to knee hug or core stability poster. |
| **y10** | Evening Restorative Wind-Down | 4 | 2 (50%) | 1 (25%) | 1 (25%) | Supported Bridge mapped to flat Pelvic Tilt; Twist mapped to 3-panel poster. |
| **TOTAL** | **10 Routines** | **40** | **8 (20%)** | **10 (25%)** | **22 (55%)** | **80% of steps suffer from either complete mismatch or multi-panel clutter.** |

---

## 5. Strategic Recommendations for Ticket 07

To resolve the 32 flawed step presentations identified above without violating clinical restrictions:

1. **Leverage Pre-Existing Vector Assets in `clinical_exercise_library/images/`**:
   The repository already contains 72 clinically vetted, individual exercise SVG/PNG graphics generated specifically for the user's post-surgical constraints, including:
   - `supported-sphinx-micro-lifts.svg` (fixes `y3` Sphinx mismatch)
   - `supine-strap-hamstring-calf.svg` (fixes `y9` Hamstring strap mismatch)
   - `supported-bridge-block.svg` (fixes `y10` Supported Bridge mismatch)
   - `supine-figure-four-strap.svg` (fixes `y5` Reclined Figure-4 mismatch)
   - `open-book-thoracic.svg` (isolates thoracic mobility without multi-poster clutter)
   - `thread-the-needle-modified.svg` (isolates Thread the Needle)
   - `pelvic-tilts-transverse-holds.svg` & `glute-bridges.svg`
   - `legs-elevated-relaxation.svg` (fixes `y3` Legs-Up-the-Wall mismatch)
   - `constructive-rest.svg` & `acupressure-mat-bolster-wind-down.svg`

2. **Panel Cropping for Multi-Exercise Posters**:
   For exercises currently trapped in composite posters (`cervical_neck_mobility.jpg`, `thoracic_spine_mobility.jpg`, `hip_mobility_routine.jpg`, `lumbar_core_routine.jpg`), extract and crop individual high-resolution single-exercise panels into isolated assets (e.g. `/exercises/chin_tuck.jpg`, `/exercises/lateral_ear_shoulder.jpg`, `/exercises/shoulder_shrug.jpg`, `/exercises/seated_cactus.jpg`, `/exercises/supine_spinal_twist.jpg`, `/exercises/cat_cow_mobility.jpg`, `/exercises/kneeling_lunge.jpg`, `/exercises/ninety_ninety_hip.jpg`).

3. **Synchronize Runner Script**:
   Update `dashboard/lib/exercise-db.ts` frame pointers to reference dedicated, single-exercise graphics, and run `scripts/sync_yoga_routines_and_runner.ts` to push the aligned database directly into `dashboard/public/app.js` and `dashboard/app.js`.

---
*Report compiled autonomously for Wayfinder Ticket 06 review. Read-only audit; no file modifications applied to production exercise databases.*
