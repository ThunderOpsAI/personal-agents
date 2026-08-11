# Adaptive Rehabilitation & Pain Management Rules

## 1. Core Principles & Medical Safety
- Guidance is strictly decision support for physical recovery, not clinical diagnosis.
- Preserve clinician restrictions, post-op precautions, and weight-bearing limitations at all times.
- Never suggest exercising through sharp, severe, or worsening pain.
- If pre-exercise pain score is >= 7/10, recommend low-intensity mobility, hydrotherapy, or rest over active loading routines.

## 2. Pain Logging Invariants
- **Pain Score**: Integer or float on a 1–10 scale.
- **Anatomical Locations**: Multi-location mapping (e.g., Lower Back, Left Hip, Right Knee).
- **Percentage Weights**: Relative percentage weights across selected anatomical locations MUST sum to exactly 100%.
- **Contextual Data**: Capture mood selector and optional qualitative user notes.

## 3. Hydrotherapy Protocol
- **Target**: 3 hydrotherapy sessions per week.
- **Dynamic Selection**: Calculate completed hydrotherapy sessions for the current calendar week.
  - If 0 completed: Select 3 optimal days.
  - If 1 completed: Select 2 remaining days.
  - If 2 completed: Select 1 remaining day.
  - If 3+ completed: Goal satisfied for current week.
- User retains explicit authorization to adjust Rumble-selected hydrotherapy days before creating calendar events.

## 4. Daily Yoga Subagent Protocol (09:00 AM Australia/Melbourne)
- Triggered daily at 09:00 AM `Australia/Melbourne`.
- Evaluates recent pain logs, location weighting, and stored exercise feedback in ChromaDB.
- Generates 3 adaptive routine options (e.g. Gentle Spinal Decompression, Hip Mobility & Core Stability, Seated Restorative Mobility).
- Each routine option includes: title, duration, targeted areas, pain suitability index, and explicit movement instructions.

## 5. Learning Loop & ChromaDB Store
- Pre-exercise and post-exercise pain scores are logged to track pain relief delta (`delta = prePainScore - postPainScore`).
- User feedback (e.g. "relieved lumbar stiffness", "too intense for hip") is indexed in ChromaDB (`RUMBLE_CHROMA_PATH`).
- Future exercise recommendations prioritize routines with historically positive pain relief deltas for matching anatomical generator locations.
- Rejection reasons (e.g. "Too tired", "Hurts") are stored to refine daily option ranking.
