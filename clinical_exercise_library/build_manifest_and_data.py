import json
import re

source_file = "/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/agent_reports/2026-10-12_comprehensive_yoga_hydrotherapy_routine_library.md"

with open(source_file, "r", encoding="utf-8") as f:
    raw_text = f.read()

# Metadata
metadata = {
    "title": "Comprehensive Clinical Exercise Library: Yoga, Hydrotherapy & Mindful Flow Protocols",
    "subtitle": "Clinical Multi-Disciplinary Team (MDT) Synthesis & Prescription",
    "lead_author": "Physiotherapist Specialist (PHYSIO)",
    "surgical_oversight": "Surgeon Persona (SURGEON)",
    "neuro_review": "Neuro-PPS Persona (NEURO_PPS)",
    "evidence_synthesis": "Medical Researcher Persona (RESEARCHER)",
    "clinical_coordination": "Medical Overseer (MDT_LEAD)",
    "date": "2026-10-12",
    "version": "1.0.0"
}

# Section 1 Constraints
constraints = {
    "cervical_spine": "Strictly preserve neutral cervical alignment. No forced end-range extension or high-velocity rotation. Foam rolling the neck or lower back is prohibited. Traditional Pilates head/shoulder curls (e.g. classical Hundred) are contraindicated; use supported preparation with head grounded.",
    "right_shoulder": "Limit active elevation below 80°–90°. All banded rowing and aquatic presses must keep elbows tucked below shoulder height to prevent subacromial impingement and C7–T1 neuropathic burning.",
    "lower_kinetic_chain": "Braced during loaded land exercises. No deep squatting, crouching, or kneeling on hard unpadded surfaces. Aquatic immersion (chest-depth) offloads 60–75% of compressive joint loading, allowing high concentric intensity without eccentric cartilage breakdown.",
    "hydrotherapy_rationale": "Hydrotherapy combines warm-water buoyancy (30°C–34°C) with hydrostatic pressure and fluid resistance. Using heavy Therabands and pool rails allows intense muscular loading with near-zero spinal axial compression."
}

# Disclaimers
disclaimers = [
    "This is appointment preparation and second-opinion context, not a clinical recommendation to act on independently. Discuss with your physiotherapist and neurosurgeon before making changes to your treatment.",
    "Any changes to medication or pharmacological therapies must be reviewed, prescribed, and managed by your General Practitioner or managing specialist in consultation with a qualified pharmacist.",
    "If you experience sudden severe motor weakness, progressive numbness, fever with joint swelling, or acute changes in bowel or bladder control, seek immediate emergency medical evaluation."
]

# Section 5 Rules
rules = {
    "progression_criteria": "Advance band resistance only when a routine is completed with post-exercise pain delta >= 0 (no pain increase) for 3 consecutive sessions and baseline pain is < 5/10.",
    "regression_criteria": "If sharp C7–T1 burning nerve pain or acute knee/ankle instability occurs, immediately regress to passive decompression (Hydro H-MED1 or Yoga Y-BEG1) and apply cryotherapy.",
    "equipment_safety": "Always verify anchor points for Therabands in the pool. Never secure bands to loose fittings."
}

# Routines definitions with exact clinical text
routines = [
    # 02_Hydrotherapy_Protocols
    {
        "id": "H-MED1",
        "booklet": "02_Hydrotherapy_Protocols",
        "title": "30-Minute Dynamic Aqua Balance & Banded Core",
        "duration": "30 Minutes",
        "stated_minutes": 30,
        "intensity": "Medium",
        "equipment": ["Heavy/Medium Theraband", "Pool Rail", "Flotation Noodle"],
        "steps": [
            {
                "step_num": 1,
                "name": "Warm-Up",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Forward/backward water walking (heel-to-toe), side-stepping holding pool rail.",
                "cues": ["Heel-to-toe stride", "Hold pool rail for balance", "Chest-depth water support"],
                "safety": "Keep spine upright; avoid twisting at knees or ankles.",
                "slug": "aqua-warmup-gait"
            },
            {
                "step_num": 2,
                "name": "Submerged Banded Hip Abduction & Extension",
                "dosage": "8 mins (3 sets x 12 reps per leg)",
                "minutes": 8,
                "source_text": "Band looped around pool rail and ankle. 3 sets x 12 reps per leg, slow 2-second outward sweep against water drag.",
                "cues": ["Slow 2-second outward sweep", "Resist water drag", "Keep torso upright and stable"],
                "safety": "Loop band securely to solid pool rail only; do not hyperextend lumbar spine.",
                "slug": "submerged-banded-hip-abduction-extension"
            },
            {
                "step_num": 3,
                "name": "Rail-Supported Hydro Pelvic Tilts & Core Neutral Holds",
                "dosage": "7 mins (Hold 10s x 6 reps)",
                "minutes": 7,
                "source_text": "Back to pool wall, engage deep core and flatten lumbar curve into wall. Hold 10s x 6 reps.",
                "cues": ["Back flat against pool wall", "Engage deep transverse core", "Hold 10 seconds per rep"],
                "safety": "Preserve neutral cervical posture against pool wall; no straining.",
                "slug": "rail-supported-hydro-pelvic-tilts"
            },
            {
                "step_num": 4,
                "name": "Noodle Supported Knee Drives",
                "dosage": "6 mins (3 sets x 15 reps)",
                "minutes": 6,
                "source_text": "Float with noodle under axillae, drive knees toward chest against water resistance (no lumbar flexion). 3 sets x 15 reps.",
                "cues": ["Noodle under armpits", "Drive knees up smoothly", "Engage lower abdominals"],
                "safety": "Strictly no lumbar flexion during knee drive; maintain neutral spinal posture.",
                "slug": "noodle-supported-knee-drives"
            },
            {
                "step_num": 5,
                "name": "Cool-Down",
                "dosage": "4 mins",
                "minutes": 4,
                "source_text": "Water walking with deep diaphragmatic breathing.",
                "cues": ["Gentle water walking", "Deep diaphragmatic breathing", "Downregulate heart rate"],
                "safety": "Maintain calm, rhythmic breathing without breath holding.",
                "slug": "aqua-cooldown-walking"
            }
        ]
    },
    {
        "id": "H-MED2",
        "booklet": "02_Hydrotherapy_Protocols",
        "title": "45-Minute Total Body Aquatic Conditioning",
        "duration": "45 Minutes",
        "stated_minutes": 45,
        "intensity": "Medium",
        "equipment": ["Therabands", "Pool Rail", "Kickboard"],
        "steps": [
            {
                "step_num": 1,
                "name": "Aquatic Gait & Scapular Activation",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "Forward/backward gait drills, submerged water sweeps and chin retractions.",
                "cues": ["Submerged arm sweeps", "Isometric chin retractions", "Forward/backward gait"],
                "safety": "Cervical spine strictly in neutral; chin tucks in small pain-free range.",
                "slug": "aquatic-gait-scapular-activation"
            },
            {
                "step_num": 2,
                "name": "Submerged Banded Low Rows & W-Rows",
                "dosage": "10 mins (3 sets x 12 reps)",
                "minutes": 10,
                "source_text": "Band anchored to pool rail at waist level. Elbows tucked low, squeeze scapulae back into water. 3 sets x 12 reps.",
                "cues": ["Elbows tucked low", "Squeeze scapulae back into water", "Waist-height band anchor"],
                "safety": "Keep elbows below shoulder line; do not elevate shoulders or trigger C7-T1 burning.",
                "slug": "submerged-banded-low-rows"
            },
            {
                "step_num": 3,
                "name": "Rail-Supported Banded Shallow Squat Presses",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "Band around waist anchored to rail. Shallow supported mini-squats (max 45° knee flexion), driving through glutes.",
                "cues": ["Max 45° knee flexion", "Drive through glutes", "Band around waist anchored to rail"],
                "safety": "Strict limit of 45° knee bend; no deep crouching or knee shearing.",
                "slug": "rail-supported-banded-shallow-squat-presses"
            },
            {
                "step_num": 4,
                "name": "Kickboard Aquatic Press-Downs",
                "dosage": "10 mins (3 sets x 10 reps)",
                "minutes": 10,
                "source_text": "Submerge kickboard with both hands at chest level, pressing downward to engage lats and anterior core. 3 sets x 10 reps.",
                "cues": ["Submerge kickboard at chest level", "Press downward engaging lats", "Brace anterior core"],
                "safety": "Keep wrists neutral; maintain shoulder elevation strictly below 80°.",
                "slug": "kickboard-aquatic-press-downs"
            },
            {
                "step_num": 5,
                "name": "Buoyancy Decompression",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Supported supine float with neck roll and knee bolster.",
                "cues": ["Neck roll supporting cervical curve", "Bolster under knees", "Full buoyant floating"],
                "safety": "Ensure full cervical support; neck completely relaxed in neutral.",
                "slug": "buoyancy-decompression"
            }
        ]
    },
    {
        "id": "H-EXP1",
        "booklet": "02_Hydrotherapy_Protocols",
        "title": "60-Minute Heavy Hydro Resistance & Power Protocol",
        "duration": "60 Minutes",
        "stated_minutes": 60,
        "intensity": "Expert / High Resistance",
        "equipment": ["Heavy Therabands (Black/Silver)", "Pool Rail", "Hydro Dumbbells", "Flotation Belt"],
        "steps": [
            {
                "step_num": 1,
                "name": "Dynamic Thermal & Gait Warm-Up",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "High-knee water marching, multi-planar lateral walk-outs, gentle submerged arm pendulum sweeps.",
                "cues": ["High-knee water marching", "Multi-planar lateral steps", "Submerged pendulum sweeps"],
                "safety": "Arm sweeps kept below 80° shoulder elevation; controlled foot placement.",
                "slug": "dynamic-thermal-gait-warmup"
            },
            {
                "step_num": 2,
                "name": "Banded Pool-Rail Power Squat Pulses",
                "dosage": "10 mins (4 sets x 12 reps)",
                "minutes": 10,
                "source_text": "Heavy band anchored to pool rail and pelvis. Controlled shallow squat pulses against band tension and water buoyancy. 4 sets x 12 reps.",
                "cues": ["Heavy band at pelvis", "Controlled shallow pulses", "Push against band resistance"],
                "safety": "Shallow pulses only (max 45° knee flexion); protect left osteotomy site.",
                "slug": "banded-pool-rail-power-squat-pulses"
            },
            {
                "step_num": 3,
                "name": "Submerged Unilateral Band Rows & Chest Press",
                "dosage": "10 mins (3 sets x 12 reps)",
                "minutes": 10,
                "source_text": "Left arm heavy explosive rows; right arm controlled micro-range pulls to tolerance below 80°. 3 sets x 12 reps.",
                "cues": ["Left arm powerful rows", "Right arm micro-pulls below 80°", "Torso square to rail"],
                "safety": "Right shoulder limited below 80°; stop immediately if C7-T1 burning occurs.",
                "slug": "submerged-unilateral-band-rows"
            },
            {
                "step_num": 4,
                "name": "Banded Submerged Leg Extensions & Lateral Kicks",
                "dosage": "12 mins (3 sets x 12 reps per side)",
                "minutes": 12,
                "source_text": "Heavy ankle band anchored to rail. Resist water turbulence through full quad and glute contraction. 3 sets x 12 reps per side.",
                "cues": ["Heavy band on ankle", "Full quad & glute contraction", "Resist water turbulence"],
                "safety": "Anchor securely to solid pool rail; avoid knee hyperextension or twisting.",
                "slug": "banded-submerged-leg-extensions-lateral-kicks"
            },
            {
                "step_num": 5,
                "name": "Deep Water Core Suspensions",
                "dosage": "10 mins (4 rounds of 45s work / 45s rest)",
                "minutes": 10,
                "source_text": "Flotation belt on, deep-water bicycle sprints and alternating knee-to-chest tucks. 4 rounds of 45s work / 45s rest.",
                "cues": ["Flotation belt fastened", "Deep-water bicycle sprints", "Alternating knee tucks"],
                "safety": "Maintain vertical spinal alignment; no lumbar hyperextension.",
                "slug": "deep-water-core-suspensions"
            },
            {
                "step_num": 6,
                "name": "Hydro Decompression & Stretches",
                "dosage": "8 mins",
                "minutes": 8,
                "source_text": "Calf and hamstring pool-wall stretches, passive buoyant traction.",
                "cues": ["Calf stretch against pool wall", "Gentle hamstring elongation", "Passive buoyant traction"],
                "safety": "Gentle stretch only; do not bounce or force joint ranges.",
                "slug": "hydro-decompression-stretches"
            }
        ]
    },
    {
        "id": "H-EXP2",
        "booklet": "02_Hydrotherapy_Protocols",
        "title": "75-Minute Multi-Planar Hydro Endurance & Kinetic Chain Overhaul",
        "duration": "75 Minutes",
        "stated_minutes": 75,
        "intensity": "Expert / High Resistance",
        "equipment": ["Heavy Loop Bands", "Pool Rail", "Water Dumbbells", "Pool Noodle"],
        "steps": [
            {
                "step_num": 1,
                "name": "Warm-Up & Hydrodynamic Mobilization",
                "dosage": "12 mins",
                "minutes": 12,
                "source_text": "400m water stride circuit (forward, backward, carioca/side-step) holding rail for ankle stability.",
                "cues": ["Forward, backward, carioca strides", "Hold rail for ankle stability", "Chest-depth water resistance"],
                "safety": "Hold pool rail for right ankle stability; avoid sudden direction changes.",
                "slug": "hydrodynamic-mobilization-circuit"
            },
            {
                "step_num": 2,
                "name": "Banded Lateral Walk-Outs & Monster Walks",
                "dosage": "15 mins (4 sets x 15 steps per direction)",
                "minutes": 15,
                "source_text": "Loop band around ankles in chest-deep water. Step against band tension and water resistance. 4 sets x 15 steps per direction.",
                "cues": ["Loop band around ankles", "Chest-deep water", "Step against band tension"],
                "safety": "Keep feet pointing straight ahead; prevent knees caving inward.",
                "slug": "banded-lateral-monster-walks"
            },
            {
                "step_num": 3,
                "name": "Hydro Dumbbell Torso Rotations & Submerged Presses",
                "dosage": "13 mins (3 sets x 12 reps)",
                "minutes": 13,
                "source_text": "Hold hydro dumbbells at chest depth. Rotate torso within safe thoracic limits while cervical spine remains strictly locked. 3 sets x 12 reps.",
                "cues": ["Dumbbells submerged at chest depth", "Thoracic rotation only", "Cervical spine strictly locked"],
                "safety": "Strictly no cervical rotation; neck moves as one unit with sternum.",
                "slug": "hydro-dumbbell-torso-rotations"
            },
            {
                "step_num": 4,
                "name": "Rail-Supported Explosive Glute Kickbacks",
                "dosage": "12 mins (4 sets x 12 reps per leg)",
                "minutes": 12,
                "source_text": "Band anchored to pool rail. Drive hip back into terminal glute extension without lumbar hyperextension. 4 sets x 12 reps per leg.",
                "cues": ["Band anchored to rail", "Drive hip into glute extension", "Brace core wall"],
                "safety": "Zero lumbar hyperextension; movement isolated purely to hip extension.",
                "slug": "rail-supported-explosive-glute-kickbacks"
            },
            {
                "step_num": 5,
                "name": "Deep Water Interval Treading & Core Stabilization",
                "dosage": "13 mins (5 intervals: 1-min work / 1-min hold)",
                "minutes": 13,
                "source_text": "Flotation belt, 1-minute high-cadence treading, 1-minute recovery hold. 5 intervals.",
                "cues": ["Flotation belt support", "High-cadence treading 1 min", "Recovery hold 1 min"],
                "safety": "Maintain upright posture; stop if extreme fatigue compromises core stability.",
                "slug": "deep-water-interval-treading"
            },
            {
                "step_num": 6,
                "name": "Full Hydro Decompression & Active Recovery",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "Floating supine elongation, gentle ankle pumps and diaphragmatic breathing.",
                "cues": ["Supine flotation elongation", "Gentle rhythmic ankle pumps", "Diaphragmatic breathing"],
                "safety": "Complete relaxation; ensure head and neck are supported by float.",
                "slug": "full-hydro-decompression-recovery"
            }
        ]
    },
    {
        "id": "H-EXP3",
        "booklet": "02_Hydrotherapy_Protocols",
        "title": "90-Minute Master Hydro Athlete Rehabilitation Protocol",
        "duration": "90 Minutes",
        "stated_minutes": 90,
        "intensity": "Expert / Maximum Resistance",
        "equipment": ["Full Hydro Resistance Kit (Heavy bands, Hydro paddles, Flotation belt, Noodles, Rail)"],
        "steps": [
            {
                "step_num": 1,
                "name": "Phase 1: Dynamic Hydrodynamic Activation",
                "dosage": "15 mins",
                "minutes": 15,
                "source_text": "Progressive multi-speed water walking, gentle submerged scapular sweeps, active ankle dorsiflexion against water drag.",
                "cues": ["Progressive multi-speed walking", "Submerged scapular sweeps", "Active ankle dorsiflexion"],
                "safety": "Monitor right shoulder range (<80°); support right ankle stability.",
                "slug": "phase1-dynamic-hydro-activation"
            },
            {
                "step_num": 2,
                "name": "Phase 2: Heavy Band Upper-Body Kinetic Chain",
                "dosage": "20 mins (3 cycles of 10 reps each)",
                "minutes": 20,
                "source_text": "Rail-anchored banded low rows, W-rows, internal/external rotation complexes (10 reps each, 3 cycles).",
                "cues": ["Rail-anchored banded low rows", "W-rows below shoulder height", "Rotator cuff rotation complexes"],
                "safety": "Elbows strictly below shoulder line; verify heavy band anchor to pool rail.",
                "slug": "phase2-heavy-band-upper-body"
            },
            {
                "step_num": 3,
                "name": "Phase 3: Lower Kinetic Chain & Pelvic Power",
                "dosage": "20 mins",
                "minutes": 20,
                "source_text": "Banded rail squats, banded submerged knee extensions, side-stepping against heavy band tension.",
                "cues": ["Banded rail squats (max 45°)", "Submerged knee extensions", "Heavy band side-stepping"],
                "safety": "Max 45° knee flexion; do not allow left knee valgus collapse.",
                "slug": "phase3-lower-kinetic-pelvic-power"
            },
            {
                "step_num": 4,
                "name": "Phase 4: Deep-Water Aquatic Core Crucible",
                "dosage": "18 mins",
                "minutes": 18,
                "source_text": "Flotation belt suspended deep-water knee drives, scissor kicks, and isometric kickboard presses under water.",
                "cues": ["Flotation belt suspension", "Knee drives and scissor kicks", "Isometric kickboard downward press"],
                "safety": "Neutral spine locked; no cervical straining or lumbar extension.",
                "slug": "phase4-deep-water-core-crucible"
            },
            {
                "step_num": 5,
                "name": "Phase 5: Neuromuscular Gait Retraining",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "High-step walking with focused heel-to-toe push-off and contralateral arm swings.",
                "cues": ["High-step water marching", "Focused heel-to-toe push-off", "Contralateral arm swings"],
                "safety": "Arms swing naturally below shoulder level; smooth controlled cadence.",
                "slug": "phase5-neuromuscular-gait-retraining"
            },
            {
                "step_num": 6,
                "name": "Phase 6: Passive Decompression & Thermal Surrender",
                "dosage": "7 mins",
                "minutes": 7,
                "source_text": "Cervical-supported noodle float, total muscular downregulation.",
                "cues": ["Noodle supporting cervical spine", "Full buoyant floating", "Complete nervous system downregulation"],
                "safety": "Full cervical support; allow hydrostatic pressure to unload axial spine.",
                "slug": "phase6-passive-decompression-float"
            }
        ]
    },

    # 03_Floor_Yoga_Medium_and_Expert
    {
        "id": "Y-MED1",
        "booklet": "03_Floor_Yoga_Medium_and_Expert",
        "title": "20-Minute Posture, Scapula & Core Alignment",
        "duration": "20–25 Minutes",
        "stated_minutes": 20,
        "intensity": "Medium",
        "equipment": ["Mat", "Light Band"],
        "steps": [
            {
                "step_num": 1,
                "name": "Wall Angels (Partial Range)",
                "dosage": "2 mins",
                "minutes": 2,
                "source_text": "Elbows below shoulder line, chin tucked.",
                "cues": ["Elbows below shoulder line", "Chin tucked in neutral", "Back flat against wall"],
                "safety": "Do not elevate arms above 80°; keep chin tucked and cervical spine neutral.",
                "slug": "wall-angels-partial-range"
            },
            {
                "step_num": 2,
                "name": "Scapular Retractions in Prone/Supported",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Squeeze shoulder blades, keep neck neutral.",
                "cues": ["Squeeze shoulder blades together", "Neck neutral aligned with spine", "Forehead supported on pad"],
                "safety": "Forehead grounded on pad; zero cervical extension or neck craning.",
                "slug": "scapular-retractions-prone"
            },
            {
                "step_num": 3,
                "name": "Dead Bug (Arms Only or Heel Slides)",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Supine, brace abdominal wall, no lumbar arching.",
                "cues": ["Supine with spine grounded", "Brace abdominal wall", "No lumbar arching during movement"],
                "safety": "Head supported on mat; no cervical flexion or Pilates head curls.",
                "slug": "dead-bug-basic"
            },
            {
                "step_num": 4,
                "name": "Glute Bridges",
                "dosage": "3 sets of 10 reps (4 mins)",
                "minutes": 4,
                "source_text": "Squeeze glutes at top, align knees over braced ankles.",
                "cues": ["Squeeze glutes at top", "Align knees over ankles", "Drive through heels"],
                "safety": "Do not hyperextend lumbar spine; ensure right ankle and left knee alignment.",
                "slug": "glute-bridges"
            },
            {
                "step_num": 5,
                "name": "Heel Slides",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Alternating slow controlled sliding.",
                "cues": ["Slow controlled slide", "Maintain core brace", "Keep heel on floor"],
                "safety": "No knee twisting; keep toes pointing vertical to protect left osteotomy.",
                "slug": "heel-slides"
            },
            {
                "step_num": 6,
                "name": "Constructive Rest",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Bolster under knees, diaphragmatic breathing.",
                "cues": ["Bolster under knees", "Diaphragmatic breathing", "Spine unloaded on mat"],
                "safety": "Ensure cervical spine is fully supported in neutral.",
                "slug": "constructive-rest"
            }
        ]
    },
    {
        "id": "Y-MED2",
        "booklet": "03_Floor_Yoga_Medium_and_Expert",
        "title": "30-Minute Spine & Pelvic Stability Flow",
        "duration": "30 Minutes",
        "stated_minutes": 30,
        "intensity": "Medium",
        "equipment": ["Mat", "Yoga Strap", "Bolster"],
        "steps": [
            {
                "step_num": 1,
                "name": "Pelvic Tilts & Deep Transverse Holds",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Pelvic Tilts & Deep Transverse Holds: 5 mins.",
                "cues": ["Flatten lumbar curve gently into mat", "Engage transverse abdominis", "Rhythmic pelvic rocking"],
                "safety": "Pain-free arc only; keep head grounded without neck tension.",
                "slug": "pelvic-tilts-transverse-holds"
            },
            {
                "step_num": 2,
                "name": "Open Book Thoracic Mobilization",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Side-lying with bolster between knees, rotate thoracic cage without twisting cervical spine.",
                "cues": ["Bolster between knees", "Rotate thoracic cage only", "Keep cervical spine locked neutral"],
                "safety": "Cervical spine strictly locked neutral; head supported on pillow/block.",
                "slug": "open-book-thoracic"
            },
            {
                "step_num": 3,
                "name": "Thread the Needle (Modified)",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Forearm-supported, slide arm through within shoulder tolerance.",
                "cues": ["Forearm-supported on pad", "Slide arm through within tolerance", "Padded knee cushion"],
                "safety": "Never kneel on hard floor; slide arm only within right shoulder tolerance (<80°).",
                "slug": "thread-the-needle-modified"
            },
            {
                "step_num": 4,
                "name": "Supported Bridge Holds",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Yoga block under sacrum, resting lumbar spine.",
                "cues": ["Yoga block under sacrum", "Rest lumbar spine passively", "Shoulders relaxed on mat"],
                "safety": "Block positioned under sacrum, NOT lumbar vertebrae; neck neutral.",
                "slug": "supported-bridge-block"
            },
            {
                "step_num": 5,
                "name": "Supine Strap Hamstring & Calf Release",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Strap around midfoot, avoid pulling hard on right shoulder.",
                "cues": ["Strap around midfoot", "Gentle hamstring release", "Relax right shoulder"],
                "safety": "Hold strap loosely; avoid pulling hard with right shoulder.",
                "slug": "supine-strap-hamstring-calf"
            },
            {
                "step_num": 6,
                "name": "Supported Savasana",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Supported Savasana: 5 mins.",
                "cues": ["Bolster under knees", "Small head support", "Complete muscular release"],
                "safety": "Full spine support; neutral cervical alignment.",
                "slug": "supported-savasana"
            }
        ]
    },
    {
        "id": "Y-MED3",
        "booklet": "03_Floor_Yoga_Medium_and_Expert",
        "title": "40-Minute Restorative Decompression & Nerve Gliding",
        "duration": "40 Minutes",
        "stated_minutes": 40,
        "intensity": "Medium-Restorative",
        "equipment": ["Mat", "Bolster", "2 Blocks", "Strap"],
        "steps": [
            {
                "step_num": 1,
                "name": "Constructive Rest & Diaphragmatic Breathwork",
                "dosage": "8 mins",
                "minutes": 8,
                "source_text": "Constructive Rest & Diaphragmatic Breathwork: 8 mins.",
                "cues": ["Bolster under knees", "Hands on lower ribs", "Slow diaphragmatic expansion"],
                "safety": "Head supported; neutral neck without pillow hyperflexion.",
                "slug": "constructive-rest"
            },
            {
                "step_num": 2,
                "name": "Supine AROM Cervical Rotation & Deep Neck Flexor Tucks",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Micro-retractions, smooth gentle turns within pain-free arc.",
                "cues": ["Micro chin tucks", "Gentle turns within pain-free arc", "Head rested on thin pad"],
                "safety": "Small pain-free arc only; zero forced end-range rotation or extension.",
                "slug": "supine-arom-neck-rotation-chin-tuck"
            },
            {
                "step_num": 3,
                "name": "Median & Ulnar Nerve Sliders",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Gentle non-tension nerve flossing, keeping shoulder below 80°.",
                "cues": ["Gentle sliding movement", "Non-tension nerve flossing", "Shoulder below 80°"],
                "safety": "Keep shoulder strictly below 80°; stop immediately if tingling or burning develops.",
                "slug": "median-ulnar-nerve-sliders"
            },
            {
                "step_num": 4,
                "name": "Supine Figure-Four with Strap Assistance",
                "dosage": "8 mins (4 mins per side)",
                "minutes": 8,
                "source_text": "4 mins per side, offloading piriformis tension.",
                "cues": ["Strap around thigh", "Ankle resting over opposite knee", "Offload piriformis tension"],
                "safety": "Use strap to avoid arm pulling; protect braced left knee from twisting.",
                "slug": "supine-figure-four-strap"
            },
            {
                "step_num": 5,
                "name": "Supported Sphinx Micro-Lifts (Prone on Forearms)",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Only if cleared; neck strictly locked in neutral.",
                "cues": ["Forearms flat on mat", "Gentle thoracic extension", "Neck strictly locked in neutral"],
                "safety": "Perform ONLY if cleared; neck locked neutral; no cervical extension.",
                "slug": "supported-sphinx-micro-lifts"
            },
            {
                "step_num": 6,
                "name": "Acupressure Mat or Bolster Wind-Down",
                "dosage": "7 mins",
                "minutes": 7,
                "source_text": "Acupressure Mat or Bolster Wind-Down: 7 mins.",
                "cues": ["Passive back unloading", "Deep slow breaths", "Nervous system relaxation"],
                "safety": "Do not foam roll neck or lower back; passive decompression only.",
                "slug": "acupressure-mat-bolster-wind-down"
            }
        ]
    },
    {
        "id": "Y-EXP1",
        "booklet": "03_Floor_Yoga_Medium_and_Expert",
        "title": "45-Minute Total Body Isometric Yoga & Pilates Hybrid",
        "duration": "45 Minutes",
        "stated_minutes": 45,
        "intensity": "Expert Isometric",
        "equipment": ["Mat", "Heavy Resistance Band", "Pilates Bar / Yoga Blocks"],
        "steps": [
            {
                "step_num": 1,
                "name": "Supine Isometric Core Bracing & Pelvic Clocks",
                "dosage": "8 mins",
                "minutes": 8,
                "source_text": "Supine Isometric Core Bracing & Pelvic Clocks: 8 mins.",
                "cues": ["Isometric abdominal wall brace", "Micro-movements around pelvic clock", "Head flat on mat"],
                "safety": "Head grounded; no neck craning or abdominal distension.",
                "slug": "supine-isometric-core-pelvic-clocks"
            },
            {
                "step_num": 2,
                "name": "Dead Bug Complex with Resistance Band",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "Band looped on feet; alternate heel pushdowns with rigid lumbar stabilization.",
                "cues": ["Band looped on feet", "Alternate heel pushdowns", "Rigid lumbar stabilization"],
                "safety": "Keep lumbar spine flat against mat; head completely grounded.",
                "slug": "dead-bug-complex-band"
            },
            {
                "step_num": 3,
                "name": "Supine Pilates Bar Leg Press",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "Bar hooked into resistance cords, drive through heels to build quad strength without knee shearing.",
                "cues": ["Bar hooked into resistance cords", "Drive through heels", "Build quad strength safely"],
                "safety": "Knees do not bend past 45°-60°; no shearing force on left knee.",
                "slug": "supine-pilates-bar-leg-press"
            },
            {
                "step_num": 4,
                "name": "Seated Wall Rows with Band",
                "dosage": "8 mins",
                "minutes": 8,
                "source_text": "Back against wall, neck neutral, row band into lower ribs.",
                "cues": ["Back against wall", "Row band into lower ribs", "Neck neutral against wall"],
                "safety": "Elbows tucked low below shoulder line; do not flare right elbow.",
                "slug": "seated-wall-rows-band"
            },
            {
                "step_num": 5,
                "name": "Isometric Glute Bridge Holds with Adductor Block Squeeze",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Isometric Glute Bridge Holds with Adductor Block Squeeze: 5 mins.",
                "cues": ["Squeeze yoga block between knees", "Hold bridge at top", "Activate glutes and adductors"],
                "safety": "Keep knees aligned over braced ankles; no lumbar hyperextension.",
                "slug": "isometric-bridge-adductor-block"
            },
            {
                "step_num": 6,
                "name": "Final Supine Spinal Decompression",
                "dosage": "4 mins",
                "minutes": 4,
                "source_text": "Final Supine Spinal Decompression: 4 mins.",
                "cues": ["Passive spinal elongation", "Bolster under knees", "Deep diaphragmatic breathing"],
                "safety": "Full cervical and lumbar support; completely relaxed posture.",
                "slug": "final-supine-spinal-decompression"
            }
        ]
    },
    {
        "id": "Y-EXP2",
        "booklet": "03_Floor_Yoga_Medium_and_Expert",
        "title": "60-Minute Comprehensive Spinal Rehabilitation & Kinetic Strength",
        "duration": "60 Minutes",
        "stated_minutes": 60,
        "intensity": "Expert Strength & Stability",
        "equipment": ["Mat", "Resistance Bands", "Bolster", "Blocks"],
        "steps": [
            {
                "step_num": 1,
                "name": "Phase 1: Centering & Deep Neck Flexor Conditioning",
                "dosage": "10 mins",
                "minutes": 10,
                "source_text": "Supine chin tucks against light resistance, pelvic tilting, breath coordination.",
                "cues": ["Supine chin tucks against light band", "Pelvic tilting coordination", "Deep neck flexor hold"],
                "safety": "Light resistance only; head stays grounded; no neck flexion or straining.",
                "slug": "phase1-centering-deep-neck-flexor"
            },
            {
                "step_num": 2,
                "name": "Phase 2: Scapulothoracic Complex",
                "dosage": "12 mins",
                "minutes": 12,
                "source_text": "Prone W-raises, scapula protraction/retraction drills, band pull-aparts below shoulder height.",
                "cues": ["Prone W-raises", "Scapular protraction/retraction", "Band pull-aparts below shoulder height"],
                "safety": "Arms strictly below shoulder height; forehead grounded on pad.",
                "slug": "phase2-scapulothoracic-complex"
            },
            {
                "step_num": 3,
                "name": "Phase 3: Core & Lumbopelvic Crucible",
                "dosage": "15 mins",
                "minutes": 15,
                "source_text": "Banded dead bug variations, supported knee hovers (hands on elevated blocks), single-leg bridge pulses.",
                "cues": ["Banded dead bug", "Supported knee hovers on blocks", "Single-leg bridge pulses"],
                "safety": "Hands elevated on yoga blocks for wrist/shoulder relief; knee hovers 1-inch max.",
                "slug": "phase3-core-lumbopelvic-crucible"
            },
            {
                "step_num": 4,
                "name": "Phase 4: Hip & Lower Kinetic Chain Integration",
                "dosage": "12 mins",
                "minutes": 12,
                "source_text": "Side-lying banded clamshells and straight-leg abductions (braced knee/ankle).",
                "cues": ["Side-lying banded clamshells", "Straight-leg abductions", "Braced knee and ankle"],
                "safety": "Left knee and right ankle braced; do not roll pelvis backward.",
                "slug": "phase4-hip-lower-kinetic-chain"
            },
            {
                "step_num": 5,
                "name": "Phase 5: Passive Decompression & Myofascial Unloading",
                "dosage": "11 mins",
                "minutes": 11,
                "source_text": "Reclined bound angle with blocks under thighs, constructive rest with bolster.",
                "cues": ["Blocks supporting outer thighs", "Bolster under spine/knees", "Total myofascial unloading"],
                "safety": "Fully supported thighs prevents groin strain; cervical spine aligned.",
                "slug": "phase5-passive-decompression-bound-angle"
            }
        ]
    },

    # 04_Beginner_Yoga_Flows
    {
        "id": "Y-BEG1",
        "booklet": "04_Beginner_Yoga_Flows",
        "title": "10-Minute Morning Gentle Reset",
        "duration": "10 Minutes",
        "stated_minutes": 10,
        "intensity": "Beginner",
        "equipment": ["Mat", "Bolster"],
        "steps": [
            {
                "step_num": 1,
                "name": "Constructive Rest",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Bolster under knees.",
                "cues": ["Bolster under knees", "Spine neutral on floor", "Arms relaxed by sides"],
                "safety": "Head supported; neutral neck alignment.",
                "slug": "constructive-rest"
            },
            {
                "step_num": 2,
                "name": "Supine Pelvic Tilts",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Inhale gentle arch, exhale flatten.",
                "cues": ["Inhale gentle arch", "Exhale flatten lumbar curve", "Smooth rhythmic motion"],
                "safety": "Keep movements within pain-free range; no abdominal forcing.",
                "slug": "pelvic-tilts-transverse-holds"
            },
            {
                "step_num": 3,
                "name": "Alternating Heel Slides",
                "dosage": "2 mins",
                "minutes": 2,
                "source_text": "Slow sliding without knee rotation.",
                "cues": ["Slow controlled slide", "Zero knee twisting", "Toes pointed upright"],
                "safety": "Strictly no knee rotation; protects left osteotomy alignment.",
                "slug": "heel-slides"
            },
            {
                "step_num": 4,
                "name": "Diaphragmatic Breathing",
                "dosage": "2 mins",
                "minutes": 2,
                "source_text": "Diaphragmatic Breathing (2 mins).",
                "cues": ["Inhale into lower ribs and belly", "Slow passive exhalation", "Relax jaw and neck"],
                "safety": "Do not tense neck or shoulder muscles during inhalation.",
                "slug": "diaphragmatic-breathing"
            }
        ]
    },
    {
        "id": "Y-BEG2",
        "booklet": "04_Beginner_Yoga_Flows",
        "title": "20-Minute Restorative Hip & Lumbar Unwind",
        "duration": "20 Minutes",
        "stated_minutes": 20,
        "intensity": "Beginner",
        "equipment": ["Mat", "Bolster", "Strap"],
        "steps": [
            {
                "step_num": 1,
                "name": "Supported Child's Pose over Bolster",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Knees wide, chest supported, neck neutral.",
                "cues": ["Knees wide on cushioned mat", "Torso rested on lengthwise bolster", "Neck neutral"],
                "safety": "Knees cushioned on pad; chest fully supported; neck neutral without turn.",
                "slug": "supported-childs-pose-bolster"
            },
            {
                "step_num": 2,
                "name": "Supine Single Knee-to-Chest",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Gently hug one knee, opposite foot flat.",
                "cues": ["Gently hug one knee toward chest", "Opposite foot resting flat", "Relax head and neck"],
                "safety": "Hug behind thigh if knee flexion is sensitive; head grounded.",
                "slug": "supine-single-knee-to-chest"
            },
            {
                "step_num": 3,
                "name": "Supine Figure-Four with Strap",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Gentle piriformis stretch.",
                "cues": ["Ankle over opposite thigh", "Use strap to support leg", "Gentle piriformis stretch"],
                "safety": "Use strap to eliminate arm pulling; keep left knee within comfortable angle.",
                "slug": "supine-figure-four-strap"
            },
            {
                "step_num": 4,
                "name": "Supported Savasana",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Supported Savasana (5 mins).",
                "cues": ["Bolster under knees", "Small head support", "Complete muscular release"],
                "safety": "Full spinal support; completely neutral neck posture.",
                "slug": "supported-savasana"
            }
        ]
    },
    {
        "id": "Y-BEG3",
        "booklet": "04_Beginner_Yoga_Flows",
        "title": "30-Minute Full-Body Decompression & Nervous System Downregulation",
        "duration": "30 Minutes",
        "stated_minutes": 30,
        "intensity": "Beginner",
        "equipment": ["Mat", "Bolster", "Yoga Block"],
        "steps": [
            {
                "step_num": 1,
                "name": "Constructive Rest with Deep Breathing",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Constructive Rest with Deep Breathing (6 mins).",
                "cues": ["Bolster under knees", "Slow belly breathing", "Relax neck and shoulders"],
                "safety": "Ensure cervical spine is properly aligned and resting comfortably.",
                "slug": "constructive-rest"
            },
            {
                "step_num": 2,
                "name": "Supine AROM Neck Rotation & Chin Tucks",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Supine AROM Neck Rotation & Chin Tucks (5 mins).",
                "cues": ["Micro chin retractions", "Gentle rotation within pain-free arc", "Smooth slow motion"],
                "safety": "Small pain-free arc only; no forced range or rapid movement.",
                "slug": "supine-arom-neck-rotation-chin-tuck"
            },
            {
                "step_num": 3,
                "name": "Open Book Thoracic Mobilization",
                "dosage": "7 mins",
                "minutes": 7,
                "source_text": "Bolster under knees, smooth sweeping movement.",
                "cues": ["Bolster between/under knees", "Smooth sweeping arm arc", "Rotate ribcage only"],
                "safety": "Cervical spine locked neutral; arm arc below 80° for right shoulder.",
                "slug": "open-book-thoracic"
            },
            {
                "step_num": 4,
                "name": "Supported Bridge with Yoga Block",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Supported Bridge with Yoga Block (6 mins).",
                "cues": ["Yoga block under sacrum", "Arms resting by sides", "Passive lumbar decompression"],
                "safety": "Block sits strictly under sacrum; no pinching in lumbar spine.",
                "slug": "supported-bridge-block"
            },
            {
                "step_num": 5,
                "name": "Legs-Elevated Relaxation",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Legs-Elevated Relaxation (6 mins).",
                "cues": ["Calves resting on chair or bolster", "Knees bent at 90°", "Full venous drainage and rest"],
                "safety": "Head supported; neutral neck; lower back completely rested.",
                "slug": "legs-elevated-relaxation"
            }
        ]
    },

    # 05_Tai_Chi_Beginner
    {
        "id": "TC-BEG1",
        "booklet": "05_Tai_Chi_Beginner",
        "title": "10-Minute Seated Mindful Energy & Breath Flow",
        "duration": "10 Minutes",
        "stated_minutes": 10,
        "intensity": "Beginner",
        "equipment": ["Sturdy Chair"],
        "steps": [
            {
                "step_num": 1,
                "name": "Commencing Form (Opening the Chest)",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Seated upright, inhale float hands to chest height, exhale press down.",
                "cues": ["Seated tall in chair", "Inhale float hands to chest height", "Exhale press palms gently down"],
                "safety": "Hands stay below chest level; keep elbows soft and below shoulder height.",
                "slug": "taichi-commencing-form-seated"
            },
            {
                "step_num": 2,
                "name": "Wave Hands Like Clouds (Seated)",
                "dosage": "4 mins",
                "minutes": 4,
                "source_text": "Gentle rotational sweep across midline using thoracic spine; head stays aligned with breastbone.",
                "cues": ["Rotational sweep across midline", "Rotate thoracic spine only", "Head stays aligned with breastbone"],
                "safety": "Strictly no cervical rotation independently; head moves locked with sternum.",
                "slug": "taichi-cloud-hands-seated"
            },
            {
                "step_num": 3,
                "name": "Closing the Circle (Harmonizing Qi)",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Inhale gather energy overhead (within shoulder comfort), exhale settle hands onto lap.",
                "cues": ["Gather arms within shoulder comfort", "Exhale settle hands onto lap", "Calm even breaths"],
                "safety": "Keep arm sweep strictly within comfortable shoulder height (<80° for right arm).",
                "slug": "taichi-closing-circle-seated"
            }
        ]
    },
    {
        "id": "TC-BEG2",
        "booklet": "05_Tai_Chi_Beginner",
        "title": "20-Minute Supported Standing Balance & Kinetic Grounding",
        "duration": "20 Minutes",
        "stated_minutes": 20,
        "intensity": "Beginner",
        "equipment": ["Chair or Support Rail"],
        "steps": [
            {
                "step_num": 1,
                "name": "Stance Alignment & Weight Shifting (Holding Chair/Rail)",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Gentle weight shift from left to right foot without twisting knees or ankles.",
                "cues": ["Hold chair or rail for stability", "Shift weight smoothly foot to foot", "Maintain tall posture"],
                "safety": "Zero twisting at left knee or right ankle; keep joints tracking forward.",
                "slug": "taichi-weight-shifting-rail"
            },
            {
                "step_num": 2,
                "name": "Repulse the Monkey (Modified Minimal Arm Reach)",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Slow arm sweeps below shoulder height coordinated with weight shifts.",
                "cues": ["Slow arm sweeps below shoulder height", "Coordinate with weight shift", "Keep knees unlocked"],
                "safety": "Arm reaches kept strictly below shoulder level; right shoulder protected.",
                "slug": "taichi-repulse-monkey-supported"
            },
            {
                "step_num": 3,
                "name": "Brush Knee & Push (Supported Stance)",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Shallow step forward, gentle push with left arm, smooth breath.",
                "cues": ["Shallow step forward", "Gentle push with left arm", "Smooth rhythmic breathing"],
                "safety": "Shallow stance only (no deep lunging); maintain firm support with rail/chair.",
                "slug": "taichi-brush-knee-push-supported"
            },
            {
                "step_num": 4,
                "name": "Standing Meditation (Zhan Zhuang) Supported",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Spine long, knees slightly unlocked, calm breath.",
                "cues": ["Spine elongated", "Knees slightly soft and unlocked", "Calm diaphragmatic breath"],
                "safety": "Hold rail/chair lightly for balance; do not lock knees into hyperextension.",
                "slug": "taichi-standing-meditation-supported"
            }
        ]
    },
    {
        "id": "TC-BEG3",
        "booklet": "05_Tai_Chi_Beginner",
        "title": "30-Minute Restorative Flow for Chronic Pain & Vitality",
        "duration": "30 Minutes",
        "stated_minutes": 30,
        "intensity": "Beginner",
        "equipment": ["Support Rail", "Sturdy Chair"],
        "steps": [
            {
                "step_num": 1,
                "name": "Gentle Joint Loosening (Neck Neutral, Wrist/Ankle Circles)",
                "dosage": "6 mins",
                "minutes": 6,
                "source_text": "Gentle Joint Loosening (Neck Neutral, Wrist/Ankle Circles) (6 mins).",
                "cues": ["Neck strictly neutral", "Smooth wrist circles", "Gentle non-weightbearing ankle circles"],
                "safety": "Zero neck rolling; cervical spine stays neutral while extremities move.",
                "slug": "taichi-joint-loosening"
            },
            {
                "step_num": 2,
                "name": "Six Harmonies Upper Body Flow",
                "dosage": "8 mins",
                "minutes": 8,
                "source_text": "Controlled arm arcs below shoulder height focusing on diaphragmatic inhalation and abdominal exhalation.",
                "cues": ["Controlled arm arcs below shoulder height", "Diaphragmatic inhale", "Abdominal exhale"],
                "safety": "Arm movement strictly below shoulder height; no strain on right shoulder.",
                "slug": "taichi-six-harmonies-flow"
            },
            {
                "step_num": 3,
                "name": "Tai Chi Walking with Rail Support",
                "dosage": "8 mins",
                "minutes": 8,
                "source_text": "Slow, deliberate heel-to-toe rolling steps, maintaining center of gravity.",
                "cues": ["Slow deliberate heel-to-toe rolling", "Maintain center of gravity", "Light grip on support rail"],
                "safety": "Use rail support; deliberate foot placement to protect right ankle stability.",
                "slug": "taichi-walking-rail-support"
            },
            {
                "step_num": 4,
                "name": "Parting the Wild Horse’s Mane (Modified Seated/Supported)",
                "dosage": "5 mins",
                "minutes": 5,
                "source_text": "Smooth diagonal expansion.",
                "cues": ["Smooth diagonal arm expansion", "Seated or rail-supported", "Keep chest relaxed"],
                "safety": "Diagonal reach kept low and comfortable; no torso twisting past neutral.",
                "slug": "taichi-parting-wild-horse-supported"
            },
            {
                "step_num": 5,
                "name": "Calming the Waters (Closing Meditation)",
                "dosage": "3 mins",
                "minutes": 3,
                "source_text": "Seated mindful still breathing.",
                "cues": ["Seated upright comfortably", "Hands resting softly on lap", "Mindful still breathing"],
                "safety": "Spine balanced against chair back; complete mental and physical calm.",
                "slug": "taichi-calming-waters-closing"
            }
        ]
    }
]

# Write exercise_library_data.json
library_data = {
    "metadata": metadata,
    "constraints": constraints,
    "disclaimers": disclaimers,
    "rules": rules,
    "routines": routines
}

with open("/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/clinical_exercise_library/exercise_library_data.json", "w", encoding="utf-8") as f:
    json.dump(library_data, f, indent=2)

print("Saved exercise_library_data.json successfully.")

# Build Manifest of Unique Exercises
unique_exercises = {}
for r in routines:
    for s in r["steps"]:
        slug = s["slug"]
        if slug not in unique_exercises:
            unique_exercises[slug] = {
                "slug": slug,
                "name": s["name"],
                "source_routine_ids": [r["id"]],
                "source_descriptions": [s["source_text"]],
                "dosages": [f"{r['id']}: {s['dosage']}"],
                "cues": s["cues"],
                "safety": s["safety"],
                "category": r["booklet"]
            }
        else:
            if r["id"] not in unique_exercises[slug]["source_routine_ids"]:
                unique_exercises[slug]["source_routine_ids"].append(r["id"])
            if s["source_text"] not in unique_exercises[slug]["source_descriptions"]:
                unique_exercises[slug]["source_descriptions"].append(s["source_text"])
            unique_exercises[slug]["dosages"].append(f"{r['id']}: {s['dosage']}")

# Add clinical image briefs with strict safety rules
for slug, item in unique_exercises.items():
    cat = item["category"]
    name = item["name"]
    is_aqua = "Hydro" in cat or "aqua" in slug or "submerged" in slug or "noodle" in slug or "kickboard" in slug or "hydro" in slug
    is_shoulder = "row" in slug or "angel" in slug or "scapul" in slug or "press" in slug or "slider" in slug or "reach" in slug or "monkey" in slug or "cloud" in slug or "harmonies" in slug or "parting" in slug
    is_neck = "neck" in slug or "cervical" in slug or "chin" in slug
    is_knee_ankle = "squat" in slug or "knee" in slug or "ankle" in slug or "gait" in slug or "stride" in slug or "walking" in slug or "slide" in slug or "bridge" in slug or "kick" in slug

    brief = f"Side-by-side start and end position panels showing {name}. "
    if is_aqua:
        brief += "Chest-depth water line shown in blue, pool rail anchor point in teal. "
    if is_shoulder:
        brief += "Dashed 80-degree limit line on shoulder; elbows tucked below shoulder line. "
    if is_neck:
        brief += "Cervical spine strictly in neutral; chin tuck in small pain-free range with head grounded/supported. "
    else:
        brief += "Spine and neck locked in neutral alignment. "
    if "squat" in slug:
        brief += "Shallow knee bend limited to max 45 degrees; zero deep crouching. "
    if "prone" in slug:
        brief += "Forehead rested on thin cushion; no neck craning. "
    if "child" in slug:
        brief += "Torso supported over lengthwise bolster; knees wide on padded mat. "
    if "rail" in slug or "chair" in slug or "supported" in slug:
        brief += "Support apparatus (chair or pool rail) clearly depicted with firm hand placement. "

    item["image_brief"] = brief

manifest = list(unique_exercises.values())
with open("/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/clinical_exercise_library/exercise_manifest.json", "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)

print(f"Saved exercise_manifest.json with {len(manifest)} unique exercise illustrations.")
