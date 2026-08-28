export interface ExerciseStep {
  title: string;
  duration: number; // in seconds
  cue?: string;
  frames?: string[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  title: string; // alias for compatibility
  category: "yoga" | "pilates" | "stretches" | "rehab" | "hydrotherapy";
  focus_areas: string[];
  duration_minutes: number;
  intensity: string;
  instruction: string;
  description: string; // alias for compatibility
  precautions: string[];
  contraindications: string[]; // alias for compatibility
  steps: ExerciseStep[];
}

export const EXERCISE_DATABASE: ExerciseItem[] = [
  // ==========================================
  // YOGA ROUTINES (y1 - y10)
  // ==========================================
  {
    id: "y1",
    name: "Gentle Lumbar Release",
    title: "Gentle Lumbar Release",
    category: "yoga",
    focus_areas: ["lumbar", "lower back", "pelvis"],
    duration_minutes: 15,
    intensity: "Gentle Restorative",
    instruction: "Slow pelvic tilts, supported child's pose, and gentle supine knee-to-chest holds to safely decompress the lumbar spine.",
    description: "Slow pelvic tilts, supported child's pose, and gentle supine knee-to-chest holds to safely decompress the lumbar spine.",
    precautions: ["Avoid aggressive lumbar flexion during acute disc flare-ups."],
    contraindications: ["acute disc herniation"],
    steps: [
      { title: "Supine Pelvic Tilts", duration: 45, cue: "Flatten lower back against the mat on exhale, gentle arch on inhale.", frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Supported Child's Pose", duration: 60, cue: "Widen knees, rest torso forward on bolster, lengthen spine.", frames: ["/exercises/childs_pose_1.jpg", "/exercises/childs_pose_2.jpg"] },
      { title: "Supine Single Knee-to-Chest", duration: 45, cue: "Gently hug right knee, then left knee. Keep sacrum grounded.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Restorative Savasana with Bolster", duration: 60, cue: "Place bolster under knees to release psoas and lumbar pressure.", frames: ["/exercises/childs_pose_2.jpg", "/exercises/cat_cow_1.jpg"] }
    ]
  },
  {
    id: "y2",
    name: "Cervical Mobility Flow",
    title: "Cervical Mobility Flow",
    category: "yoga",
    focus_areas: ["cervical", "neck", "upper trapezius"],
    duration_minutes: 10,
    intensity: "Gentle Restorative",
    instruction: "Gentle seated neck retractions, slow lateral tilts, and upper trapezius relaxation for post-surgical cervical safety.",
    description: "Gentle seated neck retractions, slow lateral tilts, and upper trapezius relaxation for post-surgical cervical safety.",
    precautions: ["No rapid cervical rotations or forced extension post-cervical surgery."],
    contraindications: ["acute whiplash", "unfused cervical instability"],
    steps: [
      { title: "Seated Axial Retraction", duration: 45, cue: "Gently draw chin backwards creating a double chin, lengthening back of neck.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/childs_pose_1.jpg"] },
      { title: "Gentle Lateral Ear-to-Shoulder", duration: 45, cue: "Drop right ear to right shoulder without lifting left shoulder. Repeat left.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Shoulder Shrug & Release", duration: 45, cue: "Inhale lift shoulders to ears, exhale drop down with sigh.", frames: ["/exercises/childs_pose_2.jpg"] },
      { title: "Restorative Alignment Breathing", duration: 60, cue: "Sit upright, focus on diaphragmatic 360 breathing relaxing neck muscles.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "y3",
    name: "Full Body Restorative Yin",
    title: "Full Body Restorative Yin",
    category: "yoga",
    focus_areas: ["full body", "nervous system", "spine"],
    duration_minutes: 25,
    intensity: "Gentle Restorative",
    instruction: "Passive supported poses using bolsters and blocks to downregulate sympathetic tone and relieve chronic muscular tension.",
    description: "Passive supported poses using bolsters and blocks to downregulate sympathetic tone and relieve chronic muscular tension.",
    precautions: ["Maintain comfortable support under all joints."],
    contraindications: [],
    steps: [
      { title: "Supported Reclined Bound Angle", duration: 90, cue: "Feet together, knees open supported by pillows, hands on lower abdomen.", frames: ["/exercises/childs_pose_1.jpg"] },
      { title: "Gentle Cat-Cow Spine Wave", duration: 60, cue: "Flow gently with breath, avoiding end-range extremes.", frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Supported Gentle Sphinx", duration: 60, cue: "Rest elbows on mat, gentle passive thoracic extension.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Legs Up the Wall Relaxation", duration: 120, cue: "Elevate legs against wall to facilitate venous return and spinal decompression.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "y4",
    name: "Shoulder & Thoracic Opener",
    title: "Shoulder & Thoracic Opener",
    category: "yoga",
    focus_areas: ["shoulder", "thoracic", "scapula", "chest"],
    duration_minutes: 20,
    intensity: "Adaptive Mobility",
    instruction: "Targeted mobility for the mid-back and pectoral girdle to counter rounded desk posture and relieve neck strain.",
    description: "Targeted mobility for the mid-back and pectoral girdle to counter rounded desk posture and relieve neck strain.",
    precautions: ["Avoid overhead impingement angles if shoulder pain is sharp."],
    contraindications: ["acute rotator cuff tear"],
    steps: [
      { title: "Thread the Needle", duration: 60, cue: "Slide right arm under torso, rest right shoulder and temple on mat.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Puppy Pose Thoracic Stretch", duration: 60, cue: "Hips stay over knees, walk hands forward melting chest towards floor.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Seated Cactus Arm Openers", duration: 45, cue: "Draw elbows back and down, opening anterior chest wall.", frames: ["/exercises/childs_pose_2.jpg", "/exercises/cat_cow_1.jpg"] },
      { title: "Scapular Retraction & Rest", duration: 60, cue: "Rest in prone or seated, focusing on mid-back breathing.", frames: ["/shoulder_rehab_routine.jpg"] }
    ]
  },
  {
    id: "y5",
    name: "Hip Flexor & Psoas Flow",
    title: "Hip Flexor & Psoas Flow",
    category: "yoga",
    focus_areas: ["hip", "psoas", "pelvis", "lumbar"],
    duration_minutes: 15,
    intensity: "Adaptive Mobility",
    instruction: "Gentle low lunges and 90/90 pelvic alignments to release anterior hip tightness that pulls on the lumbar spine.",
    description: "Gentle low lunges and 90/90 pelvic alignments to release anterior hip tightness that pulls on the lumbar spine.",
    precautions: ["Tuck pelvis under (posterior pelvic tilt) to avoid hyperextending lower back."],
    contraindications: ["recent hip arthroplasty"],
    steps: [
      { title: "Low Kneeling Lunge", duration: 60, cue: "Step right foot forward, tuck tailbone, feel stretch in left front hip.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "90/90 Seated Hip Flow", duration: 60, cue: "Rotate knees side to side gently to mobilize internal and external rotation.", frames: ["/hip_mobility_routine.jpg", "/exercises/childs_pose_2.jpg"] },
      { title: "Gentle Reclined Figure-4", duration: 60, cue: "Cross right ankle over left thigh, hold left hamstring gently.", frames: ["/exercises/childs_pose_2.jpg"] },
      { title: "Savasana Psoas Rest", duration: 60, cue: "Lie flat with gentle diaphragmatic expansion.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "y6",
    name: "Morning Spine Awakening",
    title: "Morning Spine Awakening",
    category: "yoga",
    focus_areas: ["spine", "core", "full body"],
    duration_minutes: 15,
    intensity: "Adaptive Mobility",
    instruction: "Gentle multi-directional spinal mobilization to lubricate facet joints and stimulate spinal cord circulation upon waking.",
    description: "Gentle multi-directional spinal mobilization to lubricate facet joints and stimulate spinal cord circulation upon waking.",
    precautions: ["Start slowly without forcing range of motion in early morning."],
    contraindications: ["acute back spasm"],
    steps: [
      { title: "Cat-Cow Spine Awakening", duration: 45, cue: "Coordinate slow spinal flexion and extension with deep breathing.", frames: ["/exercises/cat_cow_1.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Gentle Side Body Lateral Stretch", duration: 45, cue: "Walk hands to the right in child's pose, then left.", frames: ["/exercises/childs_pose_1.jpg"] },
      { title: "Gentle Supine Torso Twist", duration: 45, cue: "Drop knees gently to right, look center or left. Keep shoulders relaxed.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Restorative Prone Rest", duration: 45, cue: "Rest face down on hands, allowing spine to settle in neutral.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "y7",
    name: "Chair Yoga for Desk Decompression",
    title: "Chair Yoga for Desk Decompression",
    category: "yoga",
    focus_areas: ["spine", "neck", "hips", "chest"],
    duration_minutes: 10,
    intensity: "Gentle Restorative",
    instruction: "Zero-floor routine performed entirely in an ergonomic chair to break up prolonged sitting intervals.",
    description: "Zero-floor routine performed entirely in an ergonomic chair to break up prolonged sitting intervals.",
    precautions: ["Keep chair stable on firm ground."],
    contraindications: [],
    steps: [
      { title: "Seated Cat-Cow", duration: 45, cue: "Hands on knees, inhale arch chest forward, exhale round mid-back.", frames: ["/exercises/cat_cow_1.jpg"] },
      { title: "Seated Figure-4 Hip Opener", duration: 60, cue: "Ankle on opposite knee, lean gently forward with straight back.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Seated Upper Trapezius Drop", duration: 45, cue: "Hold chair base with right hand, tilt head to left.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Seated Chest Expansion", duration: 45, cue: "Interlace hands behind lower back or chair frame, gently lift collarbones.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "y8",
    name: "Vagus Nerve & Restorative Breath",
    title: "Vagus Nerve & Restorative Breath",
    category: "yoga",
    focus_areas: ["nervous system", "diaphragm", "cervical"],
    duration_minutes: 15,
    intensity: "Gentle Restorative",
    instruction: "Pranayama, suboccipital release, and gentle eye movements designed to activate the parasympathetic vagal brake.",
    description: "Pranayama, suboccipital release, and gentle eye movements designed to activate the parasympathetic vagal brake.",
    precautions: ["Breathe at a comfortable rhythm without breath-holding dizziness."],
    contraindications: [],
    steps: [
      { title: "4-7-8 Parasympathetic Breathing", duration: 90, cue: "Inhale 4 sec through nose, hold 7 sec, exhale 8 sec through pursed lips.", frames: ["/exercises/childs_pose_1.jpg"] },
      { title: "Suboccipital Massage with Towel", duration: 60, cue: "Rest base of skull on rolled towel, gentle micro-turns of head.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Oculomotor Vagal Reset", duration: 60, cue: "Keep head straight, look fully right for 30s until swallow/sigh, then left.", frames: ["/exercises/cat_cow_2.jpg"] },
      { title: "Gentle Heart-Belly Grounding", duration: 60, cue: "One hand on heart, one on belly. Feel warmth and safety.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "y9",
    name: "Hamstring & Posterior Chain Release",
    title: "Hamstring & Posterior Chain Release",
    category: "yoga",
    focus_areas: ["hamstrings", "calves", "sciatic nerve", "pelvis"],
    duration_minutes: 15,
    intensity: "Adaptive Mobility",
    instruction: "Supine strap stretches to lengthen posterior fascia without placing flexion load on the lumbar discs.",
    description: "Supine strap stretches to lengthen posterior fascia without placing flexion load on the lumbar discs.",
    precautions: ["Keep slight bend in knee; do not pull into sharp nerve pain."],
    contraindications: ["acute sciatica flare-up"],
    steps: [
      { title: "Supine Strap Leg Extension", duration: 60, cue: "Loop strap under right foot, extend leg upward keeping pelvis flat.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Gentle IT Band Cross-Body", duration: 45, cue: "Draw straight leg slightly across midline (2-3 inches max).", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Reclined Hamstring Flutter", duration: 45, cue: "Gentle micro-bends and straightening of knee to desensitize nerve.", frames: ["/exercises/cat_cow_2.jpg"] },
      { title: "Restorative Leg Rest", duration: 60, cue: "Rest legs long on mat, noticing length through lower back.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "y10",
    name: "Evening Restorative Wind-Down",
    title: "Evening Restorative Wind-Down",
    category: "yoga",
    focus_areas: ["full body", "nervous system", "sleep"],
    duration_minutes: 20,
    intensity: "Gentle Restorative",
    instruction: "Pre-bed restorative yoga protocol designed to drop core body temperature and release nighttime muscle guarding.",
    description: "Pre-bed restorative yoga protocol designed to drop core body temperature and release nighttime muscle guarding.",
    precautions: ["Keep lighting low and room comfortable."],
    contraindications: [],
    steps: [
      { title: "Wide Knee Child's Pose", duration: 90, cue: "Allow belly to soften between thighs, long slow exhales.", frames: ["/exercises/childs_pose_1.jpg", "/exercises/childs_pose_2.jpg"] },
      { title: "Supported Bridge Pose", duration: 60, cue: "Block or pillow under sacrum, arms relaxed overhead.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Supine Spinal Twist with Pillow", duration: 60, cue: "Pillow between knees, slow gentle twist to each side.", frames: ["/exercises/cat_cow_1.jpg"] },
      { title: "Corpse Pose Deep Relaxation", duration: 120, cue: "Complete still surrender into mattress or mat.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },

  // ==========================================
  // PILATES ROUTINES (p1 - p10)
  // ==========================================
  {
    id: "p1",
    name: "Neutral Pelvis & Transverse Abdominis Activation",
    title: "Neutral Pelvis & Transverse Abdominis Activation",
    category: "pilates",
    focus_areas: ["core", "pelvic floor", "lumbar", "transverse abdominis"],
    duration_minutes: 15,
    intensity: "Core Stabilization",
    instruction: "Foundational clinical Pilates finding neutral spine, gentle pelvic floor cues, and deep abdominal bracing.",
    description: "Foundational clinical Pilates finding neutral spine, gentle pelvic floor cues, and deep abdominal bracing.",
    precautions: ["Do not tilt pelvis into excessive posterior or anterior tuck."],
    contraindications: [],
    steps: [
      { title: "Finding Neutral Spine", duration: 45, cue: "ASIS hips and pubic bone in a level flat plane.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Transverse Abdominis Draw-In", duration: 60, cue: "Exhale gently drawing navel toward spine without flattening lower back.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Supine Heel Slides", duration: 60, cue: "Slide right heel forward along mat and return while keeping pelvis totally still.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Restorative Pelvic Rest", duration: 45, cue: "Soft belly breathing, releasing tension.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "p2",
    name: "Deadbug & Lumbar Control",
    title: "Deadbug & Lumbar Control",
    category: "pilates",
    focus_areas: ["core", "lumbar stability", "hip flexors"],
    duration_minutes: 15,
    intensity: "Core Stabilization",
    instruction: "Antagonistic limb reach while maintaining rigid neutral spine, eliminating lumbar hyperextension shear forces.",
    description: "Antagonistic limb reach while maintaining rigid neutral spine, eliminating lumbar hyperextension shear forces.",
    precautions: ["Lower limb only as far as you can maintain neutral lower back."],
    contraindications: ["acute abdominal tear"],
    steps: [
      { title: "Deadbug Level 1 (Arm Reach Only)", duration: 45, cue: "Knees at tabletop (90 deg), reach right arm overhead and return.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Deadbug Level 2 (Heel Tap Only)", duration: 60, cue: "Keep arms still, lower right heel to tap floor, return.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_1.jpg"] },
      { title: "Deadbug Level 3 (Opposite Arm & Leg)", duration: 60, cue: "Extend opposite arm and leg simultaneously while maintaining rock-solid core.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Knees to Chest Neutral Reset", duration: 45, cue: "Soft hold, resting hip flexors.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "p3",
    name: "Quadruped Bird-Dog Stabilization",
    title: "Quadruped Bird-Dog Stabilization",
    category: "pilates",
    focus_areas: ["multifidus", "glutes", "thoracic", "core"],
    duration_minutes: 15,
    intensity: "Core Stabilization",
    instruction: "McGill-validated quadruped stabilization building cross-body posterior chain endurance with zero spinal flexion.",
    description: "McGill-validated quadruped stabilization building cross-body posterior chain endurance with zero spinal flexion.",
    precautions: ["Do not lift leg above hip level to avoid lumbar extension arching."],
    contraindications: ["severe wrist arthritis (use fists or forearms)"],
    steps: [
      { title: "Quadruped Neutral Alignment", duration: 45, cue: "Hands under shoulders, knees under hips, neck in neutral line.", frames: ["/exercises/cat_cow_1.jpg"] },
      { title: "Bird-Dog Reach (Right Arm, Left Leg)", duration: 60, cue: "Reach straight out, thumb up, heel pushed back. Hold 6 seconds.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Bird-Dog Reach (Left Arm, Right Leg)", duration: 60, cue: "Keep pelvis level like balancing a cup of water on lower back.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Child's Pose Decompression", duration: 45, cue: "Sink hips back, lengthening spinal erectors.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "p4",
    name: "Side-Lying Clamshell & Glute Medius",
    title: "Side-Lying Clamshell & Glute Medius",
    category: "pilates",
    focus_areas: ["glute medius", "hip abductors", "pelvis stability"],
    duration_minutes: 15,
    intensity: "Targeted Strengthening",
    instruction: "Isolates the gluteus medius to stabilize the Trendelenburg sign, reducing lateral spinal sway and lumbar fatigue.",
    description: "Isolates the gluteus medius to stabilize the Trendelenburg sign, reducing lateral spinal sway and lumbar fatigue.",
    precautions: ["Do not roll top hip backwards; keep hips stacked perpendicularly."],
    contraindications: ["acute trochanteric bursitis"],
    steps: [
      { title: "Clamshell Level 1 (Right Side)", duration: 60, cue: "Heels together, open top knee like a clamshell, squeeze outer glute.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Side-Lying Leg Lift (Right Side)", duration: 45, cue: "Straighten top leg, lift 6 inches with slight internal rotation.", frames: ["/hip_mobility_routine.jpg", "/exercises/childs_pose_2.jpg"] },
      { title: "Clamshell Level 1 (Left Side)", duration: 60, cue: "Switch sides. Keep core engaged and hips stacked.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Side-Lying Leg Lift (Left Side)", duration: 45, cue: "Lift top leg with control, avoiding hip rotation.", frames: ["/hip_mobility_routine.jpg"] }
    ]
  },
  {
    id: "p5",
    name: "Glute Bridge & Hip Extension Articulation",
    title: "Glute Bridge & Hip Extension Articulation",
    category: "pilates",
    focus_areas: ["glutes", "hamstrings", "lumbar stability"],
    duration_minutes: 15,
    intensity: "Targeted Strengthening",
    instruction: "Builds posterior chain strength to support standing posture and relieve anterior pelvic tilt shear on L4-S1.",
    description: "Builds posterior chain strength to support standing posture and relieve anterior pelvic tilt shear on L4-S1.",
    precautions: ["Drive through heels and squeeze glutes; avoid arching lower back at peak."],
    contraindications: [],
    steps: [
      { title: "Basic Glute Bridge (Feet Flat)", duration: 60, cue: "Exhale lift hips until straight line from knees to shoulders, hold 3s.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Bridge with Pelvic Squeeze", duration: 45, cue: "Place small ball/block between knees, squeeze gently while bridging.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Single Leg Bridge Marching", duration: 60, cue: "Hold bridge, lift right foot 1 inch off floor without dipping pelvis. Repeat left.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Spine Articulation Roll Down", duration: 45, cue: "Lower spine down bone by bone, finishing in neutral.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "p6",
    name: "Pilates Hundred (Neutral Spine Adaptation)",
    title: "Pilates Hundred (Neutral Spine Adaptation)",
    category: "pilates",
    focus_areas: ["core", "breath endurance", "transverse abdominis"],
    duration_minutes: 10,
    intensity: "Core Stabilization",
    instruction: "Modified Pilates classic keeping head on mat or supported, pumping arms with rhythmic staccato breathing.",
    description: "Modified Pilates classic keeping head on mat or supported, pumping arms with rhythmic staccato breathing.",
    precautions: ["Head stays grounded if cervical fusion/strain is present."],
    contraindications: ["neck pain with head elevation"],
    steps: [
      { title: "Arm Pump Preparation", duration: 30, cue: "Arms long by side, legs in tabletop, head resting comfortably.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "The Hundred: Set 1-50", duration: 60, cue: "Inhale 5 arm pumps, exhale 5 arm pumps with abdominal brace.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_1.jpg"] },
      { title: "The Hundred: Set 51-100", duration: 60, cue: "Maintain steady rhythmic breathing and flat lower abdomen.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Full Body Stretch Release", duration: 45, cue: "Extend arms and legs long, releasing abdominal wall.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "p7",
    name: "Spine Twist & Thoracic Mobility",
    title: "Spine Twist & Thoracic Mobility",
    category: "pilates",
    focus_areas: ["thoracic", "obliques", "ribcage"],
    duration_minutes: 15,
    intensity: "Adaptive Mobility",
    instruction: "Seated or side-lying rotational mobility targeting the thoracic spine while locking the lumbar spine in neutral.",
    description: "Seated or side-lying rotational mobility targeting the thoracic spine while locking the lumbar spine in neutral.",
    precautions: ["Rotation comes purely from ribs/chest, not twisting lower back."],
    contraindications: ["osteoporotic vertebral compression fracture"],
    steps: [
      { title: "Seated Spine Twist with Ball", duration: 60, cue: "Sit upright, hug ball to chest, exhale rotate ribs 20 degrees right, then left.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Side-Lying Pinwheel Arm Flow", duration: 60, cue: "Circle top arm overhead opening chest to ceiling, follow with eyes.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Opposite Side Pinwheel", duration: 60, cue: "Switch sides. Feel opening through anterior shoulder and ribcage.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Restorative Prone Breath", duration: 45, cue: "Feel posterior ribcage expand with every inhalation.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "p8",
    name: "Single Leg Stretch & Core Control",
    title: "Single Leg Stretch & Core Control",
    category: "pilates",
    focus_areas: ["core", "hip flexors", "lumbar stability"],
    duration_minutes: 15,
    intensity: "Core Stabilization",
    instruction: "Alternating leg reach with hands guiding knee, demanding high lumbar-pelvic stabilization under dynamic load.",
    description: "Alternating leg reach with hands guiding knee, demanding high lumbar-pelvic stabilization under dynamic load.",
    precautions: ["Keep head down if experiencing neck fatigue."],
    contraindications: [],
    steps: [
      { title: "Single Leg Stretch (Head Down)", duration: 60, cue: "Hug right knee, extend left leg at 45 deg angle, switch rhythmically.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Double Leg Tap Adaptation", duration: 45, cue: "Both knees bent, tap toes to mat and return with locked core.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Single Leg Stretch Set 2", duration: 60, cue: "Focus on smooth breathing and rock-steady pelvis.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Knees to Chest Reset", duration: 45, cue: "Gentle rocking side to side.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "p9",
    name: "Shoulder Bridge & Articulation",
    title: "Shoulder Bridge & Articulation",
    category: "pilates",
    focus_areas: ["spine articulation", "glutes", "hamstrings"],
    duration_minutes: 15,
    intensity: "Adaptive Mobility",
    instruction: "Segmental rolling of the spine up and down off the mat, improving intervertebral mobility and proprioception.",
    description: "Segmental rolling of the spine up and down off the mat, improving intervertebral mobility and proprioception.",
    precautions: ["Weight stays on shoulder blades, never pressing into cervical neck."],
    contraindications: ["acute cervical disc issues"],
    steps: [
      { title: "Pelvic Curl Preparation", duration: 45, cue: "Tuck pelvis, lift only sacrum off mat, and roll back down.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Full Segmental Bridge Roll", duration: 60, cue: "Peel spine up vertebra by vertebra to upper thoracic, hold and roll down.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Bridge with Arm Reaches", duration: 60, cue: "At top of bridge, float arms back overhead, then roll spine down.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Supine Rest", duration: 45, cue: "Neutral spine alignment rest.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "p10",
    name: "Swimming & Posterior Chain Endurance",
    title: "Swimming & Posterior Chain Endurance",
    category: "pilates",
    focus_areas: ["erector spinae", "glutes", "scapula", "upper back"],
    duration_minutes: 15,
    intensity: "Targeted Strengthening",
    instruction: "Prone alternating arm and leg fluttering with pillow under pelvis to strengthen extensor muscles safely.",
    description: "Prone alternating arm and leg fluttering with pillow under pelvis to strengthen extensor muscles safely.",
    precautions: ["Place small pillow under lower abdomen/pelvis to prevent hyperextension."],
    contraindications: ["acute facet joint arthropathy with extension pain"],
    steps: [
      { title: "Prone Arm Float Only", duration: 45, cue: "Lie prone, pillow under belly, float right arm 1 inch, then left.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Prone Leg Float Only", duration: 45, cue: "Squeeze glute, float straight leg 1 inch, then opposite.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Slow Swimming Flutter", duration: 60, cue: "Alternate opposite arm and leg fluttering rhythmically.", frames: ["/shoulder_rehab_routine.jpg", "/lumbar_core_routine.jpg"] },
      { title: "Prone Relaxation & Breath", duration: 45, cue: "Turn head to side, relax glutes and back completely.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },

  // ==========================================
  // STRETCHES & MOBILITY (s1 - s10)
  // ==========================================
  {
    id: "s1",
    name: "Piriformis & Deep Glute Stretch",
    title: "Piriformis & Deep Glute Stretch",
    category: "stretches",
    focus_areas: ["glutes", "piriformis", "sciatic nerve", "hips"],
    duration_minutes: 12,
    intensity: "Gentle Restorative",
    instruction: "Relieves piriformis spasm and sciatic nerve entrapment through supine figure-4 and seated chair variants.",
    description: "Relieves piriformis spasm and sciatic nerve entrapment through supine figure-4 and seated chair variants.",
    precautions: ["Stop if numbness or tingling shoots down the leg."],
    contraindications: [],
    steps: [
      { title: "Supine Figure-4 (Right)", duration: 60, cue: "Cross right ankle over left thigh, reach through and draw left leg in.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Supine Figure-4 (Left)", duration: 60, cue: "Repeat on left side, keeping shoulders and neck relaxed.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Seated Chair Glute Stretch", duration: 60, cue: "Sit tall, cross ankle on knee, hinge forward from hips with flat back.", frames: ["/hip_mobility_routine.jpg", "/exercises/childs_pose_2.jpg"] },
      { title: "Restorative Hip Shakes", duration: 45, cue: "Gently shake legs to release residual muscle tone.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "s2",
    name: "Cervical Scalene & Upper Trap Release",
    title: "Cervical Scalene & Upper Trap Release",
    category: "stretches",
    focus_areas: ["scalenes", "upper trapezius", "levator scapulae", "neck"],
    duration_minutes: 10,
    intensity: "Gentle Restorative",
    instruction: "Gentle targeted releases for the anterior scalenes and levator scapulae to ease tension headaches and thoracic outlet tightness.",
    description: "Gentle targeted releases for the anterior scalenes and levator scapulae to ease tension headaches and thoracic outlet tightness.",
    precautions: ["Never pull hard on head; use gentle weight of hand only."],
    contraindications: ["cervical radiculopathy flare-up"],
    steps: [
      { title: "Scalene Anterior Stretch", duration: 45, cue: "Tilt head right, rotate chin 15 deg upward, feel stretch in front-left neck.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Levator Scapulae 'Nose to Armpit'", duration: 45, cue: "Turn head 45 deg right, gently drop chin towards right armpit.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Opposite Side Scalene & Levator", duration: 90, cue: "Repeat carefully on opposite side with relaxed shoulders.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Suboccipital Nod Release", duration: 45, cue: "Tiny nodding motions like saying 'yes' without flexing lower neck.", frames: ["/exercises/cat_cow_2.jpg"] }
    ]
  },
  {
    id: "s3",
    name: "Hamstring Doorframe Decompression",
    title: "Hamstring Doorframe Decompression",
    category: "stretches",
    focus_areas: ["hamstrings", "posterior chain", "lumbar"],
    duration_minutes: 15,
    intensity: "Gentle Restorative",
    instruction: "Doorframe or wall-assisted hamstring lengthening that protects the lower back by supporting the pelvis flat on the floor.",
    description: "Doorframe or wall-assisted hamstring lengthening that protects the lower back by supporting the pelvis flat on the floor.",
    precautions: ["Other leg extends through doorframe flat on the floor."],
    contraindications: [],
    steps: [
      { title: "Doorframe Stretch (Right Leg)", duration: 90, cue: "Right leg up doorframe, left leg flat on floor through doorway. Breathe deeply.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Doorframe Stretch (Left Leg)", duration: 90, cue: "Switch sides. Relax hips and sacrum flat against mat.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Ankle Pumps in Stretch", duration: 45, cue: "Point and flex toes gently while elevated to floss sciatic pathway.", frames: ["/exercises/cat_cow_2.jpg"] },
      { title: "Supine Rest", duration: 45, cue: "Both legs down, resting pelvis in neutral.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "s4",
    name: "Thoracic Open Book Mobility",
    title: "Thoracic Open Book Mobility",
    category: "stretches",
    focus_areas: ["thoracic spine", "chest", "ribcage", "shoulders"],
    duration_minutes: 12,
    intensity: "Adaptive Mobility",
    instruction: "Side-lying rotational stretch to restore thoracic rotation and expand ribcage volume without stressing the lumbar spine.",
    description: "Side-lying rotational stretch to restore thoracic rotation and expand ribcage volume without stressing the lumbar spine.",
    precautions: ["Knees stay clamped together on floor or pillow to lock lumbar spine."],
    contraindications: [],
    steps: [
      { title: "Open Book (Right Arm Opening)", duration: 60, cue: "Side-lying on left, sweep right arm open across body, look towards right hand.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Open Book Static Hold", duration: 45, cue: "Hold open for 3 deep breaths into right chest wall.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Open Book (Left Arm Opening)", duration: 60, cue: "Switch sides. Sweep left arm open, keeping knees glued together.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Open Book Static Hold Left", duration: 45, cue: "Deep ribcage breathing.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "s5",
    name: "Gastrocnemius & Soleus Calf Stretch",
    title: "Gastrocnemius & Soleus Calf Stretch",
    category: "stretches",
    focus_areas: ["calves", "achilles", "ankle mobility", "plantar fascia"],
    duration_minutes: 10,
    intensity: "Adaptive Mobility",
    instruction: "Wall and step calf stretches to restore dorsiflexion, improving walking gait mechanics and offloading lumbar compensation.",
    description: "Wall and step calf stretches to restore dorsiflexion, improving walking gait mechanics and offloading lumbar compensation.",
    precautions: ["Keep heel firmly planted on ground; do not let arch collapse."],
    contraindications: ["acute Achilles tendon rupture"],
    steps: [
      { title: "Straight-Leg Gastrocnemius (Right)", duration: 45, cue: "Hands on wall, step right leg back straight, press heel down.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Bent-Knee Soleus (Right)", duration: 45, cue: "Bend back right knee slightly, shifting stretch deeper towards Achilles.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Straight-Leg Gastrocnemius (Left)", duration: 45, cue: "Switch legs. Step left leg back straight, heel grounded.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Bent-Knee Soleus (Left)", duration: 45, cue: "Bend left knee slightly, keeping heel pinned down.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "s6",
    name: "Quadriceps & Rectus Femoris Wall Stretch",
    title: "Quadriceps & Rectus Femoris Wall Stretch",
    category: "stretches",
    focus_areas: ["quadriceps", "rectus femoris", "patella", "hips"],
    duration_minutes: 12,
    intensity: "Adaptive Mobility",
    instruction: "Standing or side-lying quad stretch that lengthens the two-joint rectus femoris muscle without knee hyperextension.",
    description: "Standing or side-lying quad stretch that lengthens the two-joint rectus femoris muscle without knee hyperextension.",
    precautions: ["Tuck pelvis under to engage glute; avoid arching lower back."],
    contraindications: ["acute patellofemoral pain flare-up"],
    steps: [
      { title: "Side-Lying Quad Stretch (Right)", duration: 60, cue: "Lie on left side, hold right ankle, gently draw heel toward glute.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Side-Lying Quad Stretch (Left)", duration: 60, cue: "Switch sides, keeping knees aligned and hips stacked.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Prone Quad Stretch with Towel", duration: 60, cue: "Lie prone, loop towel around ankle if reaching is difficult.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Prone Hip Rocking Reset", duration: 45, cue: "Gently rock hips side to side to release hip flexors.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "s7",
    name: "Latissimus Dorsi & Side Body Opener",
    title: "Latissimus Dorsi & Side Body Opener",
    category: "stretches",
    focus_areas: ["latissimus dorsi", "thoracolumbar fascia", "side body"],
    duration_minutes: 12,
    intensity: "Adaptive Mobility",
    instruction: "Decompresses the thoracolumbar fascia and lateral ribcage where latissimus attachments often compress the lumbar spine.",
    description: "Decompresses the thoracolumbar fascia and lateral ribcage where latissimus attachments often compress the lumbar spine.",
    precautions: ["Do not lean so far as to pinch the opposite side waist."],
    contraindications: [],
    steps: [
      { title: "Side-Reaching Child's Pose (Right)", duration: 60, cue: "In child's pose, walk both hands to the left, feel stretch down right lat.", frames: ["/exercises/childs_pose_1.jpg"] },
      { title: "Side-Reaching Child's Pose (Left)", duration: 60, cue: "Walk hands to the right, feel deep stretch through left ribcage and lat.", frames: ["/exercises/childs_pose_2.jpg"] },
      { title: "Doorframe Lat Hang", duration: 45, cue: "Hold doorframe at shoulder height, sink hips back and away gently.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Restorative Center Breath", duration: 45, cue: "Breathe into lateral ribcage.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "s8",
    name: "Wrist, Forearm & Median Nerve Floss",
    title: "Wrist, Forearm & Median Nerve Floss",
    category: "stretches",
    focus_areas: ["wrists", "forearms", "median nerve", "carpal tunnel"],
    duration_minutes: 10,
    intensity: "Gentle Restorative",
    instruction: "Gentle wrist flexor/extensor stretches combined with median nerve glides for desk workers and typing fatigue.",
    description: "Gentle wrist flexor/extensor stretches combined with median nerve glides for desk workers and typing fatigue.",
    precautions: ["Never force through sharp wrist or hand pain."],
    contraindications: [],
    steps: [
      { title: "Wrist Flexor Stretch", duration: 45, cue: "Arm straight, palm facing out fingers down, gently draw fingers back.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Wrist Extensor Stretch", duration: 45, cue: "Palm facing in, gently press back of hand down and toward body.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Median Nerve Gliding Flow", duration: 60, cue: "Extend arm out to side, extend wrist, tilt head away, then return.", frames: ["/exercises/cat_cow_2.jpg"] },
      { title: "Wrist Circles & Finger Shakes", duration: 45, cue: "Gentle rolling circles and shaking out hands.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "s9",
    name: "Pectoralis Doorway & Anterior Chest Opener",
    title: "Pectoralis Doorway & Anterior Chest Opener",
    category: "stretches",
    focus_areas: ["pec major", "pec minor", "anterior shoulder", "thoracic"],
    duration_minutes: 10,
    intensity: "Adaptive Mobility",
    instruction: "Releases tight pectoralis major and minor muscles that pull shoulders forward into kyphotic posture.",
    description: "Releases tight pectoralis major and minor muscles that pull shoulders forward into kyphotic posture.",
    precautions: ["Keep forearm flat against doorframe; do not twist shoulder joint."],
    contraindications: ["anterior shoulder instability"],
    steps: [
      { title: "90-Degree Doorway Stretch (Right)", duration: 45, cue: "Elbow at 90 deg on doorframe, step right foot through doorway gently.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "120-Degree High Doorway Stretch (Right)", duration: 45, cue: "Elbow slightly higher to target lower pec fibers.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Doorway Stretch (Left Side)", duration: 90, cue: "Repeat 90 and 120 degree angles on left side with relaxed neck.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Shoulder Rolls & Posture Reset", duration: 45, cue: "Roll shoulders back and down 5 times.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "s10",
    name: "Ankle Dorsiflexion & Plantar Fascia Mobility",
    title: "Ankle Dorsiflexion & Plantar Fascia Mobility",
    category: "stretches",
    focus_areas: ["ankles", "plantar fascia", "feet", "tibialis anterior"],
    duration_minutes: 10,
    intensity: "Adaptive Mobility",
    instruction: "Mobilizes the talocrural joint and rolls the plantar fascia to improve shock absorption during walking.",
    description: "Mobilizes the talocrural joint and rolls the plantar fascia to improve shock absorption during walking.",
    precautions: ["Do not roll ball aggressively over acute plantar fasciitis pain points."],
    contraindications: [],
    steps: [
      { title: "Half-Kneeling Ankle Rocking", duration: 60, cue: "Half-kneeling, drive front knee forward over second toe keeping heel flat.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Opposite Ankle Rocking", duration: 60, cue: "Switch sides, mobilizing left ankle dorsiflexion.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Tennis Ball Foot Roll", duration: 60, cue: "Roll ball along arch of foot for 30s per foot, releasing fascia.", frames: ["/exercises/childs_pose_2.jpg"] },
      { title: "Seated Toe Spreading", duration: 30, cue: "Wiggle and spread toes wide to activate intrinsic foot muscles.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },

  // ==========================================
  // SPINE & NEURO REHAB (r1 - r6)
  // ==========================================
  {
    id: "r1",
    name: "McGill Big 3 Spinal Stabilization",
    title: "McGill Big 3 Spinal Stabilization",
    category: "rehab",
    focus_areas: ["lumbar spine", "core", "quadratus lumborum", "multifidus"],
    duration_minutes: 20,
    intensity: "Stabilization",
    instruction: "The gold-standard clinical spine stabilization protocol: Modified Curl-Up, Side Bridge, and Bird-Dog for maximal stiffness with minimal load.",
    description: "The gold-standard clinical spine stabilization protocol: Modified Curl-Up, Side Bridge, and Bird-Dog for maximal stiffness with minimal load.",
    precautions: ["Hands stay under lumbar spine during curl-up; no spinal flexion."],
    contraindications: [],
    steps: [
      { title: "McGill Modified Curl-Up", duration: 60, cue: "Hands under lower back, one knee bent, lift only head/shoulders 1 inch. Hold 6s.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "McGill Side Bridge (From Knees)", duration: 60, cue: "Prop on elbow and knees, lift hips into straight alignment. Hold 6s per rep.", frames: ["/lumbar_core_routine.jpg", "/hip_mobility_routine.jpg"] },
      { title: "McGill Quadruped Bird-Dog", duration: 60, cue: "Extend opposite arm and leg, hold 6s. Focus on neutral spine stability.", frames: ["/lumbar_core_routine.jpg", "/exercises/cat_cow_1.jpg"] },
      { title: "Spine Decompression Rest", duration: 60, cue: "Rest in prone or supported child's pose.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "r2",
    name: "Sciatic Nerve Flossing Protocol",
    title: "Sciatic Nerve Flossing Protocol",
    category: "rehab",
    focus_areas: ["sciatic nerve", "hamstrings", "lumbar roots", "dura"],
    duration_minutes: 12,
    intensity: "Gentle Restorative",
    instruction: "Neurodynamic gliding where the sciatic nerve slides smoothly through its anatomical sheath without tensioning both ends at once.",
    description: "Neurodynamic gliding where the sciatic nerve slides smoothly through its anatomical sheath without tensioning both ends at once.",
    precautions: ["Never pull into sharp radiating pain; flossing should be gentle and rhythmic."],
    contraindications: ["acute progressive neurological deficit"],
    steps: [
      { title: "Seated Sciatic Slider Setup", duration: 30, cue: "Sit on edge of chair with hands behind back, spine relaxed.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Sciatic Slider (Right Leg)", duration: 60, cue: "Extend right knee while looking UP at ceiling, bend knee while looking DOWN.", frames: ["/hip_mobility_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Sciatic Slider (Left Leg)", duration: 60, cue: "Repeat smooth flossing motion on left leg for 10 slow reps.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Supine Rest & Sensation Check", duration: 45, cue: "Lie flat and observe reduction in nerve sensitivity.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "r3",
    name: "Cervical Retraction & Deep Neck Flexor Training",
    title: "Cervical Retraction & Deep Neck Flexor Training",
    category: "rehab",
    focus_areas: ["longus colli", "longus capitis", "cervical spine"],
    duration_minutes: 12,
    intensity: "Targeted Strengthening",
    instruction: "Low-load isometric training of the deep cervical flexors (longus colli/capitis) to restore cervical stability post-decompression.",
    description: "Low-load isometric training of the deep cervical flexors (longus colli/capitis) to restore cervical stability post-decompression.",
    precautions: ["Do not use sternocleidomastoid (front surface muscles); keep jaw relaxed."],
    contraindications: ["unhealed acute cervical fracture"],
    steps: [
      { title: "Supine Chin Tuck (Cranial Nod)", duration: 60, cue: "Lie supine with small towel under neck, gently nod chin as if flattening back of neck.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Supine Chin Tuck with 5s Hold", duration: 60, cue: "Nod chin gently, hold for 5 seconds breathing normally through nose.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_1.jpg"] },
      { title: "Wall Retraction with Foam Roller", duration: 60, cue: "Stand against wall, press back of head gently into small soft ball.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Postural Breathing Reset", duration: 45, cue: "Sit tall, crown of head reaching toward ceiling.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "r4",
    name: "Scapular Wall Slides & Serratus Activation",
    title: "Scapular Wall Slides & Serratus Activation",
    category: "rehab",
    focus_areas: ["serratus anterior", "lower trapezius", "scapula", "thoracic"],
    duration_minutes: 15,
    intensity: "Targeted Strengthening",
    instruction: "Activates serratus anterior upward rotation of the scapula to prevent subacromial impingement and relieve upper trapezius spasm.",
    description: "Activates serratus anterior upward rotation of the scapula to prevent subacromial impingement and relieve upper trapezius spasm.",
    precautions: ["Keep forearms glued to wall and ribs tucked down."],
    contraindications: [],
    steps: [
      { title: "Forearm Wall Slide Setup", duration: 45, cue: "Forearms vertical on wall with foam roller or towel, step one foot forward.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Wall Slide Upward Sweep", duration: 60, cue: "Slide forearms upward pushing into wall, shrug slightly at top, return with control.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Scapular Protraction Push-Plus (Wall)", duration: 60, cue: "Hands on wall, push chest away rounding upper back without bending elbows.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Shoulder Roll Down", duration: 45, cue: "Shake out arms and breathe deeply.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "r5",
    name: "Thoracic Outlet Syndrome Neuro-Mobility",
    title: "Thoracic Outlet Syndrome Neuro-Mobility",
    category: "rehab",
    focus_areas: ["brachial plexus", "first rib", "pectoralis minor", "scalenes"],
    duration_minutes: 12,
    intensity: "Gentle Restorative",
    instruction: "Decompresses the costoclavicular space and brachial plexus bundle to relieve hand numbness and forearm tingling.",
    description: "Decompresses the costoclavicular space and brachial plexus bundle to relieve hand numbness and forearm tingling.",
    precautions: ["Do not stretch into tingling sensations; stay within comfortable boundaries."],
    contraindications: [],
    steps: [
      { title: "First Rib Self-Depression with Strap", duration: 60, cue: "Loop strap over right collarbone, pull down across left hip while tilting head right.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Brachial Plexus Tension-Free Glide", duration: 60, cue: "Extend arm out, bend wrist up while tilting head towards arm, then alternate.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_1.jpg"] },
      { title: "Opposite Side TOS Release", duration: 60, cue: "Repeat first rib depression and gliding on left side.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Diaphragmatic Rib Expansion", duration: 45, cue: "Breathe deeply into lower ribcage, avoiding upper chest clavicular breathing.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "r6",
    name: "Isometric Cervical Strengthening",
    title: "Isometric Cervical Strengthening",
    category: "rehab",
    focus_areas: ["cervical spine", "neck extensors", "neck rotators"],
    duration_minutes: 12,
    intensity: "Targeted Strengthening",
    instruction: "Zero-movement isometric contractions against palm resistance to build cervical stability without joint shear.",
    description: "Zero-movement isometric contractions against palm resistance to build cervical stability without joint shear.",
    precautions: ["Apply only 20-30% of maximum force; never strain."],
    contraindications: ["acute surgical incision healing phase (<6 weeks)"],
    steps: [
      { title: "Isometric Cervical Flexion", duration: 45, cue: "Palm on forehead, gently press head forward into palm without moving head. Hold 6s.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Isometric Cervical Extension", duration: 45, cue: "Hands behind head, gently press head backward into palms without tilting.", frames: ["/shoulder_rehab_routine.jpg", "/exercises/cat_cow_2.jpg"] },
      { title: "Isometric Lateral Flexion (Left & Right)", duration: 60, cue: "Palm against side of head, press gently for 6s each side.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Restorative Alignment Rest", duration: 45, cue: "Sit tall with relaxed jaw and dropped shoulders.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },

  // ==========================================
  // HYDROTHERAPY POOL ROUTINES (h1 - h4)
  // ==========================================
  {
    id: "h1",
    name: "Hydrotherapy Buoyancy Spinal Decompression",
    title: "Hydrotherapy Buoyancy Spinal Decompression",
    category: "hydrotherapy",
    focus_areas: ["lumbar", "cervical", "spine", "water buoyancy"],
    duration_minutes: 25,
    intensity: "Decompression",
    instruction: "Warm water (34°C) buoyancy protocol offloading up to 90% of gravity compression on spinal discs and facet joints.",
    description: "Warm water (34°C) buoyancy protocol offloading up to 90% of gravity compression on spinal discs and facet joints.",
    precautions: ["Use pool noodles or buoyancy belt for effortless floating."],
    contraindications: ["open surgical wounds", "active fever or infection"],
    steps: [
      { title: "Buoyant Vertical Traction", duration: 90, cue: "Noodle under arms in deep water, allow legs and spine to hang weightlessly.", frames: ["/exercises/childs_pose_1.jpg"] },
      { title: "Gentle Water Knee-to-Chest", duration: 60, cue: "Slowly draw knees towards chest in water, feeling gentle lumbar opening.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Aquatic Torso Pendulum", duration: 60, cue: "Gentle sway of legs side to side in water column.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Supine Water Float with Head Support", duration: 120, cue: "Full supine float supported by pillows, deep parasympathetic relaxation.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "h2",
    name: "Aquatic Multi-Planar Gait & Walking",
    title: "Aquatic Multi-Planar Gait & Walking",
    category: "hydrotherapy",
    focus_areas: ["gait", "hip flexors", "glutes", "balance"],
    duration_minutes: 20,
    intensity: "Adaptive Mobility",
    instruction: "Chest-deep water walking forward, backward, and sideways to retrain normal gait patterns without joint impact.",
    description: "Chest-deep water walking forward, backward, and sideways to retrain normal gait patterns without joint impact.",
    precautions: ["Maintain upright posture; do not lean forward against water resistance."],
    contraindications: [],
    steps: [
      { title: "Forward Water Marching", duration: 90, cue: "High knee marching forward in chest-deep water with normal arm swing.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Backward Heel-to-Toe Walking", duration: 90, cue: "Walk backward with control, engaging glutes and posterior chain.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Lateral Sidestepping", duration: 90, cue: "Step sideways across lane, engaging glute medius against water drag.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Warm Water Calming Rest", duration: 60, cue: "Stand against pool wall, enjoying warmth and hydrostatic pressure.", frames: ["/exercises/childs_pose_1.jpg"] }
    ]
  },
  {
    id: "h3",
    name: "Aquatic Hip & Core Stabilization",
    title: "Aquatic Hip & Core Stabilization",
    category: "hydrotherapy",
    focus_areas: ["glutes", "hip abductors", "core", "pelvis"],
    duration_minutes: 20,
    intensity: "Targeted Strengthening",
    instruction: "Water resistance exercises using kickboards and noodles to strengthen core and hips in a low-impact environment.",
    description: "Water resistance exercises using kickboards and noodles to strengthen core and hips in a low-impact environment.",
    precautions: ["Move at a steady controlled speed; water resistance increases with speed."],
    contraindications: [],
    steps: [
      { title: "Aquatic Standing Hip Abduction", duration: 60, cue: "Hold pool wall, sweep right leg out to side against water resistance. Repeat left.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Kickboard Core Press-Down", duration: 60, cue: "Hold kickboard with both hands, push down into water, engage abs.", frames: ["/lumbar_core_routine.jpg"] },
      { title: "Aquatic Bicycle Pedaling", duration: 60, cue: "Rest back on noodles, pedal legs smoothly like riding a bike.", frames: ["/lumbar_core_routine.jpg", "/hip_mobility_routine.jpg"] },
      { title: "Floating Spine Rest", duration: 90, cue: "Rest supported on water surface.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  },
  {
    id: "h4",
    name: "Warm Water Relaxation & Lymphatic Flush",
    title: "Warm Water Relaxation & Lymphatic Flush",
    category: "hydrotherapy",
    focus_areas: ["lymphatic drainage", "edema", "nervous system", "circulation"],
    duration_minutes: 20,
    intensity: "Decompression",
    instruction: "Leverages hydrostatic pressure to drive fluid return, clear metabolic waste, and reduce post-surgical swelling.",
    description: "Leverages hydrostatic pressure to drive fluid return, clear metabolic waste, and reduce post-surgical swelling.",
    precautions: ["Hydrate with water before and after pool session."],
    contraindications: [],
    steps: [
      { title: "Deep Water Submersion Breathing", duration: 90, cue: "Chest submerged, feel hydrostatic pressure assist deep exhalations.", frames: ["/exercises/childs_pose_1.jpg"] },
      { title: "Aquatic Arm Sweeps (Lymphatic Flow)", duration: 60, cue: "Smooth sweeping circles with hands submerged in water.", frames: ["/shoulder_rehab_routine.jpg"] },
      { title: "Ankle & Foot Water Mobility", duration: 60, cue: "Point, flex, and rotate ankles in warm water.", frames: ["/hip_mobility_routine.jpg"] },
      { title: "Supported Supine Water Float", duration: 120, cue: "Complete still surrender in warm hydro pool.", frames: ["/exercises/childs_pose_2.jpg"] }
    ]
  }
];

export function getExerciseById(id: string): ExerciseItem | undefined {
  const cleanId = id.toLowerCase().trim();
  return EXERCISE_DATABASE.find(e => e.id.toLowerCase() === cleanId);
}

export function searchExercises(options: {
  query?: string;
  category?: string;
  focus_area?: string;
  intensity?: string;
}): ExerciseItem[] {
  let results = [...EXERCISE_DATABASE];

  if (options.category && options.category !== "all") {
    const cat = options.category.toLowerCase().trim();
    results = results.filter(e => e.category.toLowerCase() === cat);
  }

  if (options.focus_area && options.focus_area !== "all") {
    const area = options.focus_area.toLowerCase().trim();
    results = results.filter(e => 
      e.focus_areas.some(fa => fa.toLowerCase().includes(area) || area.includes(fa.toLowerCase()))
    );
  }

  if (options.query && options.query.trim()) {
    const q = options.query.toLowerCase().trim();
    results = results.filter(e => 
      e.name.toLowerCase().includes(q) ||
      e.instruction.toLowerCase().includes(q) ||
      e.focus_areas.some(fa => fa.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q) ||
      e.intensity.toLowerCase().includes(q) ||
      e.steps.some(s => s.title.toLowerCase().includes(q) || (s.cue && s.cue.toLowerCase().includes(q)))
    );
  }

  return results;
}
