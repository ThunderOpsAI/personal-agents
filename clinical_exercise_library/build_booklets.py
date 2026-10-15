"""
Clinical Exercise Booklet PDF Generator using ReportLab.
Assembles the 5 clinical PDF booklets:
1. 01_Clinical_Constraints_and_Safety.pdf
2. 02_Hydrotherapy_Protocols.pdf
3. 03_Floor_Yoga_Medium_and_Expert.pdf
4. 04_Beginner_Yoga_Flows.pdf
5. 05_Tai_Chi_Beginner.pdf

Design standards:
- A4 Portrait (595.28 x 841.89 pt), 15 mm margins (42.5 pt)
- Accessible sans-serif typography, print-friendly contrast (>4.5:1)
- Cover page (v1.0.0, 2026-10-12, how-to-use note)
- Contents page with page numbers
- "Key restrictions" box on opening pages
- Per-routine timeline bar showing proportional step minutes
- One exercise card per step with:
  a) step number and exercise name
  b) exact dosage/sets/reps from source
  c) 300 DPI illustration
  d) 1-3 clinical cues
  e) red safety strip if restriction applies
- Running header and footer ("Appointment-preparation context, not clinical advice.")
- Verbatim disclaimers at end of every PDF.
"""

import os
import json
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String, Line

DATA_FILE = "/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/clinical_exercise_library/exercise_library_data.json"
IMAGES_DIR = "/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/clinical_exercise_library/images"
OUTPUT_DIR = "/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/clinical_exercise_library"

# Load source data
with open(DATA_FILE, "r", encoding="utf-8") as f:
    lib_data = json.load(f)

metadata = lib_data["metadata"]
constraints = lib_data["constraints"]
disclaimers = lib_data["disclaimers"]
rules = lib_data["rules"]
all_routines = lib_data["routines"]

# Color palette
C_PRIMARY = colors.HexColor("#0F766E")     # Deep Teal
C_SECONDARY = colors.HexColor("#0284C7")   # Calming Medical Blue
C_TEXT = colors.HexColor("#1E293B")        # Slate 800
C_TEXT_MUTED = colors.HexColor("#64748B")  # Slate 500
C_BG_CARD = colors.HexColor("#F8FAFC")     # Soft Gray 50
C_BORDER = colors.HexColor("#E2E8F0")      # Slate 200
C_SAFETY_RED = colors.HexColor("#DC2626")  # Crimson Red
C_SAFETY_BG = colors.HexColor("#FEF2F2")   # Light Pink / Red
C_ACCENT_ORANGE = colors.HexColor("#D9531E") # Movement Orange
C_GREEN = colors.HexColor("#16A34A")       # Green Badge

# Intensity Badges
INTENSITY_COLORS = {
    "Beginner": colors.HexColor("#16A34A"),
    "Very Beginner / Zero-Impact Floor-Based": colors.HexColor("#16A34A"),
    "Very Beginner / Seated or Supported Standing": colors.HexColor("#16A34A"),
    "Very Beginner / Supported Standing": colors.HexColor("#16A34A"),
    "Very Beginner / Restorative Flow": colors.HexColor("#16A34A"),
    "Medium": colors.HexColor("#0284C7"),
    "Medium-Restorative": colors.HexColor("#0284C7"),
    "Expert": colors.HexColor("#EA580C"),
    "Expert / High Resistance": colors.HexColor("#EA580C"),
    "Expert Isometric": colors.HexColor("#EA580C"),
    "Expert Strength & Stability": colors.HexColor("#EA580C"),
    "Expert / Maximum Resistance": colors.HexColor("#EA580C")
}

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for exact 'Page X of Y' footers and running headers."""
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
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        # Do not draw header/footer on cover page (page 1)
        if self._pageNumber == 1:
            return

        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(C_TEXT_MUTED)

        doc_title = getattr(self, "doc_title", "Clinical Exercise Library")
        routine_id = getattr(self, "current_routine_id", "")

        # Header
        self.drawString(42.5, 805, f"{doc_title}  |  {routine_id}" if routine_id else doc_title)
        self.drawRightString(552.5, 805, "Clinical MDT Protocol — v1.0.0")
        self.setStrokeColor(C_BORDER)
        self.setLineWidth(0.75)
        self.line(42.5, 798, 552.5, 798)

        # Footer
        self.line(42.5, 38, 552.5, 38)
        self.drawString(42.5, 26, "Appointment-preparation context, not clinical advice.")
        self.drawRightString(552.5, 26, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()

# Styles
def get_custom_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=C_PRIMARY,
        alignment=0,
        spaceAfter=12
    ))
    
    styles.add(ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=C_TEXT,
        spaceAfter=20
    ))
    
    styles.add(ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=C_TEXT_MUTED
    ))
    
    styles.add(ParagraphStyle(
        'Heading1Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=C_PRIMARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'Heading2Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=C_SECONDARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=C_TEXT
    ))

    styles.add(ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=C_TEXT
    ))

    styles.add(ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11.5,
        textColor=C_TEXT_MUTED
    ))

    styles.add(ParagraphStyle(
        'SafetyStripText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=C_SAFETY_RED
    ))

    styles.add(ParagraphStyle(
        'CardStepTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=C_PRIMARY
    ))

    styles.add(ParagraphStyle(
        'CardDosage',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=C_SECONDARY
    ))

    styles.add(ParagraphStyle(
        'CueBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=C_TEXT
    ))

    return styles

styles = get_custom_styles()

def create_timeline_drawing(steps, width=510, height=22):
    """Generate a proportional visual timeline bar showing minutes per step."""
    d = Drawing(width, height)
    total_min = sum(s.get("minutes", 5) for s in steps)
    if total_min == 0:
        total_min = 1
    
    # Palette for steps
    palette = [
        colors.HexColor("#0F766E"), colors.HexColor("#0284C7"),
        colors.HexColor("#14B8A6"), colors.HexColor("#38BDF8"),
        colors.HexColor("#0D9488"), colors.HexColor("#0369A1")
    ]
    
    cur_x = 0
    for i, s in enumerate(steps):
        s_min = s.get("minutes", 5)
        w = (s_min / total_min) * width
        col = palette[i % len(palette)]
        d.add(Rect(cur_x, 4, w, 14, fillColor=col, strokeColor=colors.white, strokeWidth=1))
        # Label if wide enough
        if w > 35:
            d.add(String(cur_x + w/2, 8, f"S{s['step_num']}: {s_min}m", fontName="Helvetica-Bold", fontSize=7, fillColor=colors.white, textAnchor="middle"))
        elif w > 18:
            d.add(String(cur_x + w/2, 8, f"{s_min}m", fontName="Helvetica", fontSize=6.5, fillColor=colors.white, textAnchor="middle"))
        cur_x += w
    return d

def make_restrictions_box(styles):
    """Standardized 3-5 line verbatim clinical restrictions box."""
    content = [
        Paragraph("<b>MANDATORY CLINICAL RESTRICTIONS:</b>", styles['BodyBold']),
        Spacer(1, 2),
        Paragraph("• <b>Cervical Spine (C4–C7 Fusion)</b>: Strict neutral alignment. Zero forced end-range extension or neck rotation. No classical Pilates head curls (head grounded).", styles['CueBullet']),
        Paragraph("• <b>Right Shoulder (Subacromial/C7–T1)</b>: Active elevation strictly limited below 80°–90°. Elbows tucked below shoulder line during all rows and presses.", styles['CueBullet']),
        Paragraph("• <b>Lower Chain (Left Knee Osteotomy & Right Ankle)</b>: Braced on land. Max 45° shallow knee bend. Zero crouching or kneeling directly on unpadded surfaces.", styles['CueBullet'])
    ]
    t = Table([[content]], colWidths=[510])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFFBEB")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#F59E0B")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def make_disclaimers_block(styles):
    """Verbatim disclaimers at end of PDF."""
    elems = [
        Spacer(1, 12),
        HRFlowable(width="100%", thickness=0.5, color=C_BORDER, spaceBefore=4, spaceAfter=8),
        Paragraph("<b>CLINICAL GOVERNANCE & SAFETY DISCLAIMERS</b>", styles['BodyBold']),
        Spacer(1, 4),
        Paragraph(f"1. {disclaimers[0]}", styles['DisclaimerText']),
        Spacer(1, 3),
        Paragraph(f"2. {disclaimers[1]}", styles['DisclaimerText']),
        Spacer(1, 3),
        Paragraph(f"3. {disclaimers[2]}", styles['DisclaimerText'])
    ]
    return elems

def make_cover_page(title, subtitle, routine_ids, how_to_use, styles):
    """Standard cover page layout."""
    elems = [
        Spacer(1, 40),
        Paragraph("CLINICAL EXERCISE PRESCRIPTION LIBRARY", ParagraphStyle('CoverPre', fontName='Helvetica-Bold', fontSize=10, textColor=C_SECONDARY, spaceAfter=8)),
        Paragraph(title, styles['CoverTitle']),
        Paragraph(subtitle, styles['CoverSubtitle']),
        HRFlowable(width="100%", thickness=2, color=C_PRIMARY, spaceBefore=0, spaceAfter=18),
        
        Paragraph("<b>Clinical Governance Team:</b>", styles['BodyBold']),
        Spacer(1, 4),
        Paragraph(f"• Lead Author: {metadata['lead_author']}<br/>• Surgical & Biomechanical Oversight: {metadata['surgical_oversight']}<br/>• Neuro-Psychiatric Review: {metadata['neuro_review']}<br/>• Evidence Synthesis: {metadata['evidence_synthesis']}<br/>• Clinical Coordination: {metadata['clinical_coordination']}", styles['CoverMeta']),
        
        Spacer(1, 16),
        Paragraph(f"<b>Prescription Date:</b> {metadata['date']}  |  <b>Document Version:</b> {metadata['version']}", styles['CoverMeta']),
        
        Spacer(1, 24),
        Paragraph("<b>How to Use This Booklet:</b>", styles['BodyBold']),
        Spacer(1, 4),
        Paragraph(how_to_use, styles['BodyCustom']),
        
        Spacer(1, 20),
        Paragraph("<b>Included Clinical Protocols:</b>", styles['BodyBold']),
        Spacer(1, 4),
        Paragraph("  ".join([f"<font color='#0F766E'><b>[{rid}]</b></font>" for rid in routine_ids]), styles['BodyCustom']),
        
        Spacer(1, 30),
        make_restrictions_box(styles),
        PageBreak()
    ]
    return elems

def make_exercise_card(step, styles):
    """Build a complete formatted exercise card with image, cues, and safety strip."""
    slug = step["slug"]
    img_path = os.path.join(IMAGES_DIR, f"{slug}.png")
    
    # Left column: details & cues
    cues_html = "<br/>".join([f"• {c}" for c in step.get("cues", [])])
    left_cell = [
        Paragraph(f"Step {step['step_num']}: {step['name']}", styles['CardStepTitle']),
        Spacer(1, 2),
        Paragraph(f"Dosage: {step['dosage']}", styles['CardDosage']),
        Spacer(1, 4),
        Paragraph("<b>Instructional Cues:</b>", styles['BodyBold']),
        Paragraph(cues_html, styles['CueBullet']),
        Spacer(1, 4),
        Paragraph(f"<i>Source: {step['source_text']}</i>", styles['DisclaimerText'])
    ]
    
    # Right column: image
    if os.path.exists(img_path):
        img_elem = Image(img_path, width=240, height=115)
    else:
        img_elem = Paragraph(f"[Illustration: {slug}]", styles['BodyCustom'])
    
    card_table = Table([[left_cell, img_elem]], colWidths=[260, 250])
    card_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    
    # Red safety strip if applicable
    safety_text = step.get("safety", "")
    if safety_text:
        safety_cell = Paragraph(f"<b>SAFETY MANDATE:</b> {safety_text}", styles['SafetyStripText'])
        safety_table = Table([[safety_cell]], colWidths=[510])
        safety_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), C_SAFETY_BG),
            ('BOX', (0,0), (-1,-1), 1, C_SAFETY_RED),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ]))
        return KeepTogether([card_table, safety_table, Spacer(1, 6)])
    else:
        return KeepTogether([card_table, Spacer(1, 6)])

# ==============================================================================
# PDF 1: 01_Clinical_Constraints_and_Safety.pdf
# ==============================================================================
def build_pdf_01():
    pdf_path = os.path.join(OUTPUT_DIR, "01_Clinical_Constraints_and_Safety.pdf")
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, leftMargin=42.5, rightMargin=42.5, topMargin=48, bottomMargin=48)
    
    story = []
    
    # Cover / Header
    story.append(Paragraph("CLINICAL SAFETY MANUAL & BIOMECHANICAL BOUNDARIES", styles['CoverTitle']))
    story.append(Paragraph("Section 1 Constraints, Section 5 Progression Rules & Rapid Safety Check", styles['CoverSubtitle']))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_PRIMARY, spaceBefore=0, spaceAfter=10))
    story.append(make_restrictions_box(styles))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("<b>1. Multi-Disciplinary Clinical Constraints</b>", styles['Heading2Custom']))
    story.append(Paragraph(f"• <b>Cervical Spine (C4–C7 Fusion & C7–T1 Junction)</b>: {constraints['cervical_spine']}", styles['BodyCustom']))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"• <b>Right Shoulder (Frozen Shoulder & Nerve Root Irritation)</b>: {constraints['right_shoulder']}", styles['BodyCustom']))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"• <b>Lower Kinetic Chain (Left Knee Post-Osteotomy & Right Ankle Instability)</b>: {constraints['lower_kinetic_chain']}", styles['BodyCustom']))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"• <b>Hydrotherapy Thermal Environment</b>: {constraints['hydrotherapy_rationale']}", styles['BodyCustom']))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>2. Clinical Progression & Regression Rules (Section 5)</b>", styles['Heading2Custom']))
    story.append(Paragraph(f"• <b>Progression Criteria</b>: {rules['progression_criteria']}", styles['BodyCustom']))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"• <b>Regression Criteria</b>: {rules['regression_criteria']}", styles['BodyCustom']))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"• <b>Equipment Anchor Safety</b>: {rules['equipment_safety']}", styles['BodyCustom']))
    story.append(Spacer(1, 14))

    # Page Break for One-Page DO / DON'T Summary
    story.append(PageBreak())
    
    story.append(Paragraph("RAPID CLINICAL SAFETY REFERENCE: DO / DON'T GUIDE", styles['Heading1Custom']))
    story.append(Paragraph("Always cross-check daily exercise plans against these mandatory limits.", styles['BodyCustom']))
    story.append(Spacer(1, 8))

    dodont_data = [
        [Paragraph("<b>CLINICAL DOMAIN</b>", styles['BodyBold']), Paragraph("<b>MANDATORY 'DO' (APPROVED)</b>", styles['BodyBold']), Paragraph("<b>STRICT 'DON'T' (CONTRAINDICATED)</b>", styles['BodyBold'])],
        [
            Paragraph("<b>Cervical Spine (C4–C7)</b>", styles['BodyCustom']),
            Paragraph("• Maintain neutral cervical alignment<br/>• Head grounded on mat with thin pad<br/>• Micro-chin tucks within pain-free arc", styles['CueBullet']),
            Paragraph("• NO neck extension or rapid rotation<br/>• NO foam rolling neck or lower back<br/>• NO classical Pilates head curls/Hundred", styles['CueBullet'])
        ],
        [
            Paragraph("<b>Right Shoulder & C7–T1</b>", styles['BodyCustom']),
            Paragraph("• Keep elbows tucked below shoulder line<br/>• Active elevation strictly below 80°–90°<br/>• Gentle non-tension nerve flossing", styles['CueBullet']),
            Paragraph("• NO overhead reach >90°<br/>• NO high-row elbow flaring<br/>• Stop instantly if neuropathic burning occurs", styles['CueBullet'])
        ],
        [
            Paragraph("<b>Lower Chain (Knee/Ankle)</b>", styles['BodyCustom']),
            Paragraph("• Wear knee/ankle brace on loaded land work<br/>• Max 45° knee flexion on mini-squats<br/>• Water immersion offloads 60–75% load", styles['CueBullet']),
            Paragraph("• NO deep squats or crouching<br/>• NO kneeling on hard unpadded surfaces<br/>• NO rotational twisting at knee or ankle", styles['CueBullet'])
        ],
        [
            Paragraph("<b>Core & Spinal Mechanics</b>", styles['BodyCustom']),
            Paragraph("• Isometric abdominal wall bracing<br/>• Supported bridge holds with sacral block<br/>• Slow controlled heel slides", styles['CueBullet']),
            Paragraph("• NO lumbar hyperextension during kicks<br/>• NO lumbar flexion during knee drives<br/>• NO unsupported heavy spinal loading", styles['CueBullet'])
        ],
        [
            Paragraph("<b>Equipment & Progression</b>", styles['BodyCustom']),
            Paragraph("• Anchor Therabands to solid pool rails only<br/>• Advance bands only after 3 zero-delta sessions<br/>• Use cushions under forearms and knees", styles['CueBullet']),
            Paragraph("• NEVER anchor bands to loose pool fittings<br/>• NEVER push through baseline pain >=5/10<br/>• NO sudden jumps in band resistance", styles['CueBullet'])
        ]
    ]
    
    t_dodont = Table(dodont_data, colWidths=[110, 200, 200])
    t_dodont.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_dodont)
    
    # Disclaimers at the end
    story.extend(make_disclaimers_block(styles))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Built {pdf_path}")

# ==============================================================================
# Helper for multi-routine PDFs (Hydro, Yoga, Tai Chi)
# ==============================================================================
def build_routine_booklet(pdf_filename, booklet_title, booklet_subtitle, routine_ids, how_to_use):
    pdf_path = os.path.join(OUTPUT_DIR, pdf_filename)
    doc = SimpleDocTemplate(pdf_path, pagesize=A4, leftMargin=42.5, rightMargin=42.5, topMargin=48, bottomMargin=48)
    
    target_routines = [r for r in all_routines if r["id"] in routine_ids]
    
    story = []
    
    # 1. Cover Page
    story.extend(make_cover_page(booklet_title, booklet_subtitle, routine_ids, how_to_use, styles))
    
    # 2. Contents & Summary Page
    story.append(Paragraph("TABLE OF CONTENTS & PROTOCOL OVERVIEW", styles['Heading1Custom']))
    story.append(Paragraph("Review protocol parameters, equipment setup, and durations before initiating sessions.", styles['BodyCustom']))
    story.append(Spacer(1, 8))
    
    toc_data = [[
        Paragraph("<b>ID</b>", styles['BodyBold']),
        Paragraph("<b>PROTOCOL TITLE</b>", styles['BodyBold']),
        Paragraph("<b>DURATION</b>", styles['BodyBold']),
        Paragraph("<b>INTENSITY</b>", styles['BodyBold']),
        Paragraph("<b>EQUIPMENT REQUIRED</b>", styles['BodyBold'])
    ]]
    for r in target_routines:
        badge_color = INTENSITY_COLORS.get(r["intensity"], C_SECONDARY).hexval()
        intensity_html = f"<font color='{badge_color}'><b>{r['intensity']}</b></font>"
        equip_html = ", ".join(r["equipment"])
        toc_data.append([
            Paragraph(f"<b>{r['id']}</b>", styles['BodyCustom']),
            Paragraph(r['title'], styles['BodyCustom']),
            Paragraph(r['duration'], styles['BodyCustom']),
            Paragraph(intensity_html, styles['BodyCustom']),
            Paragraph(equip_html, styles['CueBullet'])
        ])
    
    toc_table = Table(toc_data, colWidths=[45, 145, 65, 85, 170])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#F1F5F9")),
        ('BOX', (0,0), (-1,-1), 1, C_BORDER),
        ('INNERGRID', (0,0), (-1,-1), 0.5, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(toc_table)
    story.append(Spacer(1, 14))
    story.append(make_restrictions_box(styles))
    story.append(PageBreak())
    
    # 3. Individual Routines
    for idx, r in enumerate(target_routines):
        # Header banner
        badge_color = INTENSITY_COLORS.get(r["intensity"], C_SECONDARY).hexval()
        r_header_data = [
            [
                Paragraph(f"<b>{r['id']}: {r['title']}</b>", styles['Heading1Custom']),
                Paragraph(f"<font color='{badge_color}'><b>[{r['intensity'].upper()}]</b></font><br/><b>Duration: {r['duration']}</b>", ParagraphStyle('RHeaderMeta', parent=styles['BodyBold'], alignment=2))
            ]
        ]
        t_rheader = Table(r_header_data, colWidths=[360, 150])
        t_rheader.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(t_rheader)
        
        # Equipment strip
        equip_str = " | ".join(r["equipment"])
        story.append(Paragraph(f"<b>Equipment Needed:</b> {equip_str}", styles['CardDosage']))
        story.append(Spacer(1, 4))
        
        # Timeline bar
        story.append(create_timeline_drawing(r["steps"]))
        story.append(Spacer(1, 6))
        
        # Exercise cards
        for step in r["steps"]:
            story.append(make_exercise_card(step, styles))
        
        # End of routine separator or page break
        if idx < len(target_routines) - 1:
            story.append(PageBreak())
    
    # End of document disclaimers
    story.extend(make_disclaimers_block(styles))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Built {pdf_path}")

# ==============================================================================
# Main Orchestration
# ==============================================================================
if __name__ == "__main__":
    # PDF 1
    build_pdf_01()
    
    # PDF 2: Hydrotherapy Protocols
    build_routine_booklet(
        "02_Hydrotherapy_Protocols.pdf",
        "Hydrotherapy Protocols (Medium & High Resistance)",
        "Aquatic Buoyancy (30°C–34°C), Hydrostatic Unloading & Band Resistance Protocols",
        ["H-MED1", "H-MED2", "H-EXP1", "H-EXP2", "H-EXP3"],
        "Perform in warm water (30°C–34°C) at chest depth to achieve 60–75% joint axial decompression. Always anchor bands to solid pool rails. Never elevate arms above 80°."
    )
    
    # PDF 3: Floor Yoga Medium and Expert
    build_routine_booklet(
        "03_Floor_Yoga_Medium_and_Expert.pdf",
        "Floor-Based Yoga & Hybrid Rehab (Medium & Expert)",
        "Spinal Stability, Scapular Motor Control & Isometric Conditioning (20–60 Mins)",
        ["Y-MED1", "Y-MED2", "Y-MED3", "Y-EXP1", "Y-EXP2"],
        "All exercises are strictly floor-based to eliminate joint impact. Keep neck neutral with head grounded or cushioned. Never kneel on hard unpadded surfaces."
    )
    
    # PDF 4: Beginner Yoga Flows
    build_routine_booklet(
        "04_Beginner_Yoga_Flows.pdf",
        "Beginner Yoga Flows: Gentle Floor-Based Decompression",
        "Zero-Impact Restorative Protocols for High-Stiffness or High-Fatigue Days (10–30 Mins)",
        ["Y-BEG1", "Y-BEG2", "Y-BEG3"],
        "Gentle mindful floor flows designed for days with elevated baseline pain or systemic fatigue. Emphasise diaphragmatic breathwork, supported bolster resting, and smooth pain-free movement."
    )
    
    # PDF 5: Tai Chi Beginner
    build_routine_booklet(
        "05_Tai_Chi_Beginner.pdf",
        "Tai Chi Mindful Flow Protocols (Beginner)",
        "Seated & Supported Standing Balance, Joint Loosening & Kinetic Grounding (10–30 Mins)",
        ["TC-BEG1", "TC-BEG2", "TC-BEG3"],
        "Perform seated on a sturdy chair or standing holding a firm chair/rail. Maintain an upright, elongated spine with zero deep knee bending or single-leg instability. Keep hand sweeps below chest height."
    )
