import os
import shutil
from PIL import Image

exercises_dir = "dashboard/public/exercises"
os.makedirs(exercises_dir, exist_ok=True)

# 1. Copy key clinical library illustrations into dashboard/public/exercises/
clinical_images_dir = "clinical_exercise_library/images"
library_assets = [
    "supported-sphinx-micro-lifts.svg", "supported-sphinx-micro-lifts.png",
    "supine-strap-hamstring-calf.svg", "supine-strap-hamstring-calf.png",
    "supported-bridge-block.svg", "supported-bridge-block.png",
    "legs-elevated-relaxation.svg", "legs-elevated-relaxation.png",
    "constructive-rest.svg", "constructive-rest.png",
    "thread-the-needle-modified.svg", "thread-the-needle-modified.png",
    "open-book-thoracic.svg", "open-book-thoracic.png",
    "supine-figure-four-strap.svg", "supine-figure-four-strap.png",
    "glute-bridges.svg", "glute-bridges.png",
    "pelvic-tilts-transverse-holds.svg", "pelvic-tilts-transverse-holds.png",
    "supported-childs-pose-bolster.svg", "supported-childs-pose-bolster.png",
    "supine-single-knee-to-chest.svg", "supine-single-knee-to-chest.png",
    "acupressure-mat-bolster-wind-down.svg", "acupressure-mat-bolster-wind-down.png",
    "diaphragmatic-breathing.svg", "diaphragmatic-breathing.png"
]

for asset in library_assets:
    src = os.path.join(clinical_images_dir, asset)
    dst = os.path.join(exercises_dir, asset)
    if os.path.exists(src):
        shutil.copy2(src, dst)
print("Copied clinical exercise library assets into dashboard/public/exercises/")

# 2. Crop multi-panel posters into dedicated single-exercise graphics
cervical_img = Image.open("dashboard/public/exercises/cervical_neck_mobility.jpg")
cervical_img.crop((180, 80, 560, 740)).save(os.path.join(exercises_dir, "cervical_chin_tuck.jpg"), quality=95)
cervical_img.crop((570, 80, 960, 740)).save(os.path.join(exercises_dir, "cervical_lateral_ear_shoulder.jpg"), quality=95)
cervical_img.crop((970, 80, 1360, 740)).save(os.path.join(exercises_dir, "cervical_shoulder_shrug.jpg"), quality=95)

thoracic_img = Image.open("dashboard/public/exercises/thoracic_spine_mobility.jpg")
thoracic_img.crop((260, 120, 730, 440)).save(os.path.join(exercises_dir, "thoracic_thread_needle.jpg"), quality=95)
thoracic_img.crop((740, 120, 1320, 440)).save(os.path.join(exercises_dir, "thoracic_supine_twist.jpg"), quality=95)
thoracic_img.crop((260, 440, 730, 760)).save(os.path.join(exercises_dir, "thoracic_cactus_expansion.jpg"), quality=95)

core_img = Image.open("dashboard/public/lumbar_core_routine.jpg")
core_img.crop((740, 120, 1320, 440)).save(os.path.join(exercises_dir, "core_cat_cow.jpg"), quality=95)
core_img.crop((260, 440, 730, 760)).save(os.path.join(exercises_dir, "core_bird_dog.jpg"), quality=95)
core_img.crop((740, 440, 1320, 760)).save(os.path.join(exercises_dir, "core_dead_bug.jpg"), quality=95)

hip_img = Image.open("dashboard/public/hip_mobility_routine.jpg")
hip_img.crop((40, 120, 670, 440)).save(os.path.join(exercises_dir, "hip_kneeling_lunge.jpg"), quality=95)
hip_img.crop((680, 120, 1340, 440)).save(os.path.join(exercises_dir, "hip_ninety_ninety.jpg"), quality=95)
hip_img.crop((40, 440, 670, 760)).save(os.path.join(exercises_dir, "hip_glute_bridge.jpg"), quality=95)
hip_img.crop((680, 440, 1340, 760)).save(os.path.join(exercises_dir, "hip_figure_four.jpg"), quality=95)
print("Cropped isolated single-exercise poster panels into dashboard/public/exercises/")

# 3. Create SVG illustrations for Chair Yoga (y7)
def create_chair_svg(filename, title, cue_start, cue_end, icon_color="#00e5ff"):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 240" width="500" height="240">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>
  <!-- Card Background -->
  <rect width="500" height="240" fill="#0f172a" rx="8" stroke="#334155" stroke-width="1.5"/>
  <line x1="250" y1="12" x2="250" y2="228" stroke="#1e293b" stroke-width="2" stroke-dasharray="4,4"/>
  <text x="24" y="26" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" fill="#94a3b8" letter-spacing="1">SETUP (CHAIR)</text>
  <text x="274" y="26" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" fill="{icon_color}" letter-spacing="1">ACTIVE MOVEMENT</text>
  
  <!-- Title Badge -->
  <rect x="24" y="38" width="202" height="22" rx="4" fill="rgba(14, 165, 233, 0.15)"/>
  <text x="32" y="53" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="10" font-weight="600" fill="#38bdf8">{title.upper()}</text>
  
  <!-- Left Panel: Chair & Base Posture -->
  <!-- Chair depiction -->
  <line x1="120" y1="130" x2="120" y2="200" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  <line x1="160" y1="150" x2="160" y2="200" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  <line x1="100" y1="140" x2="170" y2="140" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
  <line x1="100" y1="90" x2="100" y2="140" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
  <!-- Figure seated upright -->
  <circle cx="130" cy="85" r="10" fill="#f8fafc"/>
  <line x1="130" y1="95" x2="130" y2="140" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
  <line x1="130" y1="140" x2="165" y2="140" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
  <line x1="165" y1="140" x2="165" y2="195" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
  <line x1="130" y1="110" x2="155" y2="135" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
  <text x="125" y="215" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">{cue_start}</text>

  <!-- Right Panel: Active Pose -->
  <line x1="370" y1="130" x2="370" y2="200" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  <line x1="410" y1="150" x2="410" y2="200" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  <line x1="350" y1="140" x2="420" y2="140" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
  <line x1="350" y1="90" x2="350" y2="140" stroke="#64748b" stroke-width="5" stroke-linecap="round"/>
  <!-- Figure performing movement -->
  <circle cx="380" cy="85" r="10" fill="{icon_color}"/>
  <line x1="380" y1="95" x2="380" y2="140" stroke="{icon_color}" stroke-width="5" stroke-linecap="round"/>
  <line x1="380" y1="140" x2="415" y2="140" stroke="{icon_color}" stroke-width="5" stroke-linecap="round"/>
  <line x1="415" y1="140" x2="415" y2="195" stroke="{icon_color}" stroke-width="5" stroke-linecap="round"/>
  <line x1="380" y1="110" x2="405" y2="130" stroke="{icon_color}" stroke-width="4" stroke-linecap="round"/>
  <text x="375" y="215" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" fill="#cbd5e1" text-anchor="middle">{cue_end}</text>
</svg>'''
    with open(os.path.join(exercises_dir, filename), "w") as f:
        f.write(svg)

create_chair_svg("chair_seated_cat_cow.svg", "Chair Seated Cat-Cow", "Neutral spine, hands on knees", "Inhale arch chest, exhale round mid-back")
create_chair_svg("chair_seated_figure_four.svg", "Chair Seated Figure-4", "Seated upright, feet flat", "Cross ankle over opposite knee, lean gently forward")
create_chair_svg("chair_upper_trapezius_drop.svg", "Seated Upper Trapezius Drop", "Hold chair base with hand", "Gentle lateral ear tilt away from anchor")
create_chair_svg("chair_seated_chest_expansion.svg", "Seated Chest Expansion", "Interlace hands behind frame", "Open anterior chest, lift collarbones")
print("Generated chair yoga vector illustrations.")
