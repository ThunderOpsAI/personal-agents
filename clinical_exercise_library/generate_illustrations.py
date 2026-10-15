import os
import json
import pymupdf

OUTPUT_DIR = "/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/clinical_exercise_library/images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

WIDTH = 500
HEIGHT = 240

def svg_header():
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="{WIDTH}" height="{HEIGHT}">
  <defs>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#000000" flood-opacity="0.06"/>
    </filter>
  </defs>
  <!-- Card Background -->
  <rect width="{WIDTH}" height="{HEIGHT}" fill="#ffffff" rx="8" stroke="#e2e8f0" stroke-width="1.5"/>
  <!-- Panel Divider -->
  <line x1="250" y1="12" x2="250" y2="228" stroke="#f1f5f9" stroke-width="2" stroke-dasharray="4,4"/>
  <!-- Panel Labels -->
  <text x="24" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10" font-weight="700" fill="#64748b" letter-spacing="1">START</text>
  <text x="274" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10" font-weight="700" fill="#64748b" letter-spacing="1">END</text>
'''

def svg_footer():
    return '</svg>'

def draw_arrow(x1, y1, x2, y2, bend=0):
    cx = (x1 + x2) / 2 + bend
    cy = (y1 + y2) / 2 - 10
    path = f'M {x1} {y1} Q {cx} {cy} {x2} {y2}'
    dx = x2 - cx
    dy = y2 - cy
    length = (dx*dx + dy*dy)**0.5
    if length > 0:
        ux = dx / length
        uy = dy / length
        tip_x = x2
        tip_y = y2
        left_x = tip_x - 7 * ux + 4 * uy
        left_y = tip_y - 7 * uy - 4 * ux
        right_x = tip_x - 7 * ux - 4 * uy
        right_y = tip_y - 7 * uy + 4 * ux
        arrow_head = f'<polygon points="{tip_x},{tip_y} {left_x},{left_y} {right_x},{right_y}" fill="#d9531e"/>'
    else:
        arrow_head = ''
    return f'''
  <path d="{path}" fill="none" stroke="#d9531e" stroke-width="2.5" stroke-linecap="round"/>
  {arrow_head}
'''

def draw_shoulder_limit(cx, cy, length=50):
    x1 = cx - 10
    x2 = cx + length
    return f'''
  <line x1="{x1}" y1="{cy}" x2="{x2}" y2="{cy}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3,3"/>
  <text x="{x2+4}" y="{cy+3}" font-family="Helvetica, Arial, sans-serif" font-size="7.5" font-weight="bold" fill="#dc2626">80° LIMIT</text>
'''

def draw_water_line(y=115, is_deep=False):
    lbl = "DEEP WATER SUSPENSION" if is_deep else "WATER LEVEL (CHEST DEPTH)"
    wave1 = f"M 15 {y} Q 70 {y-3} 125 {y} T 235 {y}"
    wave2 = f"M 265 {y} Q 320 {y-3} 375 {y} T 485 {y}"
    return f'''
  <rect x="15" y="{y}" width="220" height="{230-y}" fill="#f0f9ff" opacity="0.6"/>
  <path d="{wave1}" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="6,2"/>
  <rect x="265" y="{y}" width="220" height="{230-y}" fill="#f0f9ff" opacity="0.6"/>
  <path d="{wave2}" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-dasharray="6,2"/>
  <text x="125" y="{y-6}" font-family="Helvetica, Arial, sans-serif" font-size="8" font-weight="600" fill="#0284c7" text-anchor="middle">{lbl}</text>
  <text x="375" y="{y-6}" font-family="Helvetica, Arial, sans-serif" font-size="8" font-weight="600" fill="#0284c7" text-anchor="middle">{lbl}</text>
'''

def draw_pool_rail(x=40, y1=60, y2=190):
    return f'''
  <line x1="{x}" y1="{y1}" x2="{x}" y2="{y2}" stroke="#0f766e" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="{x-10}" y1="{y1}" x2="{x+10}" y2="{y1}" stroke="#0f766e" stroke-width="3.5" stroke-linecap="round"/>
  <text x="{x}" y="{y1-8}" font-family="Helvetica, Arial, sans-serif" font-size="8" font-weight="bold" fill="#0f766e" text-anchor="middle">[POOL RAIL]</text>
'''

def draw_mat(start_x=30, end_x=230, y=200):
    return f'''
  <line x1="{start_x}" y1="{y}" x2="{end_x}" y2="{y}" stroke="#0f9d9a" stroke-width="3.5" stroke-linecap="round"/>
  <text x="{(start_x+end_x)/2}" y="{y+14}" font-family="Helvetica, Arial, sans-serif" font-size="8" fill="#0f9d9a" text-anchor="middle">[MAT]</text>
'''

def draw_cushion(cx, cy, w=36, h=10):
    return f'''
  <rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="3" fill="#14b8a6" stroke="#0f766e" stroke-width="1"/>
  <text x="{cx}" y="{cy+14}" font-family="Helvetica, Arial, sans-serif" font-size="7.5" fill="#0f766e" text-anchor="middle">[PAD/CUSHION]</text>
'''

def draw_bolster(cx, cy, rx=14, ry=8, label="[BOLSTER]"):
    return f'''
  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#14b8a6" stroke="#0f766e" stroke-width="1.5"/>
  <text x="{cx}" y="{cy+15}" font-family="Helvetica, Arial, sans-serif" font-size="7.5" fill="#0f766e" text-anchor="middle">{label}</text>
'''

def draw_block(cx, cy, w=22, h=14, label="[BLOCK]"):
    return f'''
  <rect x="{cx-w/2}" y="{cy-h/2}" width="{w}" height="{h}" rx="2" fill="#14b8a6" stroke="#0f766e" stroke-width="1.5"/>
  <text x="{cx}" y="{cy+15}" font-family="Helvetica, Arial, sans-serif" font-size="7.5" fill="#0f766e" text-anchor="middle">{label}</text>
'''

def draw_brace(cx, cy, label=True):
    txt = f'<text x="{cx+10}" y="{cy+3}" font-family="Helvetica, Arial, sans-serif" font-size="7" font-weight="bold" fill="#2563eb">[BRACE]</text>' if label else ''
    return f'''
  <rect x="{cx-4}" y="{cy-5}" width="8" height="10" rx="2" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1"/>
  {txt}
'''

def generate_svg_for_item(item):
    slug = item["slug"]
    name = item["name"]
    cat = item.get("category", "")
    
    # Common styles
    svg = svg_header()
    
    is_aqua = "02_Hydrotherapy" in cat or "aqua" in slug or "hydro" in slug or "submerged" in slug or "noodle" in slug or "kickboard" in slug
    is_deep = "deep-water" in slug or "suspensions" in slug or "treading" in slug
    
    if is_aqua:
        svg += draw_water_line(y=115, is_deep=is_deep)
        svg += draw_pool_rail(x=35, y1=60, y2=190)
        svg += draw_pool_rail(x=285, y1=60, y2=190)
    elif "05_Tai_Chi" in cat:
        # Floor line
        svg += '<line x1="20" y1="205" x2="230" y2="205" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>'
        svg += '<line x1="270" y1="205" x2="480" y2="205" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>'
    else:
        # Floor Yoga / Mat
        svg += draw_mat(30, 230, 205)
        svg += draw_mat(280, 480, 205)

    # Pose logic based on slug / description
    if "child" in slug:
        # Supported Child's Pose over Bolster
        for offset in [0, 250]:
            cx = 130 + offset
            cy = 195
            svg += draw_cushion(cx-30, cy+2, w=40, h=8)
            svg += draw_bolster(cx+10, cy-5, rx=35, ry=12, label="[BOLSTER]")
            # Torso resting on bolster
            svg += f'<circle cx="{cx-5}" cy="{cy-18}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx-25}" y1="{cy}" x2="{cx-5}" y2="{cy-15}" stroke="#4a6b82" stroke-width="8" stroke-linecap="round"/>'
            svg += f'<line x1="{cx-5}" y1="{cy-15}" x2="{cx+25}" y2="{cy-10}" stroke="#4a6b82" stroke-width="8" stroke-linecap="round"/>'
            # Arms forward relaxed
            svg += f'<polyline points="{cx},{cy-12} {cx+25},{cy-2} {cx+40},{cy}" fill="none" stroke="#4a6b82" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
            # Knees bent folded
            svg += f'<polyline points="{cx-25},{cy} {cx-40},{cy+3} {cx-30},{cy+6}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
        svg += draw_arrow(230, 150, 270, 150)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">CHEST FULLY RESTED ON BOLSTER | NECK NEUTRAL</text>'

    elif "wall-angels" in slug or "seated-wall-rows" in slug:
        # Wall exercises
        svg += '<line x1="60" y1="40" x2="60" y2="205" stroke="#64748b" stroke-width="4"/>'
        svg += '<text x="55" y="100" font-family="Helvetica, Arial, sans-serif" font-size="7.5" fill="#64748b" text-anchor="end">[WALL]</text>'
        svg += '<line x1="310" y1="40" x2="310" y2="205" stroke="#64748b" stroke-width="4"/>'
        svg += '<text x="305" y="100" font-family="Helvetica, Arial, sans-serif" font-size="7.5" fill="#64748b" text-anchor="end">[WALL]</text>'
        for offset, arm_y in [(0, 125), (250, 95)]:
            cx = 85 + offset
            cy = 145
            # Standing back to wall
            svg += f'<circle cx="{cx}" cy="{cy-55}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx}" y1="{cy-44}" x2="{cx}" y2="{cy+15}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            svg += f'<line x1="{cx}" y1="{cy+15}" x2="{cx+2}" y2="{cy+60}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            # Arms
            svg += f'<polyline points="{cx},{cy-40} {cx+18},{cy-20} {cx+20},{arm_y}" fill="none" stroke="#4a6b82" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
            svg += draw_shoulder_limit(cx, cy-40, length=40)
        svg += draw_arrow(120, 110, 360, 95)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="middle">ELBOWS STRICTLY BELOW SHOULDER HEIGHT | CHIN TUCKED</text>'

    elif "open-book" in slug:
        # Side-lying Open Book
        # START
        cx = 120
        cy = 190
        svg += draw_block(cx-40, cy-5, w=24, h=12, label="[PILLOW]")
        svg += f'<circle cx="{cx-40}" cy="{cy-18}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
        svg += f'<line x1="{cx-28}" y1="{cy-12}" x2="{cx+15}" y2="{cy-12}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
        svg += f'<polyline points="{cx+15},{cy-12} {cx+35},{cy-5} {cx+25},{cy+12}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
        svg += draw_bolster(cx+35, cy-5, rx=12, ry=7, label="[BOLSTER]")
        svg += f'<line x1="{cx-20}" y1="{cy-12}" x2="{cx+20}" y2="{cy-12}" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
        # END
        cx = 370
        svg += draw_block(cx-40, cy-5, w=24, h=12, label="[PILLOW]")
        svg += f'<circle cx="{cx-40}" cy="{cy-18}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
        svg += f'<line x1="{cx-28}" y1="{cy-12}" x2="{cx+15}" y2="{cy-12}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
        svg += f'<polyline points="{cx+15},{cy-12} {cx+35},{cy-5} {cx+25},{cy+12}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
        svg += draw_bolster(cx+35, cy-5, rx=12, ry=7, label="[BOLSTER]")
        svg += f'<path d="M {cx-20} {cy-12} Q {cx-5} {cy-35} {cx-25} {cy-30}" fill="none" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
        svg += draw_shoulder_limit(cx-20, cy-25, length=40)
        svg += draw_arrow(140, 160, 350, 155)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">ROTATE THORACIC CAGE ONLY | HEAD & NECK LOCKED NEUTRAL</text>'

    elif "bridge" in slug:
        # Glute Bridge / Supported Bridge
        # START
        cx = 120
        cy = 195
        svg += f'<rect x="{cx-52}" y="{cy-3}" width="26" height="5" rx="2" fill="#94a3b8"/>'
        svg += f'<circle cx="{cx-40}" cy="{cy-12}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
        svg += f'<line x1="{cx-29}" y1="{cy-5}" x2="{cx+15}" y2="{cy-5}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
        svg += f'<polyline points="{cx+15},{cy-5} {cx+35},{cy-24} {cx+50},{cy-2}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
        # END
        cx = 370
        svg += f'<rect x="{cx-52}" y="{cy-3}" width="26" height="5" rx="2" fill="#94a3b8"/>'
        svg += f'<circle cx="{cx-40}" cy="{cy-12}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
        svg += f'<line x1="{cx-29}" y1="{cy-5}" x2="{cx+15}" y2="{cy-25}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
        svg += f'<polyline points="{cx+15},{cy-25} {cx+38},{cy-25} {cx+46},{cy-2}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
        if "block" in slug:
            svg += draw_block(cx+15, cy-12, w=20, h=14, label="[SACRAL BLOCK]")
        if "adductor" in slug:
            svg += draw_block(cx+38, cy-25, w=16, h=10, label="[BLOCK]")
        svg += draw_arrow(145, 185, 375, 165)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">SQUEEZE GLUTES AT TOP | ALIGN KNEES OVER BRACED ANKLES</text>'

    elif "heel-slides" in slug or "dead-bug" in slug or "pelvic" in slug or "single-knee" in slug or "figure-four" in slug or "strap" in slug or "rest" in slug or "savasana" in slug or "diaphragmatic" in slug or "relaxation" in slug or "decompression" in slug:
        # Supine ground exercises
        for offset, action in [(0, "start"), (250, "end")]:
            cx = 120 + offset
            cy = 195
            svg += f'<rect x="{cx-55}" y="{cy-3}" width="26" height="5" rx="2" fill="#94a3b8"/>'
            svg += f'<circle cx="{cx-42}" cy="{cy-12}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx-31}" y1="{cy-5}" x2="{cx+15}" y2="{cy-5}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            
            if "rest" in slug or "savasana" in slug or "diaphragmatic" in slug:
                svg += f'<polyline points="{cx+15},{cy-5} {cx+35},{cy-15} {cx+55},{cy-2}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                svg += draw_bolster(cx+35, cy-4, rx=14, ry=8, label="[BOLSTER]")
            elif "legs-elevated" in slug:
                svg += f'<polyline points="{cx+15},{cy-5} {cx+25},{cy-35} {cx+55},{cy-35}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                svg += f'<rect x="{cx+35}" y="{cy-30}" width="28" height="28" fill="#cbd5e1" stroke="#94a3b8" rx="2"/>'
                svg += f'<text x="{cx+49}" y="{cy-14}" font-family="Helvetica, Arial, sans-serif" font-size="6.5" fill="#475569" text-anchor="middle">[CHAIR]</text>'
            elif "heel-slides" in slug:
                if action == "start":
                    svg += f'<polyline points="{cx+15},{cy-5} {cx+32},{cy-24} {cx+45},{cy-2}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                else:
                    svg += f'<line x1="{cx+15}" y1="{cy-5}" x2="{cx+65}" y2="{cy-2}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            elif "single-knee" in slug:
                if action == "start":
                    svg += f'<polyline points="{cx+15},{cy-5} {cx+32},{cy-24} {cx+45},{cy-2}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                else:
                    svg += f'<polyline points="{cx+15},{cy-5} {cx+20},{cy-35} {cx+15},{cy-20}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                    svg += f'<line x1="{cx-20}" y1="{cy-5}" x2="{cx+18}" y2="{cy-28}" stroke="#4a6b82" stroke-width="4" stroke-linecap="round"/>'
            elif "figure-four" in slug or "strap" in slug:
                svg += f'<polyline points="{cx+15},{cy-5} {cx+30},{cy-25} {cx+45},{cy-2}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                svg += f'<polyline points="{cx+15},{cy-5} {cx+25},{cy-38} {cx+30},{cy-25}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                svg += f'<line x1="{cx-15}" y1="{cy-5}" x2="{cx+25}" y2="{cy-38}" stroke="#0f9d9a" stroke-width="2.5" stroke-dasharray="3,2"/>'
                svg += f'<text x="{cx+8}" y="{cy-25}" font-family="Helvetica, Arial, sans-serif" font-size="7" fill="#0f9d9a">[STRAP]</text>'
            elif "pilates-bar" in slug:
                if action == "start":
                    svg += f'<polyline points="{cx+15},{cy-5} {cx+25},{cy-30} {cx+35},{cy-22}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                else:
                    svg += f'<line x1="{cx+15}" y1="{cy-5}" x2="{cx+50}" y2="{cy-25}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
                svg += f'<line x1="{cx+30}" y1="{cy-32}" x2="{cx+45}" y2="{cy-20}" stroke="#0f766e" stroke-width="4" stroke-linecap="round"/>'
                svg += f'<text x="{cx+38}" y="{cy-36}" font-family="Helvetica, Arial, sans-serif" font-size="7" font-weight="bold" fill="#0f766e">[PILATES BAR]</text>'
            elif "dead-bug" in slug:
                if action == "start":
                    svg += f'<polyline points="{cx+15},{cy-5} {cx+20},{cy-30} {cx+40},{cy-30}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                    svg += f'<line x1="{cx-20}" y1="{cy-5}" x2="{cx-20}" y2="{cy-35}" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
                else:
                    svg += f'<line x1="{cx+15}" y1="{cy-5}" x2="{cx+55}" y2="{cy-15}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
                    svg += f'<line x1="{cx-20}" y1="{cy-5}" x2="{cx-45}" y2="{cy-20}" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
                    svg += draw_shoulder_limit(cx-20, cy-20, length=30)
            else:
                svg += f'<polyline points="{cx+15},{cy-5} {cx+35},{cy-24} {cx+50},{cy-2}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                svg += f'<line x1="{cx-20}" y1="{cy-5}" x2="{cx+10}" y2="{cy-5}" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
        svg += draw_arrow(180, 160, 330, 160)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">HEAD GROUNDED & SUPPORTED | LUMBAR SPINE FLAT & PROTECTED</text>'

    elif "seated" in slug or "commencing" in slug or "cloud-hands" in slug or "closing-circle" in slug:
        # Seated Tai Chi
        for offset, action in [(0, "start"), (250, "end")]:
            cx = 120 + offset
            cy = 135
            # Chair
            svg += f'<polyline points="{cx-30},{cy-35} {cx-30},{cy+15} {cx+5},{cy+15} {cx+5},{cy+65}" fill="none" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>'
            svg += f'<line x1="{cx-30}" y1="{cy+15}" x2="{cx-30}" y2="{cy+65}" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>'
            # Figure Seated
            svg += f'<circle cx="{cx-10}" cy="{cy-40}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx-10}" y1="{cy-29}" x2="{cx-10}" y2="{cy+15}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            svg += f'<polyline points="{cx-10},{cy+15} {cx+15},{cy+15} {cx+15},{cy+65}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
            # Arms
            if "commencing" in slug:
                arm_y = cy-15 if action == "start" else cy+5
                svg += f'<polyline points="{cx-10},{cy-25} {cx+5},{arm_y} {cx+18},{arm_y+2}" fill="none" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
                svg += draw_shoulder_limit(cx-10, cy-25, length=35)
            elif "cloud-hands" in slug:
                sweep_x = cx+5 if action == "start" else cx+25
                svg += f'<polyline points="{cx-10},{cy-25} {sweep_x},{cy-15} {sweep_x+10},{cy-10}" fill="none" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
                svg += draw_shoulder_limit(cx-10, cy-25, length=35)
            else:
                svg += f'<polyline points="{cx-10},{cy-25} {cx+5},{cy+5} {cx+12},{cy+10}" fill="none" stroke="#4a6b82" stroke-width="5" stroke-linecap="round"/>'
        svg += draw_arrow(150, 120, 360, 120)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">UPRIGHT SEATED POSTURE | ARMS BELOW SHOULDER HEIGHT</text>'

    elif "standing" in slug or "walking" in slug or "repulse" in slug or "brush-knee" in slug or "weight-shifting" in slug or "joint-loosening" in slug or "six-harmonies" in slug or "parting-wild-horse" in slug:
        # Standing Tai Chi / Land Gait
        # Rail support
        svg += '<line x1="45" y1="80" x2="45" y2="205" stroke="#0f766e" stroke-width="4" stroke-linecap="round"/>'
        svg += '<text x="45" y="72" font-family="Helvetica, Arial, sans-serif" font-size="7.5" font-weight="bold" fill="#0f766e" text-anchor="middle">[RAIL]</text>'
        svg += '<line x1="295" y1="80" x2="295" y2="205" stroke="#0f766e" stroke-width="4" stroke-linecap="round"/>'
        svg += '<text x="295" y="72" font-family="Helvetica, Arial, sans-serif" font-size="7.5" font-weight="bold" fill="#0f766e" text-anchor="middle">[RAIL]</text>'
        for offset, action in [(0, "start"), (250, "end")]:
            cx = 110 + offset
            cy = 135
            svg += f'<circle cx="{cx}" cy="{cy-45}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx}" y1="{cy-34}" x2="{cx}" y2="{cy+20}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            # Legs
            leg_dx = 8 if action == "start" else -8
            svg += f'<line x1="{cx-4}" y1="{cy+20}" x2="{cx-12+leg_dx}" y2="{cy+70}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            svg += f'<line x1="{cx+4}" y1="{cy+20}" x2="{cx+12-leg_dx}" y2="{cy+70}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            svg += draw_brace(cx-12+leg_dx, cy+45, label=False)
            svg += draw_brace(cx+12-leg_dx, cy+62, label=False)
            # Arm holding rail
            rail_x = 45 if offset == 0 else 295
            svg += f'<line x1="{cx}" y1="{cy-28}" x2="{rail_x}" y2="{cy-10}" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
            # Moving arm
            reach_y = cy-15 if action == "end" else cy+5
            svg += f'<polyline points="{cx},{cy-28} {cx+18},{reach_y} {cx+28},{reach_y+2}" fill="none" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
            svg += draw_shoulder_limit(cx, cy-28, length=35)
        svg += draw_arrow(150, 115, 370, 115)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">HOLD RAIL FOR STABILITY | PROTECT KNEE & ANKLE ALIGNMENT</text>'

    elif "squat" in slug:
        # Shallow Squat (Aquatic or Land)
        for offset, is_squat in [(0, False), (250, True)]:
            cx = 120 + offset
            cy = 135
            rail_x = 35 if offset == 0 else 285
            svg += f'<circle cx="{cx}" cy="{cy-45}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            torso_y2 = cy+20 if not is_squat else cy+30
            svg += f'<line x1="{cx}" y1="{cy-34}" x2="{cx}" y2="{torso_y2}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            # Band from rail to pelvis
            svg += f'<line x1="{rail_x}" y1="{torso_y2-5}" x2="{cx}" y2="{torso_y2-5}" stroke="#0f9d9a" stroke-width="3" stroke-dasharray="3,2"/>'
            svg += f'<text x="{(rail_x+cx)/2}" y="{torso_y2-10}" font-family="Helvetica, Arial, sans-serif" font-size="7" font-weight="bold" fill="#0f766e">[BAND]</text>'
            # Hands holding rail
            svg += f'<line x1="{cx}" y1="{cy-28}" x2="{rail_x}" y2="{cy-15}" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
            # Legs
            if not is_squat:
                svg += f'<line x1="{cx}" y1="{torso_y2}" x2="{cx}" y2="{cy+70}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            else:
                svg += f'<polyline points="{cx},{torso_y2} {cx-14},{torso_y2+22} {cx-2},{cy+70}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
                svg += f'<text x="{cx-28}" y="{torso_y2+22}" font-family="Helvetica, Arial, sans-serif" font-size="7.5" font-weight="bold" fill="#dc2626">MAX 45°</text>'
        svg += draw_arrow(140, 150, 350, 165)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="middle">MAX 45° KNEE FLEXION | BAND ANCHORED TO SOLID POOL RAIL</text>'

    elif "row" in slug or "press" in slug or "kickboard" in slug or "dumbbell" in slug:
        # Banded Rows, Presses, Kickboard Press-downs
        for offset, action in [(0, "start"), (250, "end")]:
            cx = 120 + offset
            cy = 135
            rail_x = 35 if offset == 0 else 285
            svg += f'<circle cx="{cx}" cy="{cy-45}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx}" y1="{cy-34}" x2="{cx}" y2="{cy+20}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            svg += f'<line x1="{cx}" y1="{cy+20}" x2="{cx}" y2="{cy+70}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            if "kickboard" in slug:
                kb_y = cy-15 if action == "start" else cy+15
                svg += f'<polyline points="{cx},{cy-25} {cx-20},{kb_y} {cx-35},{kb_y}" fill="none" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
                svg += f'<rect x="{cx-45}" y="{kb_y-4}" width="22" height="10" rx="3" fill="#14b8a6" stroke="#0f766e" stroke-width="1.5"/>'
                svg += f'<text x="{cx-34}" y="{kb_y+16}" font-family="Helvetica, Arial, sans-serif" font-size="6.5" font-weight="bold" fill="#0f766e" text-anchor="middle">[KICKBOARD]</text>'
            elif "dumbbell" in slug:
                db_x = cx - 15 if action == "start" else cx + 15
                svg += f'<polyline points="{cx},{cy-25} {db_x},{cy-10} {db_x},{cy}" fill="none" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
                svg += f'<rect x="{db_x-6}" y="{cy-4}" width="12" height="8" rx="2" fill="#14b8a6" stroke="#0f766e" stroke-width="1.5"/>'
                svg += f'<text x="{db_x}" y="{cy+14}" font-family="Helvetica, Arial, sans-serif" font-size="6.5" font-weight="bold" fill="#0f766e" text-anchor="middle">[H2O DB]</text>'
            else: # Banded rows
                hand_x = cx - 35 if action == "start" else cx - 10
                svg += f'<line x1="{rail_x}" y1="{cy}" x2="{hand_x}" y2="{cy}" stroke="#0f9d9a" stroke-width="3" stroke-dasharray="3,2"/>'
                svg += f'<polyline points="{cx},{cy-25} {cx-5},{cy-5} {hand_x},{cy}" fill="none" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
                svg += f'<text x="{(rail_x+hand_x)/2}" y="{cy-6}" font-family="Helvetica, Arial, sans-serif" font-size="7" font-weight="bold" fill="#0f766e">[BAND]</text>'
            svg += draw_shoulder_limit(cx, cy-25, length=35)
        svg += draw_arrow(140, 130, 360, 130)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="middle">ELBOWS TUCKED LOW | RIGHT SHOULDER STRICTLY BELOW 80°</text>'

    elif "noodle" in slug or "suspensions" in slug or "treading" in slug or "crucible" in slug:
        # Deep water / Noodle / Flotation belt
        for offset, action in [(0, "start"), (250, "end")]:
            cx = 120 + offset
            cy = 135
            svg += f'<circle cx="{cx}" cy="{cy-45}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx}" y1="{cy-34}" x2="{cx}" y2="{cy+15}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            # Flotation device
            if "noodle" in slug:
                svg += f'<ellipse cx="{cx}" cy="{cy-20}" rx="18" ry="8" fill="#14b8a6" stroke="#0f766e" stroke-width="1.5"/>'
                svg += f'<text x="{cx+24}" y="{cy-18}" font-family="Helvetica, Arial, sans-serif" font-size="6.5" font-weight="bold" fill="#0f766e">[NOODLE]</text>'
            else:
                svg += f'<rect x="{cx-12}" y="{cy+2}" width="24" height="12" rx="3" fill="#14b8a6" stroke="#0f766e" stroke-width="1.5"/>'
                svg += f'<text x="{cx+26}" y="{cy+11}" font-family="Helvetica, Arial, sans-serif" font-size="6.5" font-weight="bold" fill="#0f766e">[BELT]</text>'
            # Legs
            if action == "start":
                svg += f'<line x1="{cx}" y1="{cy+15}" x2="{cx}" y2="{cy+65}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            else:
                svg += f'<polyline points="{cx},{cy+15} {cx-16},{cy+25} {cx-14},{cy+48}" fill="none" stroke="#4a6b82" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
        svg += draw_arrow(140, 160, 360, 155)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">DRIVE KNEES UP AGAINST DRAG | STRICTLY NO LUMBAR FLEXION</text>'

    elif "prone" in slug or "sphinx" in slug or "retractions" in slug or "scapulo" in slug:
        # Prone exercises
        for offset, action in [(0, "start"), (250, "end")]:
            cx = 120 + offset
            cy = 195
            svg += draw_cushion(cx-45, cy+3, w=26, h=6)
            svg += f'<circle cx="{cx-45}" cy="{cy-8}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx-34}" y1="{cy-2}" x2="{cx+20}" y2="{cy-2}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            svg += f'<line x1="{cx+20}" y1="{cy-2}" x2="{cx+65}" y2="{cy-2}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            # Arms
            if "sphinx" in slug:
                svg += f'<polyline points="{cx-25},{cy-2} {cx-22},{cy-18} {cx-5},{cy-18}" fill="none" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
            else:
                arm_lift = cy - 6 if action == "start" else cy - 18
                svg += f'<polyline points="{cx-25},{cy-2} {cx-15},{arm_lift} {cx-2},{arm_lift}" fill="none" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
                svg += f'<text x="{cx-8}" y="{arm_lift-6}" font-family="Helvetica, Arial, sans-serif" font-size="7" font-weight="bold" fill="#0f766e">W-PULL</text>'
        svg += draw_arrow(150, 175, 360, 165)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">FOREHEAD RESTED ON PAD | CERVICAL SPINE LOCKED NEUTRAL</text>'

    else:
        # Generic leg / band / aquatic gait
        for offset, action in [(0, "start"), (250, "end")]:
            cx = 110 + offset
            cy = 135
            rail_x = 35 if offset == 0 else 285
            svg += f'<circle cx="{cx}" cy="{cy-45}" r="10" fill="#4a6b82" stroke="#334e68" stroke-width="1.5"/>'
            svg += f'<line x1="{cx}" y1="{cy-34}" x2="{cx}" y2="{cy+20}" stroke="#4a6b82" stroke-width="7" stroke-linecap="round"/>'
            # Hold rail
            svg += f'<line x1="{cx}" y1="{cy-25}" x2="{rail_x}" y2="{cy-10}" stroke="#4a6b82" stroke-width="4.5" stroke-linecap="round"/>'
            # Legs
            kick_x = cx if action == "start" else cx + 22
            kick_y = cy + 65 if action == "start" else cy + 55
            svg += f'<line x1="{cx}" y1="{cy+20}" x2="{cx-8}" y2="{cy+65}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            svg += f'<line x1="{cx}" y1="{cy+20}" x2="{kick_x}" y2="{kick_y}" stroke="#4a6b82" stroke-width="6" stroke-linecap="round"/>'
            if "banded" in slug or "kickback" in slug or "abduction" in slug:
                svg += f'<line x1="{rail_x}" y1="{cy+45}" x2="{kick_x}" y2="{kick_y}" stroke="#0f9d9a" stroke-width="2.5" stroke-dasharray="3,2"/>'
                svg += f'<text x="{(rail_x+kick_x)/2}" y="{cy+40}" font-family="Helvetica, Arial, sans-serif" font-size="7" font-weight="bold" fill="#0f766e">[BAND]</text>'
        svg += draw_arrow(140, 175, 360, 165)
        svg += '<text x="250" y="232" font-family="Helvetica, Arial, sans-serif" font-size="8.5" font-weight="bold" fill="#0f766e" text-anchor="middle">CONTROLLED SWEEP AGAINST WATER DRAG | NEUTRAL LUMBAR SPINE</text>'

    svg += svg_footer()
    return svg

def build_all_images():
    with open("/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/clinical_exercise_library/exercise_manifest.json") as f:
        manifest = json.load(f)
    
    print(f"Generating {len(manifest)} vector illustrations at 300 DPI...")
    for idx, item in enumerate(manifest, 1):
        slug = item["slug"]
        svg_content = generate_svg_for_item(item)
        svg_path = os.path.join(OUTPUT_DIR, f"{slug}.svg")
        png_path = os.path.join(OUTPUT_DIR, f"{slug}.png")
        
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        
        # Render to 300 DPI PNG
        doc = pymupdf.open(stream=svg_content.encode("utf-8"), filetype="svg")
        page = doc[0]
        pix = page.get_pixmap(dpi=300)
        pix.save(png_path)
        doc.close()
        
    print(f"All {len(manifest)} illustrations successfully created in {OUTPUT_DIR}")

if __name__ == "__main__":
    build_all_images()
