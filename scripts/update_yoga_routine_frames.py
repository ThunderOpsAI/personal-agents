import re

with open("dashboard/lib/exercise-db.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Exact mapping for every step of y1-y10
mapping = {
    ("y1", "Supine Pelvic Tilts"): "/exercises/supine_pelvic_tilts.jpg",
    ("y1", "Supported Child's Pose"): "/exercises/supported_childs_pose.jpg",
    ("y1", "Supine Single Knee-to-Chest"): "/exercises/knee_to_chest_stretch.jpg",
    ("y1", "Restorative Savasana with Bolster"): "/exercises/restorative_savasana.jpg",

    ("y2", "Seated Axial Retraction"): "/exercises/cervical_chin_tuck.jpg",
    ("y2", "Gentle Lateral Ear-to-Shoulder"): "/exercises/cervical_lateral_ear_shoulder.jpg",
    ("y2", "Shoulder Shrug & Release"): "/exercises/cervical_shoulder_shrug.jpg",
    ("y2", "Restorative Alignment Breathing"): "/exercises/diaphragmatic-breathing.svg",

    ("y3", "Supported Reclined Bound Angle"): "/exercises/constructive-rest.svg",
    ("y3", "Gentle Cat-Cow Spine Wave"): "/exercises/core_cat_cow.jpg",
    ("y3", "Supported Gentle Sphinx"): "/exercises/supported-sphinx-micro-lifts.svg",
    ("y3", "Legs Up the Wall Relaxation"): "/exercises/legs-elevated-relaxation.svg",

    ("y4", "Thread the Needle"): "/exercises/thoracic_thread_needle.jpg",
    ("y4", "Puppy Pose Thoracic Stretch"): "/exercises/supported_childs_pose.jpg",
    ("y4", "Seated Cactus Arm Openers"): "/exercises/thoracic_cactus_expansion.jpg",
    ("y4", "Scapular Retraction & Rest"): "/exercises/constructive-rest.svg",

    ("y5", "Low Kneeling Lunge"): "/exercises/hip_kneeling_lunge.jpg",
    ("y5", "90/90 Seated Hip Flow"): "/exercises/hip_ninety_ninety.jpg",
    ("y5", "Gentle Reclined Figure-4"): "/exercises/hip_figure_four.jpg",
    ("y5", "Savasana Psoas Rest"): "/exercises/restorative_savasana.jpg",

    ("y6", "Cat-Cow Spine Awakening"): "/exercises/core_cat_cow.jpg",
    ("y6", "Gentle Side Body Lateral Stretch"): "/exercises/supported_childs_pose.jpg",
    ("y6", "Gentle Supine Torso Twist"): "/exercises/thoracic_supine_twist.jpg",
    ("y6", "Restorative Prone Rest"): "/exercises/constructive-rest.svg",

    ("y7", "Seated Cat-Cow"): "/exercises/chair_seated_cat_cow.svg",
    ("y7", "Seated Figure-4 Hip Opener"): "/exercises/chair_seated_figure_four.svg",
    ("y7", "Seated Upper Trapezius Drop"): "/exercises/chair_upper_trapezius_drop.svg",
    ("y7", "Seated Chest Expansion"): "/exercises/chair_seated_chest_expansion.svg",

    ("y8", "4-7-8 Parasympathetic Breathing"): "/exercises/diaphragmatic-breathing.svg",
    ("y8", "Suboccipital Massage with Towel"): "/exercises/cervical_chin_tuck.jpg",
    ("y8", "Oculomotor Vagal Reset"): "/exercises/restorative_savasana.jpg",
    ("y8", "Gentle Heart-Belly Grounding"): "/exercises/diaphragmatic-breathing.svg",

    ("y9", "Supine Strap Leg Extension"): "/exercises/supine-strap-hamstring-calf.svg",
    ("y9", "Gentle IT Band Cross-Body"): "/exercises/hip_figure_four.jpg",
    ("y9", "Reclined Hamstring Flutter"): "/exercises/supine-strap-hamstring-calf.svg",
    ("y9", "Restorative Leg Rest"): "/exercises/restorative_savasana.jpg",

    ("y10", "Wide Knee Child's Pose"): "/exercises/supported_childs_pose.jpg",
    ("y10", "Supported Bridge Pose"): "/exercises/supported-bridge-block.svg",
    ("y10", "Supine Spinal Twist with Pillow"): "/exercises/thoracic_supine_twist.jpg",
    ("y10", "Corpse Pose Deep Relaxation"): "/exercises/restorative_savasana.jpg"
}

# Update steps within each routine block
def replace_routine(match):
    r_id = match.group(1)
    body = match.group(2)
    
    def replace_step(s_match):
        title = s_match.group(1)
        dur = s_match.group(2)
        cue = s_match.group(3)
        old_frame = s_match.group(4)
        
        new_frame = mapping.get((r_id, title), old_frame)
        return f'{{ title: "{title}", duration: {dur}, cue: "{cue}", frames: ["{new_frame}"] }}'

    new_body = re.sub(
        r'\{\s*title:\s*"([^"]+)",\s*duration:\s*(\d+),\s*cue:\s*"([^"]+)",\s*frames:\s*\["([^"]+)"\]\s*\}',
        replace_step,
        body
    )
    return f'id: "{r_id}"{new_body}'

updated = re.sub(
    r'id:\s*"(y\d+)"([\s\S]*?video_url:\s*"[^"]*")',
    replace_routine,
    content
)

with open("dashboard/lib/exercise-db.ts", "w", encoding="utf-8") as f:
    f.write(updated)
print("Updated dashboard/lib/exercise-db.ts with dedicated isolated exercise frames!")
