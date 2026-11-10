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
  video_url?: string;
}

export const EXERCISE_DATABASE: ExerciseItem[] = [
  // ==========================================
  // YOGA ROUTINES (y1 - y10)
  // ==========================================
  {
  "id": "y1",
  "name": "Gentle Lumbar Release",
  "title": "Gentle Lumbar Release",
  "category": "yoga",
  "focus_areas": [
    "lumbar",
    "lower back",
    "pelvis"
  ],
  "duration_minutes": 20,
  "intensity": "Gentle Restorative",
  "instruction": "Progressive supine lumbar decompression protocol: diaphragmatic awakening, gentle pelvic clocks, single knee-to-chest releases, supported bridge holds, and restorative bolster grounding.",
  "description": "Progressive supine lumbar decompression protocol: diaphragmatic awakening, gentle pelvic clocks, single knee-to-chest releases, supported bridge holds, and restorative bolster grounding.",
  "precautions": [
    "Avoid aggressive lumbar flexion during acute disc flare-ups.",
    "Keep movements gentle and pain-free."
  ],
  "contraindications": [
    "acute disc herniation"
  ],
  "steps": [
    {
      "title": "Diaphragmatic 360 Core Awakening",
      "duration": 120,
      "cue": "Lie supine with knees bent, breathe deep into lateral ribs and lower abdomen.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    },
    {
      "title": "Supine Pelvic Tilts & Neutral Finding",
      "duration": 120,
      "cue": "Flatten lower back gently on exhale, slight neutral arch on inhale.",
      "frames": [
        "/exercises/supine_pelvic_tilts_hud.jpg"
      ]
    },
    {
      "title": "Supine Pelvic Clocks & Transverse Holds",
      "duration": 120,
      "cue": "Gentle circular micro-mobilization of the pelvis without straining lumbar discs.",
      "frames": [
        "/exercises/supine_pelvic_clocks_hud.jpg"
      ]
    },
    {
      "title": "Supine Single Knee-to-Chest (Right)",
      "duration": 120,
      "cue": "Hug right knee gently towards shoulder, keeping left foot grounded flat.",
      "frames": [
        "/exercises/knee_to_chest_right_hud.jpg"
      ]
    },
    {
      "title": "Supine Single Knee-to-Chest (Left)",
      "duration": 120,
      "cue": "Switch and hug left knee gently, decompressing lumbar facet joints.",
      "frames": [
        "/exercises/knee_to_chest_left_hud.jpg"
      ]
    },
    {
      "title": "Gentle Supported Bridge Activation",
      "duration": 120,
      "cue": "Press through heels to lift pelvis slightly, engaging glutes without arching lumbar spine.",
      "frames": [
        "/exercises/hip_glute_bridge_hud.jpg"
      ]
    },
    {
      "title": "Supported Child's Pose Decompression",
      "duration": 120,
      "cue": "Knees wide, sink hips toward heels, rest torso on cushion or mat.",
      "frames": [
        "/exercises/supported_childs_pose_hud.jpg"
      ]
    },
    {
      "title": "Cat-Cow Spine Awakening",
      "duration": 120,
      "cue": "Gentle rhythmic undulation of spine on hands and knees, keeping neck neutral.",
      "frames": [
        "/exercises/cat_cow_hud.jpg"
      ]
    },
    {
      "title": "Gentle Supine Torso Twist",
      "duration": 120,
      "cue": "Drop knees gently 45 degrees to each side to mobilize lumbar rotation safely.",
      "frames": [
        "/exercises/gentle_supine_torso_twist_hud.jpg"
      ]
    },
    {
      "title": "Restorative Savasana with Bolster",
      "duration": 120,
      "cue": "Rest with bolster beneath knees to unload psoas and settle lumbar spine.",
      "frames": [
        "/exercises/restorative_savasana_hud.jpg"
      ]
    }
  ]
},
{
  "id": "y2",
  "name": "Cervical Mobility Flow",
  "title": "Cervical Mobility Flow",
  "category": "yoga",
  "focus_areas": [
    "cervical",
    "neck",
    "upper trapezius"
  ],
  "duration_minutes": 15,
  "intensity": "Gentle",
  "instruction": "Gentle seated neck retractions, slow lateral tilts, scapular shrugs, and thoracic decompression for post-surgical cervical safety.",
  "description": "Gentle seated neck retractions, slow lateral tilts, scapular shrugs, and thoracic decompression for post-surgical cervical safety.",
  "precautions": [
    "No rapid cervical rotations or forced extension post-cervical surgery."
  ],
  "contraindications": [
    "acute cervical radiculopathy with progressive weakness"
  ],
  "steps": [
    {
      "title": "Seated Axial Retraction (Chin Tuck)",
      "duration": 110,
      "cue": "Sit tall, draw chin straight back into gentle double chin without tilting head down. Hold 5s.",
      "frames": [
        "/exercises/cervical_chin_tuck_hud.svg"
      ]
    },
    {
      "title": "Gentle Lateral Ear-to-Shoulder",
      "duration": 110,
      "cue": "Slowly tilt right ear toward right shoulder, keep opposite shoulder down, breathe 30s. Repeat opposite.",
      "frames": [
        "/exercises/cervical_lateral_ear_shoulder_hud.svg"
      ]
    },
    {
      "title": "Shoulder Shrug & Scapular Release",
      "duration": 110,
      "cue": "Inhale lift shoulders toward ears, exhale let them drop completely to release upper trapezius tension.",
      "frames": [
        "/exercises/cervical_shoulder_shrug_hud.svg"
      ]
    },
    {
      "title": "Gentle Neck AROM Rotation (Supine)",
      "duration": 110,
      "cue": "Lie supine with neck supported, smoothly rotate head 45 degrees side-to-side without strain.",
      "frames": [
        "/exercises/supine_cervical_rotation_hud.svg"
      ]
    },
    {
      "title": "Seated Cactus Arm Chest Expansion",
      "duration": 110,
      "cue": "Bring elbows to 90 degrees at shoulder height, gently draw shoulder blades together to expand chest.",
      "frames": [
        "/exercises/thoracic_cactus_expansion_hud.svg"
      ]
    },
    {
      "title": "Thread the Needle Upper Spine Release",
      "duration": 120,
      "cue": "From tabletop, glide right arm under torso, resting shoulder and temple gently on floor or block.",
      "frames": [
        "/exercises/thread_the_needle_hud.svg"
      ]
    },
    {
      "title": "Constructive Rest Position",
      "duration": 110,
      "cue": "Lie supine with knees bent and feet wide, knees resting together to unload psoas and cervical spine.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    },
    {
      "title": "Restorative Alignment Breathing",
      "duration": 110,
      "cue": "Breathe slowly into lower ribs, allowing neck and upper traps to remain completely soft and relaxed.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    }
  ]
},
{
  "id": "y3",
  "name": "Full Body Restorative Yin",
  "title": "Full Body Restorative Yin",
  "category": "yoga",
  "focus_areas": [
    "full body",
    "nervous system",
    "restorative"
  ],
  "duration_minutes": 30,
  "intensity": "Very Gentle / Yin",
  "instruction": "Passive, prop-supported postures held for extended periods to stimulate the parasympathetic nervous system and safely release fascial tension.",
  "description": "Passive, prop-supported postures held for extended periods to stimulate the parasympathetic nervous system and safely release fascial tension.",
  "precautions": [
    "Use ample cushions and bolsters.",
    "Never force range of motion."
  ],
  "contraindications": [
    "acute joint inflammation"
  ],
  "steps": [
    {
      "title": "Supported Reclined Bound Angle",
      "duration": 180,
      "cue": "Soles of feet together, knees supported by blocks or cushions, arms relaxed by sides.",
      "frames": [
        "/exercises/supported_reclined_bound_angle.jpg"
      ]
    },
    {
      "title": "Gentle Diaphragmatic Breath Grounding",
      "duration": 180,
      "cue": "Inhale 4 counts, exhale 6 counts. Feel belly rise and fall under hands.",
      "frames": [
        "/exercises/gentle_diaphragmatic_breath_hud.jpg"
      ]
    },
    {
      "title": "Gentle Cat-Cow Spine Wave",
      "duration": 180,
      "cue": "Slow, undulating breath-synchronized spine mobilization on hands and knees.",
      "frames": [
        "/exercises/gentle_cat_cow.jpg"
      ]
    },
    {
      "title": "Supported Gentle Sphinx",
      "duration": 180,
      "cue": "Forearms grounded, elbows under shoulders, gentle passive thoracic extension.",
      "frames": [
        "/exercises/supported_gentle_sphinx.jpg"
      ]
    },
    {
      "title": "Supported Child's Pose with Bolster",
      "duration": 180,
      "cue": "Torso resting on long bolster between knees, head turned gently to one side.",
      "frames": [
        "/exercises/supported_childs_pose_bolster_hud.jpg"
      ]
    },
    {
      "title": "Gentle Supine Torso Twist",
      "duration": 180,
      "cue": "Drop knees softly to right with bolster support; switch to left halfway through.",
      "frames": [
        "/exercises/gentle_supine_torso_twist_hud.jpg"
      ]
    },
    {
      "title": "Supported Pelvic Bridge on Block",
      "duration": 180,
      "cue": "Low foam block under sacrum, arms relaxed, allowing hip flexors to passively open.",
      "frames": [
        "/exercises/supported_bridge_block_hud.jpg"
      ]
    },
    {
      "title": "Constructive Rest Position with Bolster",
      "duration": 180,
      "cue": "Knees bent and knocked together, bolster under thighs, lower back flat and grounded.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    },
    {
      "title": "Legs Up the Wall (Viparita Karani)",
      "duration": 180,
      "cue": "Hips close to wall, legs extending vertically, letting gravity passively drain lower limbs.",
      "frames": [
        "/exercises/legs_up_the_wall.jpg"
      ]
    },
    {
      "title": "Acupressure Mat & Bolster Wind-Down Savasana",
      "duration": 180,
      "cue": "Rest upper back on acupressure mat with bolster under knees, melting into floor.",
      "frames": [
        "/exercises/acupressure_mat_savasana_hud.jpg"
      ]
    }
  ]
},
{
  "id": "y4",
  "name": "Shoulder & Thoracic Opener",
  "title": "Shoulder & Thoracic Opener",
  "category": "yoga",
  "focus_areas": [
    "thoracic",
    "shoulders",
    "chest",
    "scapula"
  ],
  "duration_minutes": 20,
  "intensity": "Gentle",
  "instruction": "Targeted protocol to decompress mid-back kyphosis, open anterior shoulder capsule, and mobilize thoracic cage without lumbar hyperextension.",
  "description": "Targeted protocol to decompress mid-back kyphosis, open anterior shoulder capsule, and mobilize thoracic cage without lumbar hyperextension.",
  "precautions": [
    "Avoid forcing shoulder external rotation if shoulder impingement is present."
  ],
  "contraindications": [
    "acute shoulder dislocation"
  ],
  "steps": [
    {
      "title": "Diaphragmatic Breath & Rib Expansion",
      "duration": 120,
      "cue": "Inhale into 360 lateral ribcage, expanding lower intercostals without elevating shoulders.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    },
    {
      "title": "Cervical Chin Tucks & Neck Lengthening",
      "duration": 120,
      "cue": "Sit tall, gently glide head straight back to decompress cervical spine and lengthen posterior neck.",
      "frames": [
        "/exercises/cervical_chin_tuck_hud.svg"
      ]
    },
    {
      "title": "Cat-Cow Thoracic Waves",
      "duration": 120,
      "cue": "Rhythmic spinal mobilization on all fours, focusing wave movement through mid-thoracic spine.",
      "frames": [
        "/exercises/gentle_cat_cow.jpg"
      ]
    },
    {
      "title": "Thread the Needle (Right Side)",
      "duration": 120,
      "cue": "Slide right arm under torso across mat, resting right shoulder and ear down to open right thoracic ribs.",
      "frames": [
        "/exercises/thread_the_needle_right_hud.svg"
      ]
    },
    {
      "title": "Thread the Needle (Left Side)",
      "duration": 120,
      "cue": "Switch sides, sliding left arm under torso, rotating thoracic spine gently without forcing lumbar twist.",
      "frames": [
        "/exercises/thread_the_needle_left_hud.svg"
      ]
    },
    {
      "title": "Puppy Pose Thoracic Stretch",
      "duration": 120,
      "cue": "Hips stacked over knees, walk hands forward and melt chest toward floor to reverse thoracic kyphosis.",
      "frames": [
        "/exercises/puppy_pose_thoracic_hud.svg"
      ]
    },
    {
      "title": "Seated Cactus Arm Openers",
      "duration": 120,
      "cue": "Elbows at 90 degrees, draw shoulder blades together and down, lifting sternum gently.",
      "frames": [
        "/exercises/thoracic_cactus_expansion_hud.svg"
      ]
    },
    {
      "title": "Open Book Thoracic Rotations",
      "duration": 120,
      "cue": "Side-lying with knees stacked at 90 degrees, fan top arm open across chest in a smooth rotational arc.",
      "frames": [
        "/exercises/open_book_thoracic_hud.svg"
      ]
    },
    {
      "title": "Supported Gentle Sphinx",
      "duration": 120,
      "cue": "Forearms on mat parallel, lift chest gently without compressing lumbar spine.",
      "frames": [
        "/exercises/supported_gentle_sphinx.jpg"
      ]
    },
    {
      "title": "Constructive Rest & Scapular Settle",
      "duration": 120,
      "cue": "Lie supine with knees bent and feet wide, feeling shoulder blades melt flat onto the floor.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    }
  ]
},
{
  "id": "y5",
  "name": "Hip Flexor & Psoas Flow",
  "title": "Hip Flexor & Psoas Flow",
  "category": "yoga",
  "focus_areas": [
    "hips",
    "psoas",
    "pelvis",
    "glutes"
  ],
  "duration_minutes": 20,
  "intensity": "Gentle",
  "instruction": "Systematic lengthening of the iliopsoas, rectus femoris, and deep hip rotators to relieve anterior hip impingement and lumbar hyperlordosis.",
  "description": "Systematic lengthening of the iliopsoas, rectus femoris, and deep hip rotators to relieve anterior hip impingement and lumbar hyperlordosis.",
  "precautions": [
    "Do not let lumbar spine hyperextend during kneeling lunges; tuck tailbone under."
  ],
  "contraindications": [
    "acute hip labral tear with groin pinch"
  ],
  "steps": [
    {
      "title": "Diaphragmatic Breath & Psoas Awareness",
      "duration": 120,
      "cue": "Lie supine, breathe deep into pelvis, visualizing psoas releasing tension on each long exhale.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    },
    {
      "title": "Supine Pelvic Tilts to Neutral",
      "duration": 120,
      "cue": "Flatten lumbar curve gently into mat on exhale, return to neutral on inhale without straining.",
      "frames": [
        "/exercises/supine_pelvic_tilts.jpg"
      ]
    },
    {
      "title": "Gentle Glute Bridge Activation",
      "duration": 120,
      "cue": "Drive through heels, squeeze glutes to lift hips to knee height, opening front of hip flexors.",
      "frames": [
        "/exercises/hip_glute_bridge_hud.jpg"
      ]
    },
    {
      "title": "Low Kneeling Lunge (Right Hip Flexor)",
      "duration": 120,
      "cue": "Step left foot forward, right knee cushioned on mat. Tuck tailbone under to feel front right hip stretch.",
      "frames": [
        "/exercises/hip_kneeling_lunge_right_hud.svg"
      ]
    },
    {
      "title": "Low Kneeling Lunge (Left Hip Flexor)",
      "duration": 120,
      "cue": "Step right foot forward, left knee cushioned on mat. Maintain posterior pelvic tilt to stretch left psoas.",
      "frames": [
        "/exercises/hip_kneeling_lunge_left_hud.svg"
      ]
    },
    {
      "title": "90/90 Seated Hip Rotations",
      "duration": 120,
      "cue": "Sit on floor with both legs at 90-degree angles. Gently hinge chest forward over front knee, spine tall.",
      "frames": [
        "/exercises/hip_ninety_ninety_hud.svg"
      ]
    },
    {
      "title": "Reclined Figure-4 Hip Opener (Right)",
      "duration": 120,
      "cue": "Supine, cross right ankle over left knee. Hug left hamstring gently to release right piriformis and glute.",
      "frames": [
        "/exercises/hip_figure_four_right_hud.svg"
      ]
    },
    {
      "title": "Reclined Figure-4 Hip Opener (Left)",
      "duration": 120,
      "cue": "Supine, cross left ankle over right knee. Hug right thigh toward chest to decompress left hip capsule.",
      "frames": [
        "/exercises/hip_figure_four_left_hud.svg"
      ]
    },
    {
      "title": "Supported Reclined Bound Angle",
      "duration": 120,
      "cue": "Soles of feet together, knees supported by pillows or blocks, releasing adductors and groin passively.",
      "frames": [
        "/exercises/supported_reclined_bound_angle.jpg"
      ]
    },
    {
      "title": "Savasana Psoas Decompression",
      "duration": 120,
      "cue": "Rest flat with bolster under knees to keep psoas slack and lower back fully settled.",
      "frames": [
        "/exercises/restorative_savasana.jpg"
      ]
    }
  ]
},
{
  "id": "y6",
  "name": "Morning Spine Awakening",
  "title": "Morning Spine Awakening",
  "category": "yoga",
  "focus_areas": [
    "spine",
    "core",
    "morning routine",
    "mobility"
  ],
  "duration_minutes": 20,
  "intensity": "Gentle Wakeup",
  "instruction": "Early morning progressive mobilization: gentle diaphragmatic awakening, rhythmic cat-cow, thoracic rotations, and restorative settling.",
  "description": "Early morning progressive mobilization: gentle diaphragmatic awakening, rhythmic cat-cow, thoracic rotations, and restorative settling.",
  "precautions": [
    "Move slowly through early morning spinal stiffness; no forceful end-range stretches."
  ],
  "contraindications": [
    "acute spinal fracture"
  ],
  "steps": [
    {
      "title": "Morning Breath & Centering",
      "duration": 120,
      "cue": "Awaken diaphragm with 5 deep breaths, expanding lower abdomen and ribcage smoothly.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    },
    {
      "title": "Cat-Cow Rhythmic Spine Mobilization",
      "duration": 120,
      "cue": "Hands and knees, undulate spine smoothly from tailbone to crown in sync with breath.",
      "frames": [
        "/exercises/cat_cow_hud.jpg"
      ]
    },
    {
      "title": "Child's Pose Lateral Side Stretch",
      "duration": 120,
      "cue": "Sink hips to heels, walk hands gently toward right corner of mat to open left flank, then switch.",
      "frames": [
        "/exercises/supported_childs_pose.jpg"
      ]
    },
    {
      "title": "Puppy Pose Thoracic Melt",
      "duration": 120,
      "cue": "Hips high over knees, melt chest and sternum downward to unlock thoracic extension.",
      "frames": [
        "/exercises/puppy_pose_thoracic_hud.svg"
      ]
    },
    {
      "title": "Open Book Thoracic Opener (Right)",
      "duration": 120,
      "cue": "Side-lying on left side, sweep right arm open across chest, rotating head and eyes toward right hand.",
      "frames": [
        "/exercises/open_book_right_hud.svg"
      ]
    },
    {
      "title": "Open Book Thoracic Opener (Left)",
      "duration": 120,
      "cue": "Side-lying on right side, sweep left arm open in a smooth arc, keeping knees glued together.",
      "frames": [
        "/exercises/open_book_left_hud.svg"
      ]
    },
    {
      "title": "Supported Low Kneeling Lunge",
      "duration": 120,
      "cue": "Half-kneeling with hands on front knee or blocks, gently open hip flexor chain without lumbar overarching.",
      "frames": [
        "/exercises/hip_kneeling_lunge_right_hud.svg"
      ]
    },
    {
      "title": "Gentle Supine Torso Twist",
      "duration": 120,
      "cue": "Supine, drop both knees gently to the side with shoulders grounded to restore rotational ease.",
      "frames": [
        "/exercises/gentle_supine_torso_twist_hud.jpg"
      ]
    },
    {
      "title": "Supported Gentle Sphinx Micro-Lifts",
      "duration": 120,
      "cue": "Prone on forearms, gently draw elbows toward hips to extend thoracic spine with zero lumbar pinch.",
      "frames": [
        "/exercises/supported_sphinx_microlifts_hud.svg"
      ]
    },
    {
      "title": "Constructive Rest Neutral Settle",
      "duration": 120,
      "cue": "Rest supine with knees bent and supported, letting the entire spine imprint into neutral alignment.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    }
  ]
},
{
  "id": "y7",
  "name": "Chair Yoga for Desk Decompression",
  "title": "Chair Yoga for Desk Decompression",
  "category": "yoga",
  "focus_areas": [
    "desk posture",
    "thoracic",
    "neck",
    "hips",
    "ergonomics"
  ],
  "duration_minutes": 15,
  "intensity": "Gentle Chair-Based",
  "instruction": "Accessible, zero-floor chair routine for midday desk workers: reverses seated kyphosis, unglues piriformis tension, and releases upper trap spasms.",
  "description": "Accessible, zero-floor chair routine for midday desk workers: reverses seated kyphosis, unglues piriformis tension, and releases upper trap spasms.",
  "precautions": [
    "Use a stable chair without wheels.",
    "Keep feet firmly planted during seated twists."
  ],
  "contraindications": [
    "severe postural orthostatic tachycardia syndrome without supervision"
  ],
  "steps": [
    {
      "title": "Seated Diaphragmatic Breath",
      "duration": 110,
      "cue": "Sit tall away from chair back, feet flat. Breathe into lateral ribs to down-regulate nervous system.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    },
    {
      "title": "Seated Cat-Cow",
      "duration": 110,
      "cue": "Hands on knees: inhale arch chest forward, exhale round spine back, releasing desk tension.",
      "frames": [
        "/exercises/chair_seated_cat_cow_hud.svg"
      ]
    },
    {
      "title": "Seated Figure-4 Hip Opener (Right)",
      "duration": 110,
      "cue": "Cross right ankle over left knee. Keep spine straight and gently hinge from hips until right glute stretches.",
      "frames": [
        "/exercises/chair_seated_figure_four_right_hud.svg"
      ]
    },
    {
      "title": "Seated Figure-4 Hip Opener (Left)",
      "duration": 110,
      "cue": "Cross left ankle over right knee. Hinge forward with neutral spine to decompress left hip capsule.",
      "frames": [
        "/exercises/chair_seated_figure_four_left_hud.svg"
      ]
    },
    {
      "title": "Seated Upper Trapezius Drop (Right)",
      "duration": 110,
      "cue": "Anchor right hand under chair seat, gently tilt left ear toward left shoulder to release right upper trap.",
      "frames": [
        "/exercises/chair_upper_trapezius_drop_right_hud.svg"
      ]
    },
    {
      "title": "Seated Upper Trapezius Drop (Left)",
      "duration": 110,
      "cue": "Anchor left hand under chair seat, tilt right ear toward right shoulder, relaxing left shoulder downward.",
      "frames": [
        "/exercises/chair_upper_trapezius_drop_left_hud.svg"
      ]
    },
    {
      "title": "Seated Chest Expansion",
      "duration": 110,
      "cue": "Interlace fingers behind lower back or hold chair back, roll shoulders back and lift sternum gently.",
      "frames": [
        "/exercises/chair_seated_chest_expansion_hud.svg"
      ]
    },
    {
      "title": "Seated Alignment & Grounding",
      "duration": 110,
      "cue": "Rest hands on thighs, stack ears over shoulders and shoulders over hips in effortless neutral posture.",
      "frames": [
        "/exercises/seated_alignment_grounding_hud.svg"
      ]
    }
  ]
},
{
  "id": "y8",
  "name": "Vagus Nerve & Restorative Breath",
  "title": "Vagus Nerve & Restorative Breath",
  "category": "yoga",
  "focus_areas": [
    "vagus nerve",
    "autonomic",
    "parasympathetic",
    "breathing"
  ],
  "duration_minutes": 20,
  "intensity": "Very Gentle Restorative",
  "instruction": "Clinically designed vagal neuromodulation: 4-7-8 breathing, auricular ear clip setup, suboccipital release, and oculomotor vagal reflexes to break chronic pain loops.",
  "description": "Clinically designed vagal neuromodulation: 4-7-8 breathing, auricular ear clip setup, suboccipital release, and oculomotor vagal reflexes to break chronic pain loops.",
  "precautions": [
    "If feeling lightheaded, discontinue breath holds and return to natural tidal breathing."
  ],
  "contraindications": [
    "cardiac pacemaker without doctor approval for electrical stimulation"
  ],
  "steps": [
    {
      "title": "4-7-8 Parasympathetic Breathing",
      "duration": 150,
      "cue": "Inhale through nose 4s, hold breath 7s, exhale slowly through mouth 8s to stimulate vagal brake.",
      "frames": [
        "/exercises/vagal_478_breathing_hud.svg"
      ]
    },
    {
      "title": "Caremax Auricular Ear Clip Setup (Optional)",
      "duration": 150,
      "cue": "Attach ear clip to left tragus or concha for transcutaneous auricular vagus nerve stimulation (tVNS).",
      "frames": [
        "/exercises/caremax_ear_clip_vagus_hud.svg"
      ]
    },
    {
      "title": "Suboccipital Massage with Towel",
      "duration": 150,
      "cue": "Rest base of skull on rolled towel or two tennis balls, letting weight of head release occipital tension.",
      "frames": [
        "/exercises/suboccipital_release_hud.svg"
      ]
    },
    {
      "title": "Oculomotor Vagal Reset",
      "duration": 150,
      "cue": "Supine with head neutral, shift eyes to far right for 30s until swallow/sigh, then repeat left.",
      "frames": [
        "/exercises/restorative_savasana.jpg"
      ]
    },
    {
      "title": "Supported Reclined Bound Angle",
      "duration": 150,
      "cue": "Supine with bolster along spine and cushions under knees, letting heart and chest soften open.",
      "frames": [
        "/exercises/supported_reclined_bound_angle.jpg"
      ]
    },
    {
      "title": "Gentle Heart-Belly Grounding",
      "duration": 150,
      "cue": "One hand on heart, one on lower abdomen. Feel warmth and grounding rhythm under hands on each breath.",
      "frames": [
        "/exercises/heart_belly_grounding_hud.svg"
      ]
    },
    {
      "title": "Constructive Rest Position",
      "duration": 150,
      "cue": "Knees bent 90 degrees resting against each other, lower back flat and completely slack.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    },
    {
      "title": "Legs-Elevated Vagal Calming",
      "duration": 150,
      "cue": "Rest calves on chair or bolster, legs elevated above hips to promote venous return and deep calm.",
      "frames": [
        "/exercises/legs_elevated_relaxation_hud.svg"
      ]
    }
  ]
},
{
  "id": "y9",
  "name": "Hamstring & Posterior Chain Release",
  "title": "Hamstring & Posterior Chain Release",
  "category": "yoga",
  "focus_areas": [
    "hamstrings",
    "calves",
    "posterior chain",
    "sciatic path"
  ],
  "duration_minutes": 20,
  "intensity": "Gentle",
  "instruction": "Supine strap-assisted lengthening of the biceps femoris, semitendinosus, and gastrocnemius without rounding or straining the lumbar spine.",
  "description": "Supine strap-assisted lengthening of the biceps femoris, semitendinosus, and gastrocnemius without rounding or straining the lumbar spine.",
  "precautions": [
    "Keep a micro-bend in the knee; never lock knee or force foot past 90 degrees."
  ],
  "contraindications": [
    "acute hamstring avulsion"
  ],
  "steps": [
    {
      "title": "Diaphragmatic Breath & Pelvic Alignment",
      "duration": 150,
      "cue": "Establish diaphragmatic breathing, ensuring pelvis is neutral before posterior chain stretching.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    },
    {
      "title": "Supine Pelvic Tilts",
      "duration": 150,
      "cue": "Gentle pelvic rocking to warm lumbar spine and loosen hamstring proximal attachments at sit bones.",
      "frames": [
        "/exercises/supine_pelvic_tilts.jpg"
      ]
    },
    {
      "title": "Supine Strap Leg Extension (Right)",
      "duration": 150,
      "cue": "Loop strap around right ball of foot, gently extend leg upward with micro-bent knee, keeping pelvis grounded.",
      "frames": [
        "/exercises/supine_strap_hamstring_right_hud.svg"
      ]
    },
    {
      "title": "Supine Strap Leg Extension (Left)",
      "duration": 150,
      "cue": "Loop strap around left ball of foot, extend toward ceiling until gentle hamstring stretch is felt.",
      "frames": [
        "/exercises/supine_strap_hamstring_left_hud.svg"
      ]
    },
    {
      "title": "Gentle IT Band Cross-Body (Right)",
      "duration": 150,
      "cue": "Right leg extended in strap, bring leg 15 degrees across midline while keeping right hip pinned to mat.",
      "frames": [
        "/exercises/it_band_crossbody_right_hud.svg"
      ]
    },
    {
      "title": "Gentle IT Band Cross-Body (Left)",
      "duration": 150,
      "cue": "Left leg in strap, draw leg 15 degrees across body toward right, feeling lateral thigh and IT band release.",
      "frames": [
        "/exercises/it_band_crossbody_left_hud.svg"
      ]
    },
    {
      "title": "Ankle & Foot Mobility Pumps",
      "duration": 150,
      "cue": "Point and flex ankles 20 times, then gentle circles both directions to mobilize neural tissue.",
      "frames": [
        "/exercises/ankle_foot_mobility_hud.svg"
      ]
    },
    {
      "title": "Restorative Leg Rest Savasana",
      "duration": 150,
      "cue": "Extend both legs onto mat or bolster, letting posterior fascia absorb the decompression.",
      "frames": [
        "/exercises/restorative_savasana.jpg"
      ]
    }
  ]
},
{
  "id": "y10",
  "name": "Evening Restorative Wind-Down",
  "title": "Evening Restorative Wind-Down",
  "category": "yoga",
  "focus_areas": [
    "parasympathetic",
    "sleep",
    "full body",
    "nervous system"
  ],
  "duration_minutes": 25,
  "intensity": "Very Gentle / Evening",
  "instruction": "Down-regulating bedtime sequence combining deep diaphragmatic breathing, supported hip openers, gentle spinal twists, and supported inversion.",
  "description": "Down-regulating bedtime sequence combining deep diaphragmatic breathing, supported hip openers, gentle spinal twists, and supported inversion.",
  "precautions": [
    "Move at 50% normal speed.",
    "Dim lighting and prioritize stillness over stretch intensity."
  ],
  "contraindications": [
    "none"
  ],
  "steps": [
    {
      "title": "Diaphragmatic Parasympathetic Reset",
      "duration": 150,
      "cue": "Lie supine, exhale twice as long as inhale to trigger nocturnal parasympathetic dominance.",
      "frames": [
        "/exercises/diaphragmatic_breathing_hud.jpg"
      ]
    },
    {
      "title": "Supported Reclined Bound Angle",
      "duration": 150,
      "cue": "Soles together with bolster under spine, letting hips and chest passively open.",
      "frames": [
        "/exercises/supported_reclined_bound_angle.jpg"
      ]
    },
    {
      "title": "Gentle Pelvic Tilts & Lumbopelvic Clocks",
      "duration": 150,
      "cue": "Slow circular micro-tilts of pelvis to release accumulated daily lumbar disc tension.",
      "frames": [
        "/exercises/supine_pelvic_tilts.jpg"
      ]
    },
    {
      "title": "Supine Single Knee-to-Chest Hug",
      "duration": 150,
      "cue": "Hug right knee, then left, gently decompressing lower lumbar facet joints without strain.",
      "frames": [
        "/exercises/knee_to_chest_stretch.jpg"
      ]
    },
    {
      "title": "Wide Knee Child's Pose with Bolster",
      "duration": 150,
      "cue": "Knees wide, rest torso and cheek completely on supportive bolster, breathing into back ribs.",
      "frames": [
        "/exercises/supported_childs_pose_bolster_hud.jpg"
      ]
    },
    {
      "title": "Thread the Needle Shoulder Glide",
      "duration": 150,
      "cue": "Gentle thoracic twist on all fours, releasing tension along thoracic spine and between scapulae.",
      "frames": [
        "/exercises/thread_the_needle_hud.svg"
      ]
    },
    {
      "title": "Supported Bridge on Soft Block",
      "duration": 150,
      "cue": "Pelvis resting on low foam block, letting hip flexors open passively without glute contraction.",
      "frames": [
        "/exercises/supported_bridge_block_hud.jpg"
      ]
    },
    {
      "title": "Supine Gentle Twist with Bolster",
      "duration": 150,
      "cue": "Drop knees to side onto a bolster, keeping opposite shoulder flat for restorative spinal ease.",
      "frames": [
        "/exercises/gentle_supine_torso_twist_hud.jpg"
      ]
    },
    {
      "title": "Legs-Elevated Relaxation (Wall or Bolster)",
      "duration": 150,
      "cue": "Elevate legs up on wall or bolster to unload circulatory and lymphatic pressure before sleep.",
      "frames": [
        "/exercises/legs_elevated_relaxation_hud.svg"
      ]
    },
    {
      "title": "Corpse Pose Deep Relaxation (Savasana)",
      "duration": 150,
      "cue": "Fully supported corpse pose with eye pillow, entering deep restful restorative state.",
      "frames": [
        "/exercises/restorative_savasana.jpg"
      ]
    }
  ]
},
  // ==========================================
  // PILATES ROUTINES (p1 - p10)
  // ==========================================
  {
  "id": "p1",
  "name": "Neutral Pelvis & Transverse Abdominis Activation",
  "title": "Neutral Pelvis & Transverse Abdominis Activation",
  "category": "pilates",
  "focus_areas": [
    "pelvis",
    "transverse abdominis",
    "deep core",
    "neutral spine"
  ],
  "duration_minutes": 5,
  "intensity": "Gentle Core Re-education",
  "instruction": "Foundational clinical Pilates establishing neutral lumbopelvic alignment, sub-maximal transverse abdominis recruitment, and diaphragmatic dissociation without pelvic tucking.",
  "description": "Foundational clinical Pilates establishing neutral lumbopelvic alignment, sub-maximal transverse abdominis recruitment, and diaphragmatic dissociation without pelvic tucking.",
  "precautions": [
    "Do not tilt pelvis into excessive posterior or anterior tuck.",
    "Keep contraction sub-maximal (20-30%)."
  ],
  "contraindications": [
    "acute abdominal wall tear or hernia"
  ],
  "steps": [
    {
      "title": "Finding Neutral Spine",
      "duration": 60,
      "cue": "Lie supine hooklying. Rock pelvis between anterior and posterior tilt to settle on relaxed neutral balance.",
      "frames": [
        "/exercises/supine_pelvic_tilts.jpg"
      ]
    },
    {
      "title": "Transverse Abdominis Draw-In",
      "duration": 75,
      "cue": "Breathe out gently and draw navel toward spine by 20-30%, engaging deep corset without moving pelvis.",
      "frames": [
        "/exercises/pilates_ta_draw_in_hud.svg"
      ]
    },
    {
      "title": "Supine Heel Slides",
      "duration": 90,
      "cue": "Maintain steady neutral pelvis as one heel slides away along the mat, then slide slowly back.",
      "frames": [
        "/exercises/pilates_heel_slide_hud.svg"
      ]
    },
    {
      "title": "Restorative Pelvic Rest",
      "duration": 75,
      "cue": "Rest in constructive rest with knees resting together, allowing deep core and hip flexors to fully relax.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    }
  ]
},
{
  "id": "p2",
  "name": "Deadbug & Lumbar Control",
  "title": "Deadbug & Lumbar Control",
  "category": "pilates",
  "focus_areas": [
    "lumbar control",
    "anterior chain",
    "anti-extension",
    "coordination"
  ],
  "duration_minutes": 6,
  "intensity": "Gentle to Moderate",
  "instruction": "Progressive anti-extension loading: limb reaches while maintaining rigid neutral spine, eliminating lumbar hyperextension shear forces.",
  "description": "Progressive anti-extension loading: limb reaches while maintaining rigid neutral spine, eliminating lumbar hyperextension shear forces.",
  "precautions": [
    "Lower limb only as far as you can maintain neutral lower back.",
    "Stop if lower back arches off mat."
  ],
  "contraindications": [
    "acute spondylolisthesis grade 3+"
  ],
  "steps": [
    {
      "title": "Deadbug Level 1 (Arm Reach Only)",
      "duration": 75,
      "cue": "Feet flat on floor, reach one arm slowly overhead while keeping ribs connected and lumbar neutral.",
      "frames": [
        "/exercises/pilates_deadbug_level1_hud.svg"
      ]
    },
    {
      "title": "Deadbug Level 2 (Heel Tap Only)",
      "duration": 90,
      "cue": "Bring knees to 90/90 tabletop. Slowly lower one heel toward the mat, hinging at hip without arching back.",
      "frames": [
        "/exercises/pilates_deadbug_level2_hud.svg"
      ]
    },
    {
      "title": "Deadbug Level 3 (Opposite Arm & Leg)",
      "duration": 105,
      "cue": "Simultaneously reach opposite arm and leg away. Return smoothly, keeping spine glued to neutral.",
      "frames": [
        "/exercises/pilates_deadbug_level3_hud.svg"
      ]
    },
    {
      "title": "Knees to Chest Neutral Reset",
      "duration": 60,
      "cue": "Gently hug both knees toward chest to unload lower back and reset hip flexors.",
      "frames": [
        "/exercises/knee_to_chest_stretch.jpg"
      ]
    }
  ]
},
{
  "id": "p3",
  "name": "Quadruped Bird-Dog Stabilization",
  "title": "Quadruped Bird-Dog Stabilization",
  "category": "pilates",
  "focus_areas": [
    "multifidus",
    "glutes",
    "posterior oblique sling",
    "rotary stability"
  ],
  "duration_minutes": 5,
  "intensity": "Gentle Stabilization",
  "instruction": "McGill-validated quadruped stabilization building cross-body posterior chain endurance with zero spinal flexion.",
  "description": "McGill-validated quadruped stabilization building cross-body posterior chain endurance with zero spinal flexion.",
  "precautions": [
    "Do not lift leg above hip level to avoid lumbar extension arching.",
    "Maintain chin tuck."
  ],
  "contraindications": [
    "acute wrist fracture or carpal tunnel flare-up"
  ],
  "steps": [
    {
      "title": "Quadruped Neutral Alignment",
      "duration": 60,
      "cue": "Hands under shoulders, knees under hips. Find flat neutral spine and gently engage transverse core.",
      "frames": [
        "/exercises/pilates_birddog_tabletop_hud.svg"
      ]
    },
    {
      "title": "Bird-Dog Reach (Right Arm, Left Leg)",
      "duration": 90,
      "cue": "Reach right arm forward and left leg straight back to hip height. Hold 6s without tilting pelvis.",
      "frames": [
        "/exercises/pilates_birddog_reach_right_hud.svg"
      ]
    },
    {
      "title": "Bird-Dog Reach (Left Arm, Right Leg)",
      "duration": 90,
      "cue": "Reach left arm forward and right leg back. Keep hips parallel to floor and core braced.",
      "frames": [
        "/exercises/pilates_birddog_reach_left_hud.svg"
      ]
    },
    {
      "title": "Child's Pose Decompression",
      "duration": 60,
      "cue": "Sink hips back to heels and lengthen arms forward, resting forehead down to decompress spine.",
      "frames": [
        "/exercises/supported_childs_pose_bolster_hud.jpg"
      ]
    }
  ]
},
{
  "id": "p4",
  "name": "Side-Lying Clamshell & Glute Medius",
  "title": "Side-Lying Clamshell & Glute Medius",
  "category": "pilates",
  "focus_areas": [
    "gluteus medius",
    "hip stability",
    "pelvic level",
    "Trendelenburg control"
  ],
  "duration_minutes": 5,
  "intensity": "Gentle Isolation",
  "instruction": "Isolates the gluteus medius to stabilize the Trendelenburg sign, reducing lateral spinal sway and lumbar fatigue.",
  "description": "Isolates the gluteus medius to stabilize the Trendelenburg sign, reducing lateral spinal sway and lumbar fatigue.",
  "precautions": [
    "Do not roll top hip backwards; keep hips stacked perpendicularly.",
    "Movement is small and targeted."
  ],
  "contraindications": [
    "acute trochanteric bursitis flare-up with severe local pain"
  ],
  "steps": [
    {
      "title": "Clamshell Level 1 (Right Side)",
      "duration": 75,
      "cue": "Lie on left side with knees bent 90\u00b0, hips stacked. Rotate top right knee open keeping feet together.",
      "frames": [
        "/exercises/pilates_clamshell_right_hud.svg"
      ]
    },
    {
      "title": "Side-Lying Leg Lift (Right Side)",
      "duration": 75,
      "cue": "Extend right leg straight. Lift leg 30\u00b0 with toes angled slightly downward to target posterior glute medius.",
      "frames": [
        "/exercises/pilates_side_leg_lift_right_hud.svg"
      ]
    },
    {
      "title": "Clamshell Level 1 (Left Side)",
      "duration": 75,
      "cue": "Switch to right side. Open top left knee smoothly while keeping pelvis completely stable.",
      "frames": [
        "/exercises/pilates_clamshell_left_hud.svg"
      ]
    },
    {
      "title": "Side-Lying Leg Lift (Left Side)",
      "duration": 75,
      "cue": "Extend left leg straight, lift with control without rolling hips back.",
      "frames": [
        "/exercises/pilates_side_leg_lift_left_hud.svg"
      ]
    }
  ]
},
{
  "id": "p5",
  "name": "Glute Bridge & Hip Extension Articulation",
  "title": "Glute Bridge & Hip Extension Articulation",
  "category": "pilates",
  "focus_areas": [
    "gluteus maximus",
    "hamstrings",
    "pelvic articulation",
    "hip extension"
  ],
  "duration_minutes": 5,
  "intensity": "Gentle to Moderate",
  "instruction": "Builds posterior chain strength to support standing posture and relieve anterior pelvic tilt shear on L4-S1.",
  "description": "Builds posterior chain strength to support standing posture and relieve anterior pelvic tilt shear on L4-S1.",
  "precautions": [
    "Drive through heels and squeeze glutes; avoid arching lower back at peak."
  ],
  "contraindications": [
    "acute lumbar disc herniation with extension sensitivity"
  ],
  "steps": [
    {
      "title": "Basic Glute Bridge (Feet Flat)",
      "duration": 75,
      "cue": "Drive through heels to lift hips to knee height, squeezing glutes firmly without arching lower back.",
      "frames": [
        "/exercises/hip_glute_bridge_hud.jpg"
      ]
    },
    {
      "title": "Bridge with Pelvic Squeeze",
      "duration": 75,
      "cue": "At top of bridge, place a block or imagine squeezing knees together to recruit adductors and pelvic base.",
      "frames": [
        "/exercises/pilates_bridge_pelvic_squeeze_hud.svg"
      ]
    },
    {
      "title": "Single Leg Bridge Marching",
      "duration": 90,
      "cue": "Hold steady bridge while lifting one foot 2 inches off mat in alternating march, keeping pelvis level.",
      "frames": [
        "/exercises/pilates_bridge_marching_hud.svg"
      ]
    },
    {
      "title": "Spine Articulation Roll Down",
      "duration": 60,
      "cue": "Lower spine vertebra-by-vertebra down to mat, finishing by settling into neutral pelvis.",
      "frames": [
        "/exercises/pilates_bridge_roll_down_hud.svg"
      ]
    }
  ]
},
{
  "id": "p6",
  "name": "Pilates Hundred (Neutral Spine Adaptation)",
  "title": "Pilates Hundred (Neutral Spine Adaptation)",
  "category": "pilates",
  "focus_areas": [
    "cardiorespiratory",
    "transverse core",
    "endurance",
    "cervical safety"
  ],
  "duration_minutes": 5,
  "intensity": "Moderate Endurance",
  "instruction": "Modified Pilates classic keeping head on mat or supported, pumping arms with rhythmic staccato breathing.",
  "description": "Modified Pilates classic keeping head on mat or supported, pumping arms with rhythmic staccato breathing.",
  "precautions": [
    "Head stays grounded if cervical fusion/strain is present.",
    "Breathe through diaphragm, not chest."
  ],
  "contraindications": [
    "uncontrolled hypertension"
  ],
  "steps": [
    {
      "title": "Arm Pump Preparation",
      "duration": 60,
      "cue": "Lie supine with knees in tabletop, head resting comfortably on mat. Hover arms 2 inches off floor.",
      "frames": [
        "/exercises/pilates_hundred_prep_hud.svg"
      ]
    },
    {
      "title": "The Hundred: Set 1-50",
      "duration": 75,
      "cue": "Pump arms vigorously with inhale for 5 counts and exhale for 5 counts, keeping core engaged.",
      "frames": [
        "/exercises/pilates_hundred_pulse_hud.svg"
      ]
    },
    {
      "title": "The Hundred: Set 51-100",
      "duration": 75,
      "cue": "Maintain rhythmic arm pulses and controlled breathing, keeping lower back anchored in neutral.",
      "frames": [
        "/exercises/pilates_hundred_endurance_hud.svg"
      ]
    },
    {
      "title": "Full Body Stretch Release",
      "duration": 60,
      "cue": "Extend arms overhead and legs long on mat, taking deep diaphragmatic breaths to release core.",
      "frames": [
        "/exercises/restorative_savasana.jpg"
      ]
    }
  ]
},
{
  "id": "p7",
  "name": "Spine Twist & Thoracic Mobility",
  "title": "Spine Twist & Thoracic Mobility",
  "category": "pilates",
  "focus_areas": [
    "thoracic rotation",
    "ribcage",
    "obliques",
    "seated mobility"
  ],
  "duration_minutes": 5,
  "intensity": "Gentle Rotational",
  "instruction": "Seated or side-lying rotational mobility targeting the thoracic spine while locking the lumbar spine in neutral.",
  "description": "Seated or side-lying rotational mobility targeting the thoracic spine while locking the lumbar spine in neutral.",
  "precautions": [
    "Rotation comes purely from ribs/chest, not twisting lower back."
  ],
  "contraindications": [
    "acute rib fracture or costochondritis flare-up"
  ],
  "steps": [
    {
      "title": "Seated Spine Twist with Ball",
      "duration": 75,
      "cue": "Sit tall holding ball at chest. Rotate ribcage smoothly left and right, keeping pelvis anchored.",
      "frames": [
        "/exercises/pilates_seated_spine_twist_hud.svg"
      ]
    },
    {
      "title": "Side-Lying Pinwheel Arm Flow (Right)",
      "duration": 75,
      "cue": "Lie on left side with knees bent. Sweep right arm in a wide circular arc overhead and open to side.",
      "frames": [
        "/exercises/open_book_right_hud.svg"
      ]
    },
    {
      "title": "Opposite Side Pinwheel (Left)",
      "duration": 75,
      "cue": "Lie on right side. Sweep left arm overhead and across in full circle, following with relaxed gaze.",
      "frames": [
        "/exercises/open_book_left_hud.svg"
      ]
    },
    {
      "title": "Restorative Relaxation Breath",
      "duration": 60,
      "cue": "Rest in constructive rest, allowing thoracic spine and shoulders to soften into mat.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    }
  ]
},
{
  "id": "p8",
  "name": "Single Leg Stretch & Core Control",
  "title": "Single Leg Stretch & Core Control",
  "category": "pilates",
  "focus_areas": [
    "anterior chain",
    "hip disassociation",
    "lumbar control",
    "hip flexors"
  ],
  "duration_minutes": 5,
  "intensity": "Moderate",
  "instruction": "Alternating leg reach with hands guiding knee, demanding high lumbar-pelvic stabilization under dynamic load.",
  "description": "Alternating leg reach with hands guiding knee, demanding high lumbar-pelvic stabilization under dynamic load.",
  "precautions": [
    "Keep head down if experiencing neck fatigue.",
    "Reach extended leg at 45\u00b0 to reduce shear."
  ],
  "contraindications": [
    "acute inguinal hernia"
  ],
  "steps": [
    {
      "title": "Single Leg Stretch (Head Down)",
      "duration": 75,
      "cue": "Head grounded. Hug right knee toward chest while extending left leg 45\u00b0 off mat. Hold with neutral core.",
      "frames": [
        "/exercises/pilates_single_leg_stretch_hud.svg"
      ]
    },
    {
      "title": "Double Leg Tap Adaptation",
      "duration": 75,
      "cue": "Both knees in tabletop. Lower both toes toward mat together from hips, stopping before back arches.",
      "frames": [
        "/exercises/pilates_double_leg_tap_hud.svg"
      ]
    },
    {
      "title": "Single Leg Stretch Set 2",
      "duration": 90,
      "cue": "Switch sides dynamically, reaching one leg long as opposite knee draws in with smooth breathing.",
      "frames": [
        "/exercises/pilates_single_leg_alternation_hud.svg"
      ]
    },
    {
      "title": "Knees to Chest Reset",
      "duration": 60,
      "cue": "Hug both knees comfortably toward chest to restore neutral lower back curve.",
      "frames": [
        "/exercises/knee_to_chest_stretch.jpg"
      ]
    }
  ]
},
{
  "id": "p9",
  "name": "Shoulder Bridge & Articulation",
  "title": "Shoulder Bridge & Articulation",
  "category": "pilates",
  "focus_areas": [
    "spinal articulation",
    "hamstrings",
    "glutes",
    "thoracic extension"
  ],
  "duration_minutes": 5,
  "intensity": "Gentle Articulation",
  "instruction": "Segmental rolling of the spine up and down off the mat, improving intervertebral mobility and proprioception.",
  "description": "Segmental rolling of the spine up and down off the mat, improving intervertebral mobility and proprioception.",
  "precautions": [
    "Weight stays on shoulder blades, never pressing into cervical neck."
  ],
  "contraindications": [
    "cervical spine instability or acute anterior cervical fusion"
  ],
  "steps": [
    {
      "title": "Pelvic Curl Preparation",
      "duration": 60,
      "cue": "Inhale prepare, exhale imprint lower back and peel sacrum slightly off mat, warming segmental spine.",
      "frames": [
        "/exercises/supine_pelvic_tilts.jpg"
      ]
    },
    {
      "title": "Full Segmental Bridge Roll",
      "duration": 75,
      "cue": "Roll spine up to bridge one vertebra at a time until hips and knees form a straight line.",
      "frames": [
        "/exercises/hip_glute_bridge_hud.jpg"
      ]
    },
    {
      "title": "Bridge with Arm Reaches",
      "duration": 75,
      "cue": "Hold top of bridge, float arms overhead to floor, then slowly roll spine down before lowering arms.",
      "frames": [
        "/exercises/pilates_bridge_overhead_reach_hud.svg"
      ]
    },
    {
      "title": "Supine Rest",
      "duration": 60,
      "cue": "Rest flat on back with knees bent and feet wide, letting lumbar spine decompress completely.",
      "frames": [
        "/exercises/constructive_rest_bolster_hud.jpg"
      ]
    }
  ]
},
{
  "id": "p10",
  "name": "Swimming & Posterior Chain Endurance",
  "title": "Swimming & Posterior Chain Endurance",
  "category": "pilates",
  "focus_areas": [
    "posterior chain",
    "erector spinae",
    "glutes",
    "scapula",
    "prone endurance"
  ],
  "duration_minutes": 5,
  "intensity": "Gentle Endurance",
  "instruction": "Prone alternating arm and leg fluttering with pillow under pelvis to strengthen extensor muscles safely.",
  "description": "Prone alternating arm and leg fluttering with pillow under pelvis to strengthen extensor muscles safely.",
  "precautions": [
    "Place small pillow under lower abdomen/pelvis to prevent hyperextension."
  ],
  "contraindications": [
    "active abdominal surgical incision"
  ],
  "steps": [
    {
      "title": "Prone Arm Float Only",
      "duration": 60,
      "cue": "Lie prone with pillow under pelvis. Lift alternating arms 2 inches off mat, keeping forehead grounded.",
      "frames": [
        "/exercises/pilates_swimming_arm_float_hud.svg"
      ]
    },
    {
      "title": "Prone Leg Float Only",
      "duration": 60,
      "cue": "Rest forehead on hands. Squeeze glute to float one leg straight off mat without arching lumbar spine.",
      "frames": [
        "/exercises/pilates_swimming_leg_float_hud.svg"
      ]
    },
    {
      "title": "Slow Swimming Flutter",
      "duration": 90,
      "cue": "Simultaneously float right arm and left leg, then switch in slow, controlled rhythm.",
      "frames": [
        "/exercises/pilates_swimming_contralateral_hud.svg"
      ]
    },
    {
      "title": "Prone Relaxation & Breath",
      "duration": 60,
      "cue": "Rest in supported sphinx or child's pose, breathing deeply into lower back to release all tension.",
      "frames": [
        "/exercises/supported_childs_pose_bolster_hud.jpg"
      ]
    }
  ]
},
  // ==========================================
  // STRETCHES ROUTINES (s1 - s10)
  // ==========================================
  {
    id: "s1",
    name: "Piriformis & Deep Glute Stretch",
    title: "Piriformis & Deep Glute Stretch",
    category: "stretches",
    focus_areas: ["glutes","piriformis","sciatic_nerve","hips"],
    duration_minutes: 12,
    intensity: "Gentle Restorative",
    instruction: "Relieves piriformis spasm and sciatic nerve entrapment through supine figure-4 and seated chair variants.",
    description: "Relieves piriformis spasm and sciatic nerve entrapment through supine figure-4 and seated chair variants.",
    precautions: [
      "Avoid forcing knee toward opposite shoulder if hip impingement or labral symptoms occur. Keep neck relaxed."
    ],
    contraindications: ["Acute severe sciatica with motor deficit","Recent hip replacement"],
    steps: [
      {
        title: "Supine Figure-4 (Right)",
        duration: 180,
        cue: "Cross right ankle over left thigh, reach through and draw left leg in toward chest. Relax shoulders.",
        frames: ["/exercises/hip_figure_four_right_hud.svg"]
      },
      {
        title: "Supine Figure-4 (Left)",
        duration: 180,
        cue: "Cross left ankle over right knee, clasp behind right hamstring, drawing leg toward chest.",
        frames: ["/exercises/hip_figure_four_left_hud.svg"]
      },
      {
        title: "Seated Chair Glute Stretch",
        duration: 180,
        cue: "Sit tall on chair edge, cross ankle over knee, hinge forward from hips with flat spine.",
        frames: ["/exercises/chair_seated_figure_four_right_hud.svg"]
      },
      {
        title: "Constructive Rest & Pelvic Release",
        duration: 180,
        cue: "Rest knees together or draped over bolster, letting pelvic floor and gluteal tension release completely.",
        frames: ["/exercises/constructive_rest_bolster_hud.jpg"]
      }
    ]
  },

    {
    id: "s2",
    name: "Cervical Scalene & Upper Trap Release",
    title: "Cervical Scalene & Upper Trap Release",
    category: "stretches",
    focus_areas: ["neck","scalenes","levator_scapulae","upper_trapezius"],
    duration_minutes: 10,
    intensity: "Gentle Restorative",
    instruction: "Gentle targeted releases for the anterior scalenes and levator scapulae to ease tension headaches and thoracic outlet tightness.",
    description: "Gentle targeted releases for the anterior scalenes and levator scapulae to ease tension headaches and thoracic outlet tightness.",
    precautions: [
      "Never pull or yank the head. Use only the weight of your hand for gentle overpressure."
    ],
    contraindications: ["Vertebrobasilar insufficiency","Acute cervical radiculopathy"],
    steps: [
      {
        title: "Scalene Anterior Stretch (Right)",
        duration: 150,
        cue: "Tilt head gently to right, rotate chin 15 degrees upward to feel stretch along the left anterior neck.",
        frames: ["/exercises/cervical_scalene_right_hud.svg"]
      },
      {
        title: "Levator Scapulae 'Nose to Armpit'",
        duration: 150,
        cue: "Turn head 45 degrees to right, gently drop chin toward right armpit feeling postero-lateral neck stretch.",
        frames: ["/exercises/levator_scapulae_stretch_hud.svg"]
      },
      {
        title: "Scalene Anterior Stretch (Left)",
        duration: 150,
        cue: "Tilt head gently to left, rotate chin 15 degrees upward to elongate the right anterior scalene.",
        frames: ["/exercises/cervical_scalene_left_hud.svg"]
      },
      {
        title: "Suboccipital Nod Release",
        duration: 150,
        cue: "Perform tiny nodding motions at skull base like saying 'yes' without flexing your lower neck.",
        frames: ["/exercises/suboccipital_nod_release_hud.svg"]
      }
    ]
  },

    {
    id: "s3",
    name: "Hamstring Doorframe Decompression",
    title: "Hamstring Doorframe Decompression",
    category: "stretches",
    focus_areas: ["hamstrings","sciatic_nerve","pelvis","lumbar"],
    duration_minutes: 15,
    intensity: "Gentle Restorative",
    instruction: "Doorframe or wall-assisted hamstring lengthening that protects the lower back by supporting the pelvis flat on the floor.",
    description: "Doorframe or wall-assisted hamstring lengthening that protects the lower back by supporting the pelvis flat on the floor.",
    precautions: [
      "Keep pelvis flat on floor. Do not allow lower back to peel or curl off the mat."
    ],
    contraindications: ["Acute hamstring tear","Acute disc herniation in flexion"],
    steps: [
      {
        title: "Doorframe Stretch (Right Leg)",
        duration: 225,
        cue: "Right leg extended up doorframe, left leg flat on floor through doorway. Breathe deeply with pelvis level.",
        frames: ["/exercises/doorframe_hamstring_right_hud.svg"]
      },
      {
        title: "Doorframe Stretch (Left Leg)",
        duration: 225,
        cue: "Switch sides. Left leg up frame, right leg flat along floor. Relax hips and sacrum flat against mat.",
        frames: ["/exercises/doorframe_hamstring_left_hud.svg"]
      },
      {
        title: "Doorframe Sciatic Floss",
        duration: 225,
        cue: "Point and flex toes rhythmically while leg is elevated to gently glide the sciatic pathway without strain.",
        frames: ["/exercises/doorframe_ankle_pumps_hud.svg"]
      },
      {
        title: "Supine Rest & Neural Reset",
        duration: 225,
        cue: "Lower both legs down, resting pelvis in complete neutral with smooth diaphragmatic breaths.",
        frames: ["/exercises/restorative_savasana.jpg"]
      }
    ]
  },

    {
    id: "s4",
    name: "Thoracic Open Book Mobility",
    title: "Thoracic Open Book Mobility",
    category: "stretches",
    focus_areas: ["thoracic_spine","ribcage","pectorals","shoulders"],
    duration_minutes: 12,
    intensity: "Adaptive Mobility",
    instruction: "Side-lying rotational stretch to restore thoracic rotation and expand ribcage volume without stressing the lumbar spine.",
    description: "Side-lying rotational stretch to restore thoracic rotation and expand ribcage volume without stressing the lumbar spine.",
    precautions: [
      "Keep knees clamped together to lock out lumbar rotation and isolate thoracic mobility."
    ],
    contraindications: ["Severe osteoporotic thoracic compression fracture","Acute rib fracture"],
    steps: [
      {
        title: "Open Book Dynamic Rotation (Right)",
        duration: 180,
        cue: "Side-lying on left with knees stacked at 90 degrees. Sweep right arm in a wide arc open across body.",
        frames: ["/exercises/open_book_right_hud.svg"]
      },
      {
        title: "Open Book Static Hold (Right)",
        duration: 180,
        cue: "Hold right arm open at end-range, breathing deeply into right rib cage while keeping knees pinned together.",
        frames: ["/exercises/open_book_static_hold_right_hud.svg"]
      },
      {
        title: "Open Book Dynamic Rotation (Left)",
        duration: 180,
        cue: "Lie on right side with knees stacked. Sweep left arm open across body, tracking thumb with eyes.",
        frames: ["/exercises/open_book_left_hud.svg"]
      },
      {
        title: "Open Book Static Hold (Left)",
        duration: 180,
        cue: "Hold left arm open at end-range for sustained lateral expansion and ribcage ventilation.",
        frames: ["/exercises/open_book_static_hold_left_hud.svg"]
      }
    ]
  },

    {
    id: "s5",
    name: "Gastrocnemius & Soleus Calf Stretch",
    title: "Gastrocnemius & Soleus Calf Stretch",
    category: "stretches",
    focus_areas: ["calves","gastrocnemius","soleus","achilles","ankles"],
    duration_minutes: 10,
    intensity: "Adaptive Mobility",
    instruction: "Wall and step calf stretches to restore dorsiflexion, improving walking gait mechanics and offloading lumbar compensation.",
    description: "Wall and step calf stretches to restore dorsiflexion, improving walking gait mechanics and offloading lumbar compensation.",
    precautions: [
      "Keep rear heel firmly glued to floor and toes pointing straight forward, not splayed out."
    ],
    contraindications: ["Acute Achilles tendon rupture","Severe calf strain"],
    steps: [
      {
        title: "Straight-Leg Gastrocnemius (Right)",
        duration: 150,
        cue: "Hands against wall, step right leg straight back, press heel into floor with kneecap lifted.",
        frames: ["/exercises/wall_calf_gastroc_right_hud.svg"]
      },
      {
        title: "Bent-Knee Soleus (Right)",
        duration: 150,
        cue: "Softly bend right back knee 20 degrees while keeping heel pinned down to isolate the deeper soleus.",
        frames: ["/exercises/wall_calf_soleus_right_hud.svg"]
      },
      {
        title: "Straight-Leg Gastrocnemius (Left)",
        duration: 150,
        cue: "Step left leg straight back, driving heel firmly down into floor with toes aligned forward.",
        frames: ["/exercises/wall_calf_gastroc_left_hud.svg"]
      },
      {
        title: "Bent-Knee Soleus (Left)",
        duration: 150,
        cue: "Bend back left knee slightly, keeping heel anchored to shift stretch into lower Achilles.",
        frames: ["/exercises/wall_calf_soleus_left_hud.svg"]
      }
    ]
  },

    {
    id: "s6",
    name: "Quadriceps & Rectus Femoris Wall Stretch",
    title: "Quadriceps & Rectus Femoris Wall Stretch",
    category: "stretches",
    focus_areas: ["quadriceps","rectus_femoris","hip_flexors","knees"],
    duration_minutes: 12,
    intensity: "Adaptive Mobility",
    instruction: "Standing or side-lying quad stretch that lengthens the two-joint rectus femoris muscle without knee hyperextension.",
    description: "Standing or side-lying quad stretch that lengthens the two-joint rectus femoris muscle without knee hyperextension.",
    precautions: [
      "Avoid overarching the lumbar spine. Engage core gently and tuck pelvis to protect lower back."
    ],
    contraindications: ["Patellar subluxation","Severe meniscus tear in deep flexion"],
    steps: [
      {
        title: "Side-Lying Quad Stretch (Right)",
        duration: 180,
        cue: "Lie on left side, grasp right ankle with right hand, gently draw heel toward glute with knees together.",
        frames: ["/exercises/side_lying_quad_right_hud.svg"]
      },
      {
        title: "Side-Lying Quad Stretch (Left)",
        duration: 180,
        cue: "Switch sides, lie on right side, draw left heel back toward glute keeping pelvis tucked neutral.",
        frames: ["/exercises/side_lying_quad_left_hud.svg"]
      },
      {
        title: "Prone Quad Stretch with Strap",
        duration: 180,
        cue: "Lie prone, loop strap around ankle if reaching is difficult, gently drawing heel toward glute.",
        frames: ["/exercises/prone_quad_strap_hud.svg"]
      },
      {
        title: "Prone Hip Rocking Reset",
        duration: 180,
        cue: "Lie face down and gently rock hips side-to-side to release hip flexor and lumbar tension.",
        frames: ["/exercises/prone_hip_rocking_hud.svg"]
      }
    ]
  },

    {
    id: "s7",
    name: "Latissimus Dorsi & Side Body Opener",
    title: "Latissimus Dorsi & Side Body Opener",
    category: "stretches",
    focus_areas: ["latissimus_dorsi","thoracolumbar_fascia","intercostals","shoulders"],
    duration_minutes: 12,
    intensity: "Adaptive Mobility",
    instruction: "Decompresses the thoracolumbar fascia and lateral ribcage where latissimus attachments often compress the lumbar spine.",
    description: "Decompresses the thoracolumbar fascia and lateral ribcage where latissimus attachments often compress the lumbar spine.",
    precautions: [
      "Ease out of lateral reach if any pinch is felt in anterior shoulder or hip crease."
    ],
    contraindications: ["Subacromial impingement with severe sharp pain","Acute shoulder dislocation"],
    steps: [
      {
        title: "Side-Reaching Child's Pose (Right)",
        duration: 180,
        cue: "From child's pose, walk both hands diagonally left, anchoring right hip back onto heel to stretch right lat.",
        frames: ["/exercises/childs_pose_side_reach_right_hud.svg"]
      },
      {
        title: "Side-Reaching Child's Pose (Left)",
        duration: 180,
        cue: "Walk hands diagonally right, keeping left hip grounded on heel, breathing into left flank.",
        frames: ["/exercises/childs_pose_side_reach_left_hud.svg"]
      },
      {
        title: "Doorframe Lat Hang Decompression",
        duration: 180,
        cue: "Grip doorframe at shoulder height, sink hips back and away to create gentle spinal and lat traction.",
        frames: ["/exercises/doorframe_lat_hang_hud.svg"]
      },
      {
        title: "Restorative Center Breath",
        duration: 180,
        cue: "Lie back in neutral, breathing 360 degrees into lateral ribcage and belly.",
        frames: ["/exercises/diaphragmatic_breathing_hud.jpg"]
      }
    ]
  },

    {
    id: "s8",
    name: "Wrist, Forearm & Median Nerve Floss",
    title: "Wrist, Forearm & Median Nerve Floss",
    category: "stretches",
    focus_areas: ["wrists","forearms","median_nerve","carpal_tunnel"],
    duration_minutes: 10,
    intensity: "Gentle Restorative",
    instruction: "Gentle wrist flexor/extensor stretches combined with median nerve glides for desk workers and typing fatigue.",
    description: "Gentle wrist flexor/extensor stretches combined with median nerve glides for desk workers and typing fatigue.",
    precautions: [
      "Never push nerve glides into pain, sharp tingling, or numbness. Keep movements smooth and oscillating."
    ],
    contraindications: ["Acute median nerve compression requiring decompression","Recent wrist fracture"],
    steps: [
      {
        title: "Wrist Flexor Stretch",
        duration: 150,
        cue: "Extend right arm forward palm outward fingers pointing down. Gently draw fingers back with opposite hand.",
        frames: ["/exercises/wrist_flexor_stretch_hud.svg"]
      },
      {
        title: "Wrist Extensor Stretch",
        duration: 150,
        cue: "Extend arm palm facing inward fingers curled down. Gently press on back of hand toward body.",
        frames: ["/exercises/wrist_extensor_stretch_hud.svg"]
      },
      {
        title: "Median Nerve Gliding Flow",
        duration: 150,
        cue: "Extend arm out to side, extend wrist back, gently tilt head to opposite side, then release in rhythmic cycles.",
        frames: ["/exercises/median_nerve_glide_hud.svg"]
      },
      {
        title: "Wrist Circles & Finger Shakes",
        duration: 150,
        cue: "Rotate wrists through smooth 360-degree circles, then shake hands and fingers out lightly.",
        frames: ["/exercises/wrist_circles_shakes_hud.svg"]
      }
    ]
  },

    {
    id: "s9",
    name: "Pectoralis Doorway & Anterior Chest Opener",
    title: "Pectoralis Doorway & Anterior Chest Opener",
    category: "stretches",
    focus_areas: ["pectorals","anterior_deltoid","thoracic_spine","shoulders"],
    duration_minutes: 10,
    intensity: "Adaptive Mobility",
    instruction: "Releases tight pectoralis major and minor muscles that pull shoulders forward into kyphotic posture.",
    description: "Releases tight pectoralis major and minor muscles that pull shoulders forward into kyphotic posture.",
    precautions: [
      "Do not hyperextend lumbar spine when stepping forward; maintain tall, stacked ribs over pelvis."
    ],
    contraindications: ["Anterior glenohumeral instability","Pectoralis tendon repair"],
    steps: [
      {
        title: "90-Degree Doorway Pec Major (Right)",
        duration: 150,
        cue: "Place right elbow and forearm against doorframe at 90 degrees. Step right foot forward until chest opens.",
        frames: ["/exercises/doorway_pec_90_right_hud.svg"]
      },
      {
        title: "120-Degree High Doorway Pec Minor (Right)",
        duration: 150,
        cue: "Raise right elbow higher to 120 degrees on frame to target deep pectoralis minor fibers.",
        frames: ["/exercises/doorway_pec_120_right_hud.svg"]
      },
      {
        title: "Doorway Pec Stretch (Left Side)",
        duration: 150,
        cue: "Repeat on left side at 90 and 120-degree angles, stepping left foot forward with relaxed neck.",
        frames: ["/exercises/doorway_pec_left_hud.svg"]
      },
      {
        title: "Scapular Rolls & Posture Reset",
        duration: 150,
        cue: "Roll shoulders up, back, and down 5-8 times, settling scapulae flat against ribcage.",
        frames: ["/exercises/shoulder_rolls_reset_hud.svg"]
      }
    ]
  },

    {
    id: "s10",
    name: "Ankle Dorsiflexion & Plantar Fascia Mobility",
    title: "Ankle Dorsiflexion & Plantar Fascia Mobility",
    category: "stretches",
    focus_areas: ["ankles","plantar_fascia","feet","tibialis_anterior"],
    duration_minutes: 10,
    intensity: "Adaptive Mobility",
    instruction: "Mobilizes the talocrural joint and rolls the plantar fascia to improve shock absorption during walking.",
    description: "Mobilizes the talocrural joint and rolls the plantar fascia to improve shock absorption during walking.",
    precautions: [
      "Avoid sharp pain on bottom of heel. Use moderate, tolerable pressure when rolling ball."
    ],
    contraindications: ["Acute severe plantar fasciitis flare","Recent ankle syndesmosis injury"],
    steps: [
      {
        title: "Half-Kneeling Ankle Rocking (Right)",
        duration: 150,
        cue: "Half-kneeling with right foot forward, drive knee forward over second toe while keeping right heel pinned flat.",
        frames: ["/exercises/ankle_rocking_half_kneeling_right_hud.svg"]
      },
      {
        title: "Half-Kneeling Ankle Rocking (Left)",
        duration: 150,
        cue: "Switch sides, driving left knee forward over toes to mobilize left ankle dorsiflexion without lifting heel.",
        frames: ["/exercises/ankle_rocking_half_kneeling_left_hud.svg"]
      },
      {
        title: "Plantar Fascia Ball Mobilization",
        duration: 150,
        cue: "Stand or sit, roll tennis ball slowly along the longitudinal arch of each foot, pausing on tight trigger points.",
        frames: ["/exercises/tennis_ball_plantar_roll_hud.svg"]
      },
      {
        title: "Seated Intrinsic Toe Spreading",
        duration: 150,
        cue: "Actively spread and fan all ten toes wide, lifting and pressing them down to activate deep foot intrinsic muscles.",
        frames: ["/exercises/seated_toe_spreading_hud.svg"]
      }
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
    focus_areas: ["lumbar spine","core","quadratus lumborum","multifidus"],
    duration_minutes: 20,
    intensity: "Stabilization",
    instruction: "The gold-standard clinical spine stabilization protocol: Modified Curl-Up, Side Bridge, and Bird-Dog for maximal stiffness with minimal load.",
    description: "The gold-standard clinical spine stabilization protocol: Modified Curl-Up, Side Bridge, and Bird-Dog for maximal stiffness with minimal load.",
    precautions: [
      "Hands stay under lumbar spine during curl-up; no spinal flexion."
    ],
    contraindications: ["Acute severe spinal fracture","Unstable disc sequestration"],
    steps: [
      {
        title: "McGill Modified Curl-Up",
        duration: 300,
        cue: "Hands under lumbar spine, one knee bent at 90°, opposite leg straight. Lift head and shoulder blades 1 inch off floor without bending neck. Hold 6s.",
        frames: ["/exercises/mcgill_curl_up_hud.svg"]
      },
      {
        title: "McGill Side Bridge (From Knees)",
        duration: 300,
        cue: "Prop onto elbow and knees, align shoulder-hip-knee in straight line, elevate pelvis. Hold 6s per repetition, alternating sides.",
        frames: ["/exercises/mcgill_side_bridge_hud.svg"]
      },
      {
        title: "McGill Quadruped Bird-Dog",
        duration: 300,
        cue: "From hands and knees, brace abdominal wall and extend opposite arm and leg parallel to floor. Hold 6s without pelvic rotation.",
        frames: ["/exercises/mcgill_bird_dog_hud.svg"]
      },
      {
        title: "Spine Decompression Rest",
        duration: 300,
        cue: "Rest back hips towards heels, chest supported on bolster or mat, relaxing lumbar paraspinals.",
        frames: ["/exercises/supported_childs_pose.jpg"]
      }
    ]
  },

    {
    id: "r2",
    name: "Sciatic Nerve Flossing Protocol",
    title: "Sciatic Nerve Flossing Protocol",
    category: "rehab",
    focus_areas: ["sciatic nerve","hamstrings","lumbar roots","dura"],
    duration_minutes: 12,
    intensity: "Gentle Restorative",
    instruction: "Neurodynamic gliding where the sciatic nerve slides smoothly through its anatomical sheath without tensioning both ends at once.",
    description: "Neurodynamic gliding where the sciatic nerve slides smoothly through its anatomical sheath without tensioning both ends at once.",
    precautions: [
      "Never pull into sharp radiating pain; flossing should be gentle and rhythmic."
    ],
    contraindications: ["Acute progressive cauda equina syndrome","Severe acute radicular inflammation"],
    steps: [
      {
        title: "Seated Sciatic Slider Setup",
        duration: 180,
        cue: "Sit upright on edge of firm chair, hands clasped behind lumbar spine, neutral pelvis, feet flat on floor.",
        frames: ["/exercises/seated_sciatic_slider_setup_hud.svg"]
      },
      {
        title: "Sciatic Slider (Right Leg)",
        duration: 180,
        cue: "Slowly extend right knee while tilting head back toward ceiling; bend knee as chin returns down toward chest. Smooth, tension-free glide.",
        frames: ["/exercises/seated_sciatic_slider_right_hud.svg"]
      },
      {
        title: "Sciatic Slider (Left Leg)",
        duration: 180,
        cue: "Slowly extend left knee while looking UP at ceiling; flex knee while looking DOWN. Never force through acute nerve pain.",
        frames: ["/exercises/seated_sciatic_slider_left_hud.svg"]
      },
      {
        title: "Supine Rest & Sensation Check",
        duration: 180,
        cue: "Lie flat on back with knees supported, observing neural calm and reduction in distal radiating symptoms.",
        frames: ["/exercises/restorative_savasana.jpg"]
      }
    ]
  },

    {
    id: "r3",
    name: "Cervical Retraction & Deep Neck Flexor Training",
    title: "Cervical Retraction & Deep Neck Flexor Training",
    category: "rehab",
    focus_areas: ["longus colli","longus capitis","cervical spine"],
    duration_minutes: 12,
    intensity: "Targeted Strengthening",
    instruction: "Low-load isometric training of the deep cervical flexors (longus colli/capitis) to restore cervical stability post-decompression.",
    description: "Low-load isometric training of the deep cervical flexors (longus colli/capitis) to restore cervical stability post-decompression.",
    precautions: [
      "Do not use sternocleidomastoid (front surface muscles); keep jaw relaxed."
    ],
    contraindications: ["Unstable cervical spine","Vertebral artery insufficiency"],
    steps: [
      {
        title: "Supine Chin Tuck (Cranial Nod)",
        duration: 180,
        cue: "Lie supine with small head towel. Gently nod chin as if rotating around ears, flattening back of neck toward floor without firing SCM.",
        frames: ["/exercises/supine_chin_tuck_nod_hud.svg"]
      },
      {
        title: "Supine Chin Tuck with 5s Hold",
        duration: 180,
        cue: "Perform gentle cranial nod, hold isometric contraction for 5 seconds while breathing through nose, then relax slowly.",
        frames: ["/exercises/supine_chin_tuck_hold_hud.svg"]
      },
      {
        title: "Wall Retraction with Foam Roller",
        duration: 180,
        cue: "Stand back against wall with soft ball or towel behind occiput. Gently press head straight back into support without tilting chin up.",
        frames: ["/exercises/wall_cervical_retraction_hud.svg"]
      },
      {
        title: "Postural Breathing Reset",
        duration: 180,
        cue: "Sit tall with crown reaching toward ceiling, shoulders dropped, ribs expanding laterally on each nasal inhale.",
        frames: ["/exercises/diaphragmatic_breathing_hud.jpg"]
      }
    ]
  },

    {
    id: "r4",
    name: "Scapular Wall Slides & Serratus Activation",
    title: "Scapular Wall Slides & Serratus Activation",
    category: "rehab",
    focus_areas: ["serratus anterior","lower trapezius","scapula","thoracic"],
    duration_minutes: 15,
    intensity: "Targeted Strengthening",
    instruction: "Activates serratus anterior upward rotation of the scapula to prevent subacromial impingement and relieve upper trapezius spasm.",
    description: "Activates serratus anterior upward rotation of the scapula to prevent subacromial impingement and relieve upper trapezius spasm.",
    precautions: [
      "Keep forearms glued to wall and ribs tucked down."
    ],
    contraindications: ["Acute acromioclavicular dislocation","Severe acute rotator cuff tear"],
    steps: [
      {
        title: "Forearm Wall Slide Setup",
        duration: 225,
        cue: "Forearms vertical on wall at shoulder width, elbows bent 90°, slight abdominal brace with neutral lumbar spine.",
        frames: ["/exercises/scapular_wall_slide_setup_hud.svg"]
      },
      {
        title: "Wall Slide Upward Sweep",
        duration: 225,
        cue: "Slide forearms smoothly upward in a shallow 'V' shape, maintaining constant wall contact and upward scapular rotation.",
        frames: ["/exercises/scapular_wall_slide_upward_hud.svg"]
      },
      {
        title: "Scapular Protraction Push-Plus (Wall)",
        duration: 225,
        cue: "Hands flat on wall at shoulder height. Push chest away from wall, broadening across shoulder blades without shrugging.",
        frames: ["/exercises/scapular_push_plus_wall_hud.svg"]
      },
      {
        title: "Shoulder Roll Down",
        duration: 225,
        cue: "Roll shoulders up, back, and smoothly down, releasing upper trapezius and levator tension.",
        frames: ["/exercises/shoulder_rolls_reset_hud.svg"]
      }
    ]
  },

    {
    id: "r5",
    name: "Thoracic Outlet Syndrome Neuro-Mobility",
    title: "Thoracic Outlet Syndrome Neuro-Mobility",
    category: "rehab",
    focus_areas: ["brachial plexus","first rib","pectoralis minor","scalenes"],
    duration_minutes: 12,
    intensity: "Gentle Restorative",
    instruction: "Decompresses the costoclavicular space and brachial plexus bundle to relieve hand numbness and forearm tingling.",
    description: "Decompresses the costoclavicular space and brachial plexus bundle to relieve hand numbness and forearm tingling.",
    precautions: [
      "Do not stretch into tingling sensations; stay within comfortable boundaries."
    ],
    contraindications: ["Subclavian artery thrombosis","Severe vascular TOS needing surgery"],
    steps: [
      {
        title: "First Rib Self-Depression with Strap",
        duration: 180,
        cue: "Loop soft strap over right first rib / clavicular junction, pulling downward toward opposite hip while gently tilting head away.",
        frames: ["/exercises/first_rib_depression_strap_hud.svg"]
      },
      {
        title: "Brachial Plexus Tension-Free Glide",
        duration: 180,
        cue: "Extend right arm laterally at 90°, bend wrist backward as head tilts towards arm, release wrist as head tilts away. Smooth glide.",
        frames: ["/exercises/brachial_plexus_glide_hud.svg"]
      },
      {
        title: "Opposite Side TOS Release",
        duration: 180,
        cue: "Perform strap depression and tension-free neuro-mobilization on left side, keeping breathing smooth and effortless.",
        frames: ["/exercises/brachial_plexus_glide_left_hud.svg"]
      },
      {
        title: "Diaphragmatic Rib Expansion",
        duration: 180,
        cue: "Place hands on lateral lower rib cage. Inhale through nose expanding ribs sideways, avoiding clavicular elevation.",
        frames: ["/exercises/diaphragmatic_breathing_hud.jpg"]
      }
    ]
  },

    {
    id: "r6",
    name: "Isometric Cervical Strengthening",
    title: "Isometric Cervical Strengthening",
    category: "rehab",
    focus_areas: ["cervical spine","neck extensors","neck rotators"],
    duration_minutes: 12,
    intensity: "Targeted Strengthening",
    instruction: "Zero-movement isometric contractions against palm resistance to build cervical stability without joint shear.",
    description: "Zero-movement isometric contractions against palm resistance to build cervical stability without joint shear.",
    precautions: [
      "Apply only 20-30% of maximum force; never strain."
    ],
    contraindications: ["Acute atlantoaxial instability","Recent cervical fusion (< 6 weeks)"],
    steps: [
      {
        title: "Isometric Cervical Flexion",
        duration: 180,
        cue: "Place palm against forehead. Press head forward into palm at 20-30% effort with zero cervical movement. Hold 6s.",
        frames: ["/exercises/isometric_cervical_flexion_hud.svg"]
      },
      {
        title: "Isometric Cervical Extension",
        duration: 180,
        cue: "Clasp hands behind occiput. Press head straight back into hands at gentle 20-30% resistance without tilting. Hold 6s.",
        frames: ["/exercises/isometric_cervical_extension_hud.svg"]
      },
      {
        title: "Isometric Lateral Flexion (Left & Right)",
        duration: 180,
        cue: "Place palm flat against side of head above ear. Gently resist side-bending for 6s. Repeat on opposite side.",
        frames: ["/exercises/isometric_cervical_lateral_hud.svg"]
      },
      {
        title: "Restorative Alignment Rest",
        duration: 180,
        cue: "Rest supine with knees bent over bolster, jaw unhinged, cervical spine neutral, relaxing paraspinals.",
        frames: ["/exercises/constructive_rest_bolster_hud.jpg"]
      }
    ]
  },

    {
    id: "h1",
    name: "Hydrotherapy Buoyancy Spinal Decompression",
    title: "Hydrotherapy Buoyancy Spinal Decompression",
    category: "hydrotherapy",
    focus_areas: ["lumbar","cervical","spine","water buoyancy"],
    duration_minutes: 25,
    intensity: "Decompression",
    instruction: "Warm water (34°C) buoyancy protocol offloading up to 90% of gravity compression on spinal discs and facet joints.",
    description: "Warm water (34°C) buoyancy protocol offloading up to 90% of gravity compression on spinal discs and facet joints.",
    precautions: [
      "Use pool noodles or buoyancy belt for effortless floating."
    ],
    contraindications: ["Open surgical wounds","Active systemic fever or infection"],
    steps: [
      {
        title: "Buoyant Vertical Traction",
        duration: 375,
        cue: "Place pool noodle under armpits in chest-deep to deep water, allowing pelvis and lower limbs to hang weightlessly in zero-gravity traction.",
        frames: ["/exercises/hydro_vertical_traction_hud.svg"]
      },
      {
        title: "Gentle Water Knee-to-Chest",
        duration: 375,
        cue: "Supported by buoyancy, slowly draw knees upward toward chest, allowing warm water buoyancy to gently open lumbar facet joints.",
        frames: ["/exercises/hydro_knee_to_chest_hud.svg"]
      },
      {
        title: "Aquatic Torso Pendulum",
        duration: 375,
        cue: "Gently sway submerged legs side to side in slow pendulum motion, offloading spinal compression with hydrodynamic fluid support.",
        frames: ["/exercises/hydro_torso_pendulum_hud.svg"]
      },
      {
        title: "Supine Water Float with Head Support",
        duration: 375,
        cue: "Rest in full supine float supported by cervical float and waist noodle, surrendering completely to warm water sensory calm.",
        frames: ["/exercises/hydro_supine_float_hud.svg"]
      }
    ]
  },

    {
    id: "h2",
    name: "Aquatic Multi-Planar Gait & Walking",
    title: "Aquatic Multi-Planar Gait & Walking",
    category: "hydrotherapy",
    focus_areas: ["gait","hip flexors","glutes","balance"],
    duration_minutes: 20,
    intensity: "Adaptive Mobility",
    instruction: "Chest-deep water walking forward, backward, and sideways to retrain normal gait patterns without joint impact.",
    description: "Chest-deep water walking forward, backward, and sideways to retrain normal gait patterns without joint impact.",
    precautions: [
      "Maintain upright posture; do not lean forward against water resistance."
    ],
    contraindications: ["Severe cardiac decompensation","Uncontrolled seizures"],
    steps: [
      {
        title: "Forward Water Marching",
        duration: 300,
        cue: "Chest-deep water: March forward with deliberate high-knee gait and reciprocal arm drive against buoyant water drag.",
        frames: ["/exercises/hydro_forward_walking_hud.svg"]
      },
      {
        title: "Retro (Backward) Water Walking",
        duration: 300,
        cue: "Walk backward toe-to-heel in water with upright spine, activating gluteals and posterior chain without joint compression.",
        frames: ["/exercises/hydro_retro_walking_hud.svg"]
      },
      {
        title: "Lateral Sidestepping",
        duration: 300,
        cue: "Step sideways along pool lane leading with outer foot, engaging gluteus medius stabilizers against hydrostatic drag.",
        frames: ["/exercises/hydro_lateral_stepping_hud.svg"]
      },
      {
        title: "Rail-Assisted Calf Pumps in Water",
        duration: 300,
        cue: "Hold pool gutter or rail, rise up onto balls of feet and slowly lower heels down, using water pressure to boost venous return.",
        frames: ["/exercises/hydro_rail_calf_pumps_hud.svg"]
      }
    ]
  },

    {
    id: "h3",
    name: "Aquatic Hip & Core Stabilization",
    title: "Aquatic Hip & Core Stabilization",
    category: "hydrotherapy",
    focus_areas: ["glutes","hip abductors","core","pelvis"],
    duration_minutes: 20,
    intensity: "Targeted Strengthening",
    instruction: "Water resistance exercises using kickboards and noodles to strengthen core and hips in a low-impact environment.",
    description: "Water resistance exercises using kickboards and noodles to strengthen core and hips in a low-impact environment.",
    precautions: [
      "Move at a steady controlled speed; water resistance increases with speed."
    ],
    contraindications: ["Recent acute hernia surgery","Severe balance loss without therapist in water"],
    steps: [
      {
        title: "Pool Noodle Bicycle Pedaling",
        duration: 300,
        cue: "Support upper body on two noodles under arms, pedal legs smoothly in continuous fluid cycling circles, bracing deep core.",
        frames: ["/exercises/hydro_noodle_bicycle_hud.svg"]
      },
      {
        title: "Single-Leg Balance with Hydrofoil Paddle",
        duration: 300,
        cue: "Stand on one foot in waist-to-chest water, hold kickboard or paddle submerged, stabilizing core against water eddies.",
        frames: ["/exercises/hydro_single_leg_balance_hud.svg"]
      },
      {
        title: "Wall-Supported Scissor Kicks",
        duration: 300,
        cue: "Rest back against pool edge with forearms on deck, extend legs horizontally in water and perform gentle alternating scissor kicks.",
        frames: ["/exercises/hydro_wall_scissor_kicks_hud.svg"]
      },
      {
        title: "Supported Prone Water Glide",
        duration: 300,
        cue: "Hold kickboard out in front with arms extended, glide effortlessly through warm water with gentle flutter kicks.",
        frames: ["/exercises/hydro_prone_water_glide_hud.svg"]
      }
    ]
  },

    {
    id: "h4",
    name: "Warm Water Relaxation & Lymphatic Flush",
    title: "Warm Water Relaxation & Lymphatic Flush",
    category: "hydrotherapy",
    focus_areas: ["lymphatic drainage","edema","nervous system","circulation"],
    duration_minutes: 20,
    intensity: "Decompression",
    instruction: "Leverages hydrostatic pressure to drive fluid return, clear metabolic waste, and reduce post-surgical swelling.",
    description: "Leverages hydrostatic pressure to drive fluid return, clear metabolic waste, and reduce post-surgical swelling.",
    precautions: [
      "Hydrate with water before and after pool session."
    ],
    contraindications: ["Active skin lesion or dermatitis","Chlorine sensitivity flare"],
    steps: [
      {
        title: "Submerged Torso Rotations",
        duration: 300,
        cue: "Stand in chest-deep water with feet wide. Slowly rotate torso and sweep submerged hands through water like fluid Tai Chi.",
        frames: ["/exercises/hydro_submerged_torso_rotations_hud.svg"]
      },
      {
        title: "Submerged Banded Hip Abduction",
        duration: 300,
        cue: "Hold pool rail, sweep leg outward into water resistance with hydro cuff or band, engaging hip abductors and rotators.",
        frames: ["/exercises/hydro_banded_hip_abduction_hud.svg"]
      },
      {
        title: "Rail-Supported Squat Mobilization",
        duration: 300,
        cue: "Hold pool gutter, sit hips back into buoyant squat, using water lift to achieve deep hip/knee flexion without joint loading.",
        frames: ["/exercises/hydro_rail_squat_hud.svg"]
      },
      {
        title: "Deep Relaxation Water Float",
        duration: 300,
        cue: "Floating supine with flotation rings, eyes closed, breathing rhythmically with pool temperature soothing peripheral nerves.",
        frames: ["/exercises/hydro_deep_relaxation_float_hud.svg"]
      }
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
