#!/usr/bin/env python3
"""
Clinical Hydrotherapy Reference Sheet: Glute/Lumbar Strengthening & Kinetic Chain Recovery
A4 Double-Sided (Exact 2 Pages) Poolside Reference with Clinical Imagery & Prescriptions.

Page 1: 12 Exercises — Glute & Lower Back Strengthening and Pain Relief
Page 2: 12 Exercises — Targeted Kinetic Chain Protocols:
  - 2 Calf / Ankle Plantarflexion
  - 2 Quad / Knee Extension
  - 4 Hip / Groin / Adductor / Pelvic Complex
  - 2 Back / Glenohumeral / Scapular Plane
  - 2 Scapula / Cervical Spine Stability (C4–C7 Strict Neutral)
"""

import os
import sys
from PIL import Image

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, PageBreak
)

# ───────────────────────────── PALETTE & STYLING ─────────────────────────────
NAVY_PRIMARY = colors.HexColor("#0B2545")       # Deep Clinical Oceanic Navy
TEAL_ACCENT  = colors.HexColor("#134E6F")       # Submerged Cyan/Teal
CYAN_HIGHLIGHT = colors.HexColor("#00A896")     # Water active indicator
TEXT_DARK    = colors.HexColor("#0F172A")       # Slate 900
TEXT_MUTED   = colors.HexColor("#475569")       # Slate 600
CARD_BG      = colors.HexColor("#F8FAFC")       # Off-white / Clean slate
CARD_BORDER  = colors.HexColor("#CBD5E1")       # Subtle hairline
BANNER_BG    = colors.HexColor("#EEF4F8")       # Light cyan tinted banner
ALERT_RED    = colors.HexColor("#B91C1C")       # Red warning flag

STYLE_BANNER_TITLE = ParagraphStyle(
    "BannerTitle",
    fontName="Helvetica-Bold",
    fontSize=9.5,
    leading=11.5,
    textColor=NAVY_PRIMARY,
)
STYLE_BANNER_SUB = ParagraphStyle(
    "BannerSub",
    fontName="Helvetica",
    fontSize=6.5,
    leading=8.5,
    textColor=TEXT_MUTED,
)
STYLE_EX_TITLE = ParagraphStyle(
    "ExTitle",
    fontName="Helvetica-Bold",
    fontSize=6.2,
    leading=7.2,
    textColor=NAVY_PRIMARY,
)
STYLE_EX_TAG = ParagraphStyle(
    "ExTag",
    fontName="Helvetica-Bold",
    fontSize=5.2,
    leading=6.2,
    textColor=TEAL_ACCENT,
)
STYLE_EX_CUE = ParagraphStyle(
    "ExCue",
    fontName="Helvetica",
    fontSize=5.3,
    leading=6.5,
    textColor=TEXT_DARK,
)
STYLE_EX_SAFETY = ParagraphStyle(
    "ExSafety",
    fontName="Helvetica-Bold",
    fontSize=4.9,
    leading=6.0,
    textColor=ALERT_RED,
)

# ───────────────────────────── NUMBERED CANVAS ─────────────────────────────
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_decorations(self, page_count):
        self.saveState()
        w, h = A4
        # Running Top Rule
        self.setStrokeColor(NAVY_PRIMARY)
        self.setLineWidth(1)
        self.line(8 * mm, h - 6 * mm, w - 8 * mm, h - 6 * mm)

        # Running Header
        self.setFont("Helvetica-Bold", 6.5)
        self.setFillColor(NAVY_PRIMARY)
        self.drawString(8 * mm, h - 5 * mm, "RUMBLE CLINICAL HYDROTHERAPY // POOLSIDE REFERENCE SHEET")

        self.setFont("Helvetica", 6.0)
        self.setFillColor(TEXT_MUTED)
        self.drawRightString(w - 8 * mm, h - 5 * mm, "CLINICAL GOVERNANCE: SPINAL & ORTHOPAEDIC SAFEGUARDS ACTIVE")

        # Running Bottom Rule
        self.setStrokeColor(CARD_BORDER)
        self.setLineWidth(0.6)
        self.line(8 * mm, 6.5 * mm, w - 8 * mm, 6.5 * mm)

        # Running Footer
        self.setFont("Helvetica", 5.8)
        self.setFillColor(TEXT_MUTED)
        footer_left = "PRESCRIBED PROTOCOL: C4-C7 FUSION STRICT NEUTRAL · RIGHT SHOULDER <80° ABDUCTION · LEFT KNEE <45° FLEXION"
        self.drawString(8 * mm, 4.2 * mm, footer_left)

        page_str = f"Page {self._pageNumber} of {page_count}"
        self.setFont("Helvetica-Bold", 6.0)
        self.setFillColor(NAVY_PRIMARY)
        self.drawRightString(w - 8 * mm, 4.2 * mm, page_str)
        self.restoreState()


# ───────────────────────────── EXERCISE DATA DEFINITIONS ─────────────────────────────
SIDE_1_EXERCISES = [
    {
        "num": "01",
        "title": "Rail Pelvic Tilts & Neutral Holds",
        "tag": "LUMBAR DECOMPRESSION · CORE",
        "dose": "Hold 10s · 6 reps",
        "cue": "Back flat against pool wall; draw belly to spine & flatten lumbar spine into wall.",
        "safety": "Cervical locked neutral; no breath holding.",
        "img": "rail-supported-hydro-pelvic-tilts.png",
    },
    {
        "num": "02",
        "title": "Submerged Band Glute Abduction",
        "tag": "GLUTEUS MEDIUS · PELVIC TILT",
        "dose": "3 sets x 12 reps / side",
        "cue": "Band anchored to rail/ankle; lateral outward sweep against water drag.",
        "safety": "Strict upright torso; avoid lateral pelvic hike.",
        "img": "submerged-banded-hip-abduction-extension.png",
    },
    {
        "num": "03",
        "title": "Rail Explosive Glute Kickbacks",
        "tag": "GLUTEUS MAXIMUS STRENGTH",
        "dose": "3 sets x 10 reps / side",
        "cue": "Hold pool rail; drive heel straight back squeezing glute at peak extension.",
        "safety": "Zero lumbar hyperextension; brace core firmly.",
        "img": "rail-supported-explosive-glute-kickbacks.png",
    },
    {
        "num": "04",
        "title": "Aquatic Supported Glute Bridges",
        "tag": "POSTERIOR CHAIN ACTIVATION",
        "dose": "3 sets x 12 reps (3s hold)",
        "cue": "Float noodles under shoulders; drive hips up squeezing glutes into neutral.",
        "safety": "Do not arch lower back past neutral plane.",
        "img": "glute-bridges.png",
    },
    {
        "num": "05",
        "title": "Pool-Rail Power Squat Pulses",
        "tag": "GLUTE / QUAD SYNERGY",
        "dose": "3 sets x 15 pulses",
        "cue": "Firm 2-hand rail grip; shallow mini-squat pulse driving through heels.",
        "safety": "Max 45° knee bend (left knee meniscus shield).",
        "img": "banded-pool-rail-power-squat-pulses.png",
    },
    {
        "num": "06",
        "title": "Noodle Knee Drives (Anti-Flexion)",
        "tag": "LOWER RECTUS · PSOAS RELIEF",
        "dose": "3 sets x 15 reps",
        "cue": "Noodle under axillae; draw knees upward smoothly using lower abdominals.",
        "safety": "Strictly no lumbar flexion or spinal rounding.",
        "img": "noodle-supported-knee-drives.png",
    },
    {
        "num": "07",
        "title": "Deep Water Core Suspensions",
        "tag": "AXIAL SPINE OFFLOAD",
        "dose": "3 sets x 30s holds",
        "cue": "Flotation belt in deep well; suspend body vertically drawing navel inward.",
        "safety": "Allow gravity to open lumbar disc spaces naturally.",
        "img": "deep-water-core-suspensions.png",
    },
    {
        "num": "08",
        "title": "Hydro Decompression Stretches",
        "tag": "FACET JOINT RELIEF",
        "dose": "4 mins continuous",
        "cue": "Hang gently from rail or noodle; allow buoyant upward force to separate discs.",
        "safety": "Zero jerking; relax paraspinous muscle guard.",
        "img": "hydro-decompression-stretches.png",
    },
    {
        "num": "09",
        "title": "Buoyancy Decompression Float",
        "tag": "SYMPATHETIC DOWNREGULATION",
        "dose": "5 mins restorative",
        "cue": "Cervical collar + knee bolster; full buoyant float in warm 34°C water.",
        "safety": "Neck fully supported; eyes closed, slow breaths.",
        "img": "buoyancy-decompression.png",
    },
    {
        "num": "10",
        "title": "Lower Kinetic Pelvic Power Drive",
        "tag": "SI JOINT STABILIZATION",
        "dose": "3 sets x 10 reps",
        "cue": "Banded ankle resistance; multi-planar glute drive against hydrostatic pressure.",
        "safety": "Maintain level ASIS pelvis; no rotational torque.",
        "img": "phase3-lower-kinetic-pelvic-power.png",
    },
    {
        "num": "11",
        "title": "Deep-Water Aquatic Crucible",
        "tag": "ISOMETRIC TRUNK STRENGTH",
        "dose": "3 sets x 45s",
        "cue": "Deep water scissor-kick hold with core braced in vertical cylinder.",
        "safety": "No spinal flexion; keep chest proud and calm.",
        "img": "phase4-deep-water-core-crucible.png",
    },
    {
        "num": "12",
        "title": "Full Decompression Surrender",
        "tag": "NEURO-FASCIA RESET",
        "dose": "4 mins final reset",
        "cue": "Supported supine elongation; gentle water turbulence soothing spasm.",
        "safety": "Total muscular release; neutral cervical cradle.",
        "img": "full-hydro-decompression-recovery.png",
    },
]

SIDE_2_EXERCISES = [
    # 2 CALF
    {
        "num": "13",
        "title": "Hydro Rail Calf Pumps (Gastroc)",
        "tag": "CALF 1/2 · VENOUS RETURN",
        "dose": "2 sets x 20 slow pumps",
        "cue": "Chest-depth water; rise onto balls of feet, squeeze gastrocnemius, 2s lower.",
        "safety": "Hydrostatic pressure assists venous return & flush.",
        "img": "supine-strap-hamstring-calf.png",
    },
    {
        "num": "14",
        "title": "Aqua Heel-Toe Stride Propulsion",
        "tag": "CALF 2/2 · SOLEUS POWER",
        "dose": "4 mins walking drill",
        "cue": "Exaggerate plantarflexion push-off from big toe; load soleus in water.",
        "safety": "Keep ankles aligned; avoid outward foot roll.",
        "img": "aqua-warmup-gait.png",
    },
    # 2 QUAD
    {
        "num": "15",
        "title": "Submerged Band Knee Extension",
        "tag": "QUAD 1/2 · VMO RECRUITMENT",
        "dose": "3 sets x 12 reps / leg",
        "cue": "Back to rail; extend lower leg forward against water drag to terminal extension.",
        "safety": "Controlled concentric kick; no hyperextension snap.",
        "img": "banded-submerged-leg-extensions-lateral-kicks.png",
    },
    {
        "num": "16",
        "title": "Rail Banded Shallow Squat Press",
        "tag": "QUAD 2/2 · ECCENTRIC CONTROL",
        "dose": "3 sets x 10 reps",
        "cue": "Band at waist; sit back into hips driving through quads to stand tall.",
        "safety": "Max 45° knee flexion strictly enforced (patellar guard).",
        "img": "rail-supported-banded-shallow-squat-presses.png",
    },
    # 4 HIPS / GROIN / ADDUCTOR
    {
        "num": "17",
        "title": "Banded Lateral Monster Walks",
        "tag": "HIP 1/4 · TFL / GLUTE MED",
        "dose": "3 sets x 12 paces left/right",
        "cue": "Semi-submerged band above knees; athletic lateral steps resisting inward collapse.",
        "safety": "Keep toes pointing forward; knees tracking second toe.",
        "img": "banded-lateral-monster-walks.png",
    },
    {
        "num": "18",
        "title": "Submerged Groin / Adductor Sweeps",
        "tag": "HIP 2/4 · ADDUCTOR LONGUS",
        "dose": "3 sets x 12 reps / leg",
        "cue": "Hold rail sideways; sweep leg across midline against water drag squeezing inner thigh.",
        "safety": "Keep pelvis square; no twisting at lumbar spine.",
        "img": "hydrodynamic-mobilization-circuit.png",
    },
    {
        "num": "19",
        "title": "Hydrodynamic Hip Flexor Opener",
        "tag": "HIP 3/4 · PSOAS LENGTHENING",
        "dose": "2 sets x 30s / side",
        "cue": "Split stance holding rail; gently sink hips forward stretching anterior hip capsule.",
        "safety": "Do not hyperextend lumbar spine; tuck pelvis under.",
        "img": "dynamic-thermal-gait-warmup.png",
    },
    {
        "num": "20",
        "title": "Multi-Planar Aqua Hip Floss",
        "tag": "HIP 4/4 · CAPSULAR MOBILITY",
        "dose": "3 mins continuous",
        "cue": "Submerged smooth circular leg glides (circumduction) in warm soothing water.",
        "safety": "Stay strictly within pain-free anatomical envelope.",
        "img": "aqua-cooldown-walking.png",
    },
    # 2 BACK / SHOULDER
    {
        "num": "21",
        "title": "Kickboard Aquatic Press-Downs",
        "tag": "BACK/SHOULDER 1/2 · LATISSIMUS",
        "dose": "3 sets x 10 reps",
        "cue": "Grip kickboard with both hands at chest level; press straight down engaging lats.",
        "safety": "Right shoulder STRICTLY below 80° abduction/flexion.",
        "img": "kickboard-aquatic-press-downs.png",
    },
    {
        "num": "22",
        "title": "Submerged Unilateral Band Rows",
        "tag": "BACK/SHOULDER 2/2 · RHOMBOIDS",
        "dose": "3 sets x 12 reps / arm",
        "cue": "Band anchored to rail at waist height; elbow tucked low, draw back into water.",
        "safety": "Elbow below shoulder line; do not shrug upper trap.",
        "img": "submerged-unilateral-band-rows.png",
    },
    # 2 SCAPULA / CERVICAL
    {
        "num": "23",
        "title": "Submerged Banded Low W-Rows",
        "tag": "SCAPULA 1/2 · MID/LOWER TRAP",
        "dose": "3 sets x 12 reps",
        "cue": "Elbows tucked tight to ribs; squeeze scapulae down & back into water resistance.",
        "safety": "Zero shoulder shrug; avoid C7-T1 burning trigger.",
        "img": "submerged-banded-low-rows.png",
    },
    {
        "num": "24",
        "title": "Aquatic Scapular & Chin Retract",
        "tag": "CERVICAL 2/2 · DEEP FLEXORS",
        "dose": "3 sets x 10 reps (5s hold)",
        "cue": "Submerged horizontal arm sculling paired with gentle axial cervical chin tuck.",
        "safety": "C4-C7 FUSION STRICT NEUTRAL: No head tilting or neck shear.",
        "img": "aquatic-gait-scapular-activation.png",
    },
]

# ───────────────────────────── CARD BUILDER ─────────────────────────────
def build_exercise_card(ex, img_dir, card_w, card_h):
    """
    Builds a structured, publication-quality exercise card table.
    Left: High-resolution HUD exercise schematic.
    Right: Title, target tag, dosage, clinical cue, safety mandate.
    """
    img_path = os.path.join(img_dir, ex["img"])
    img_col_w = card_w * 0.42
    text_col_w = card_w * 0.58

    # Image aspect ratio sizing (original is approx 2.08:1)
    target_img_w = img_col_w - 2 * mm
    target_img_h = target_img_w / 2.08
    if target_img_h > card_h - 2 * mm:
        target_img_h = card_h - 2 * mm
        target_img_w = target_img_h * 2.08

    rl_img = RLImage(img_path, width=target_img_w, height=target_img_h)

    # Title with badge number
    title_text = f"<b><font color='{NAVY_PRIMARY.hexval()}'>{ex['num']}.</font></b> {ex['title']}"
    p_title = Paragraph(title_text, STYLE_EX_TITLE)
    p_tag = Paragraph(f"{ex['tag']} · <i>{ex['dose']}</i>", STYLE_EX_TAG)
    p_cue = Paragraph(f"<b>CUE:</b> {ex['cue']}", STYLE_EX_CUE)
    p_safety = Paragraph(f"<b>SAFEGUARD:</b> {ex['safety']}", STYLE_EX_SAFETY)

    text_flowables = [p_title, p_tag, Spacer(1, 0.4 * mm), p_cue, Spacer(1, 0.3 * mm), p_safety]

    cell_table = Table(
        [[rl_img, text_flowables]],
        colWidths=[img_col_w, text_col_w],
        rowHeights=[card_h]
    )
    cell_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 1.0 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.0 * mm),
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 0.6, CARD_BORDER),
        ('LINEAFTER', (0, 0), (0, 0), 0.4, CARD_BORDER),
    ]))
    return cell_table


def build_page_grid(exercises, banner_title, banner_sub, img_dir, page_w, page_h):
    """
    Constructs a 12-exercise grid (6 rows x 2 columns) fitting perfectly on one A4 page.
    """
    margin = 8 * mm
    avail_w = page_w - 2 * margin
    avail_h = page_h - 2 * margin - 12 * mm  # Subtract running header & footer

    # Header Banner
    banner_text = [
        Paragraph(banner_title.upper(), STYLE_BANNER_TITLE),
        Paragraph(banner_sub, STYLE_BANNER_SUB)
    ]
    banner_table = Table(
        [[banner_text]],
        colWidths=[avail_w],
        rowHeights=[11 * mm]
    )
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BANNER_BG),
        ('BOX', (0, 0), (-1, -1), 0.8, TEAL_ACCENT),
        ('LEFTPADDING', (0, 0), (-1, -1), 3 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.5 * mm),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    grid_h = avail_h - 13 * mm  # remaining for 6 rows
    row_h = grid_h / 6.0
    col_w = (avail_w - 2 * mm) / 2.0

    table_data = []
    for r in range(6):
        row_cells = []
        for c in range(2):
            idx = r * 2 + c
            ex = exercises[idx]
            card = build_exercise_card(ex, img_dir, col_w, row_h - 1.2 * mm)
            row_cells.append(card)
        table_data.append(row_cells)

    grid_table = Table(
        table_data,
        colWidths=[col_w, col_w],
        rowHeights=[row_h] * 6
    )
    grid_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 1 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 1 * mm),
        ('TOPPADDING', (0, 0), (-1, -1), 0.6 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0.6 * mm),
    ]))

    return [banner_table, Spacer(1, 1.5 * mm), grid_table]


def main():
    img_dir = "clinical_exercise_library/images"
    output_pdf = "agent_reports/Hydrotherapy_Glute_LowerBack_A4_DoubleSided.pdf"
    os.makedirs(os.path.dirname(output_pdf), exist_ok=True)

    page_w, page_h = A4
    margin = 8 * mm

    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=8 * mm,
        bottomMargin=8 * mm,
    )

    story = []

    # ── PAGE 1: 12 Glute & Lower Back Exercises ──
    story.extend(build_page_grid(
        SIDE_1_EXERCISES,
        banner_title="Sheet 1: Gluteus Complex & Lower Back Clinical Protocol (12 Protocols)",
        banner_sub="Hydrostatic Decompression (32°C–34°C Pool) · Targeted Gluteus Medius/Maximus Activation · Lumbar Facet Offload · Transverse Bracing",
        img_dir=img_dir,
        page_w=page_w,
        page_h=page_h
    ))

    story.append(PageBreak())

    # ── PAGE 2: 12 Kinetic Chain Protocols ──
    story.extend(build_page_grid(
        SIDE_2_EXERCISES,
        banner_title="Sheet 2: Kinetic Chain Recovery & Spinal Alignment (12 Protocols)",
        banner_sub="Targeted Distribution: 2 Calf/Vascular · 2 Quad/VMO · 4 Hip/Groin/Adductor Complex · 2 Back/Latissimus · 2 Scapula/Cervical Spine",
        img_dir=img_dir,
        page_w=page_w,
        page_h=page_h
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✓ Successfully generated: {output_pdf}")

if __name__ == "__main__":
    main()
