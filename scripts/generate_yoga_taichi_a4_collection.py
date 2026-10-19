import os
import subprocess
import re

REPO_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(REPO_DIR, "clinical_exercise_library", "images")
LIB_DIR = os.path.join(REPO_DIR, "medical", "records", "Rehab_Protocols_Library")
CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def asset_url(filename):
    return f"file://{os.path.join(ASSETS_DIR, filename)}"

# Read CSS base
with open(os.path.join(LIB_DIR, "hydrotherapy_a4_print_sheets.html")) as f:
    PORTRAIT_CSS = f.read().split("<style>")[1].split("</style>")[0].strip()

with open(os.path.join(LIB_DIR, "hydrotherapy_a4_landscape_sheets.html")) as f:
    LANDSCAPE_CSS = f.read().split("<style>")[1].split("</style>")[0].strip()

# Add page break protection and strict height clamping to print styles
TIGHT_PORTRAIT_CSS = PORTRAIT_CSS + """
@media print {
  html, body {
    width: 210mm;
    height: 297mm;
    margin: 0 !important;
    padding: 0 !important;
  }
  .page {
    width: 194mm !important;
    height: 284mm !important;
    max-height: 284mm !important;
    margin: 0 !important;
    padding: 6mm 8mm !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
}
.routine-card {
  margin-bottom: 3.5px !important;
  padding: 3.5px 5.5px !important;
}
.visual-strip {
  margin: 3px 0 2px 0 !important;
  padding: 3px 5px !important;
}
.visual-card img, .visual-item img {
  height: 38px !important;
  margin-bottom: 1.5px !important;
}
.visual-card .caption, .visual-item .visual-caption {
  font-size: 6.8px !important;
  line-height: 1.1 !important;
}
.visual-card .cue-list, .visual-item .visual-subtext {
  font-size: 6.2px !important;
  line-height: 1.1 !important;
}
.step-box {
  padding: 2.5px 4px !important;
}
.step-header {
  font-size: 7.8px !important;
  margin-bottom: 0.5px !important;
}
.step-time {
  font-size: 7.2px !important;
}
.step-cue {
  font-size: 7.2px !important;
  line-height: 1.15 !important;
}
.steps-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 3px;
}
.steps-strip-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
}
"""

TIGHT_LANDSCAPE_CSS = LANDSCAPE_CSS + """
@media print {
  html, body {
    width: 297mm;
    height: 210mm;
    margin: 0 !important;
    padding: 0 !important;
  }
  .page {
    width: 281mm !important;
    height: 194mm !important;
    max-height: 194mm !important;
    margin: 0 !important;
    padding: 6mm 8mm !important;
    page-break-after: always !important;
    break-after: page !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
}
.routine-card {
  margin-bottom: 2.5px !important;
  padding: 2.5px 4.5px !important;
}
.gallery-card img {
  height: 36px !important;
  margin-bottom: 1.5px !important;
}
.gallery-card .caption {
  font-size: 6.8px !important;
  line-height: 1.1 !important;
}
.gallery-card .cue-list {
  font-size: 6.2px !important;
  line-height: 1.1 !important;
}
.step-box {
  padding: 2px 3.5px !important;
}
.step-header {
  font-size: 7.5px !important;
}
.step-cue {
  font-size: 7px !important;
  line-height: 1.15 !important;
}
.steps-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2.5px;
}
.steps-strip-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5px;
}
"""

print("Tight styles prepared.")

# Import data structures from build_html_and_pdf.py
import sys
sys.path.append(os.path.dirname(__file__))
from build_html_and_pdf import (
    PAGE1_ROUTINES, PAGE1_VISUALS,
    PAGE2_ROUTINES, PAGE2_VISUALS,
    PAGE3_ROUTINES, PAGE3_VISUALS,
    PAGE4_ROUTINES, PAGE4_VISUALS,
    PAGE5_ROUTINES, PAGE5_VISUALS,
    PAGE6_ROUTINES, PAGE6_VISUALS,
    CLINICAL_BANNER, DISCLAIMER_TEXT,
    make_header_html, make_footer_html
)

def render_compact_card(r, cols=4):
    color_class = r.get("color", "")
    id_class = f" {color_class}" if color_class else ""
    card_class = f"routine-card {color_class}".strip()
    
    tags_html = "".join([f'<span class="meta-tag"><strong>{k}:</strong> {v}</span>' for k, v in r["tags"]])
    
    steps_html = []
    for title, duration, cue in r["steps"]:
        steps_html.append(f"""
        <div class="step-box">
          <div class="step-header">
            <span>{title}</span>
            <span class="step-time">{duration}</span>
          </div>
          <div class="step-cue">{cue}</div>
        </div>""")
        
    strip_class = "steps-strip" if cols == 4 else ("steps-strip-3" if cols == 3 else "steps-grid")
    
    return f"""
    <div class="{card_class}">
      <div class="card-header">
        <div class="card-title-group">
          <span class="routine-id{id_class}">{r["id"]}</span>
          <span class="routine-title">{r["title"]}</span>
        </div>
        <span class="routine-meta">{r["time"]}</span>
      </div>
      <div class="meta-tags">{tags_html}</div>
      <div class="{strip_class}">
        {"".join(steps_html)}
      </div>
    </div>
    """

def render_visual_strip_portrait(visuals, title="Form Reference & Clinical Biomechanics"):
    cols_class = f"cols-{len(visuals)}" if len(visuals) <= 6 else "cols-4"
    cards = []
    for img_file, caption, cues in visuals:
        cues_html = "".join([f"<li>{c}</li>" for c in cues])
        cards.append(f"""
        <div class="visual-card">
          <img src="{asset_url(img_file)}" alt="{caption}">
          <div class="caption">{caption}</div>
          <ul class="cue-list">{cues_html}</ul>
        </div>""")
    return f"""
    <div class="visual-strip">
      <div class="visual-strip-header">
        <span class="visual-strip-title">{title}</span>
        <span class="visual-strip-sub">Zero Impact &bull; Form Alignment</span>
      </div>
      <div class="visual-grid {cols_class}">
        {"".join(cards)}
      </div>
    </div>
    """

def render_gallery_landscape(visuals, title="Form & Biomechanics Reference"):
    grid_class = f"grid-{len(visuals)}" if len(visuals) in (4, 5, 6) else "grid-6"
    cards = []
    for img_file, caption, cues in visuals:
        cues_html = "".join([f"<li>{c}</li>" for c in cues])
        cards.append(f"""
        <div class="gallery-card">
          <img src="{asset_url(img_file)}" alt="{caption}">
          <div class="caption">{caption}</div>
          <ul class="cue-list">{cues_html}</ul>
        </div>""")
    return f"""
    <div class="right-col">
      <div class="gallery-title">
        <span>{title}</span>
        <span>Zero Impact &bull; Clinical Alignment</span>
      </div>
      <div class="gallery-grid {grid_class}">
        {"".join(cards)}
      </div>
    </div>
    """

PORTRAIT_PAGES_DEF = [
    ("Sheet 1: Beginner Mindful Floor Flows", "Sheet 1 of 6 • Beginner Flows", 1, PAGE1_ROUTINES, PAGE1_VISUALS, "Form Reference • Supine Decompression & Hip Release", 4),
    ("Sheet 2: Mindful Tai Chi & Vestibular Balance", "Sheet 2 of 6 • Tai Chi", 2, PAGE2_ROUTINES, PAGE2_VISUALS, "Form Reference • Seated & Supported Standing Tai Chi", 3),
    ("Sheet 3: Clinical Floor & Nerve Decompression", "Sheet 3 of 6 • Clinical Floor", 3, PAGE3_ROUTINES, PAGE3_VISUALS, "Form Reference • Scapular Alignment & Neurodynamics", 3),
    ("Sheet 4: Expert Strength Yoga & Pilates Isometrics", "Sheet 4 of 6 • Expert Rehab", 4, PAGE4_ROUTINES, PAGE4_VISUALS, "Form Reference • Isometric Core & Kinetic Conditioning", 3),
    ("Sheet 5: Daily System Yoga Routines 1–5", "Sheet 5 of 6 • Daily Routines 1–5", 5, PAGE5_ROUTINES, PAGE5_VISUALS, "Form Reference • Daily Restorative & Mobility Flows", 4),
    ("Sheet 6: Daily System Yoga Routines 6–10", "Sheet 6 of 6 • Daily Routines 6–10", 6, PAGE6_ROUTINES, PAGE6_VISUALS, "Form Reference • Spinal Awakening & Evening Wind-Down", 4)
]

def build_portrait():
    pages = []
    for subtitle, badge, pnum, routines, visuals, vtitle, step_cols in PORTRAIT_PAGES_DEF:
        rcards = "".join([render_compact_card(r, cols=step_cols) for r in routines])
        vstrip = render_visual_strip_portrait(visuals, vtitle)
        hdr = make_header_html("Rumble OS • Clinical Yoga & Tai Chi Series", f"A4 Laminated Reference • {subtitle}", badge)
        ftr = make_footer_html(pnum, 6)
        pages.append(f"""
        <div class="page">
          <div>
            {hdr}
            {CLINICAL_BANNER}
            {rcards}
          </div>
          <div>
            {vstrip}
            {ftr}
          </div>
        </div>
        """)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rumble OS - Yoga & Tai Chi (A4 Portrait Laminated Series)</title>
  <style>{TIGHT_PORTRAIT_CSS}</style>
</head>
<body>{"".join(pages)}</body>
</html>"""
    path = os.path.join(LIB_DIR, "yoga_taichi_a4_print_sheets.html")
    with open(path, "w") as f:
        f.write(html)
    return path

def build_landscape():
    pages = []
    for subtitle, badge, pnum, routines, visuals, vtitle, step_cols in PORTRAIT_PAGES_DEF:
        cols_l = 2 if len(routines) <= 3 else 2
        rcards = "".join([render_compact_card(r, cols=cols_l) for r in routines])
        gallery = render_gallery_landscape(visuals, vtitle)
        hdr = make_header_html("Rumble OS • Clinical Yoga & Tai Chi Series", f"A4 Laminated Reference • {subtitle}", badge)
        ftr = make_footer_html(pnum, 6)
        pages.append(f"""
        <div class="page">
          <div>
            {hdr}
            {CLINICAL_BANNER}
          </div>
          <div class="content-split">
            <div class="left-col">
              {rcards}
            </div>
            {gallery}
          </div>
          <div>
            {ftr}
          </div>
        </div>
        """)
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rumble OS - Yoga & Tai Chi (A4 Landscape Laminated Series)</title>
  <style>{TIGHT_LANDSCAPE_CSS}</style>
</head>
<body>{"".join(pages)}</body>
</html>"""
    path = os.path.join(LIB_DIR, "yoga_taichi_a4_landscape_sheets.html")
    with open(path, "w") as f:
        f.write(html)
    return path

print("Building test files...")
p_html = build_portrait()
l_html = build_landscape()

p_pdf = os.path.join(LIB_DIR, "Yoga_TaiChi_Routines_A4_Laminated_Collection.pdf")
l_pdf = os.path.join(LIB_DIR, "Yoga_TaiChi_Routines_A4_Landscape_Collection.pdf")

print("Compiling portrait PDF...")
subprocess.run([
    CHROME_BIN, "--headless", "--disable-gpu", "--print-to-pdf-no-header",
    f"--print-to-pdf={p_pdf}", f"file://{p_html}"
], check=True)

print("Compiling landscape PDF...")
subprocess.run([
    CHROME_BIN, "--headless", "--disable-gpu", "--print-to-pdf-no-header",
    f"--print-to-pdf={l_pdf}", f"file://{l_html}"
], check=True)

with open(p_pdf, "rb") as f:
    p_pages = len(re.findall(rb"/Type\s*/Page\b", f.read()))

with open(l_pdf, "rb") as f:
    l_pages = len(re.findall(rb"/Type\s*/Page\b", f.read()))

print(f"RESULTS -> Portrait Page Count: {p_pages}, Landscape Page Count: {l_pages}")
