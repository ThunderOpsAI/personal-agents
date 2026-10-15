---
title: Mood and soreness scoring model
label: wayfinder:grilling
status: closed
assignee: agent
blocked_by: []
---

## Question

How should pain-log mood be computed? Known constraints: mood starts at 5; the four Standard/Hydro/Thoracic/Sciatica chips under mood are removed; replaced by multi-select mood tags; user can always set mood manually; soreness needs levels. Decide the tag list, weights, whether soreness is a separate graded control, clamping 0-10, and manual override precedence.

## Resolution

1. **Base Value & Manual Override:**
   - Mood starts at base `5.0`.
   - Modifiers apply additively and clamp strictly to `[0, 10]`.
   - User can manually tap any number `0..10` on the mood scale at any time to explicitly override the calculated score.

2. **Core Emotional Mood Tags:**
   - Happy `+2`, OK `+1`, Calm `+1`
   - Frustrated `-1`, Sad `-2`, Anxious `-2`

3. **Soreness Severity Levels:**
   - Instead of a single flat tag, soreness has 5 clear severity levels that deduct from mood:
     - None: `0`
     - Mild: `-1`
     - Moderate: `-2`
     - Severe: `-3`
     - Extreme: `-4`

4. **Activities, Therapies & Aggravators (Modifiers):**
   - *Positive Therapies/Relief:*
     - Hydrotherapy: `+2`
     - TENS Machine: `+2`
     - Meditate: `+1`
     - Yoga: `+1`
     - Heat Pack: `+1`
     - Cupping: `+1`
     - Massage Gun: `+1`
     - Chiro: `+1`
   - *Aggravators / Exertion Strain:*
     - Walking: `-2`
     - Chores: `-2`
     - Big Day: `-3`

5. **UI Structure:**
   - Remove the 4 duplicate preset chips under the mood score.
   - Present mood tags, soreness severity, and therapy/activity modifiers as clean clickable toggle chips that update the running mood calculation live and automatically populate corresponding entries into Clinical Notes.

