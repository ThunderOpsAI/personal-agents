"""
Professional Clinical Consultation Agenda & Symptom Inventory PDF Generator.
Adheres strictly to the create-pdf skill specifications:
- ReportLab Platypus flowable architecture (clean reflow, no coordinate overlaps)
- TrueType font registration with Unicode support (Arial on macOS)
- Single accent colour (#1F4E79) with neutral ink (#1A1A1A), muted (#64748B), and hairlines (#CBD5E1)
- Two-pass NumberedCanvas for accurate "Page X of Y" and running headers
- Structured, readable clinical cards without emoji or jarring multi-colour fills
- Clean executive metadata table and consultation priorities callout
"""

import os
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)

# ───────────────────────────── CONFIGURATION ─────────────────────────────
CONFIG = dict(
    title="Clinical Consultation Agenda & Symptom Inventory",
    subtitle="Structured Patient Experience & Pathophysiology for Bedside Review",
    patient="James Jones",
    dob="20/01/1986 (Age: 40)",
    medicare="3634 32502 1 (Ref: 1, Exp: 07/2032)",
    crn="303065993H",
    date="Wednesday, 4 November 2026",
    clinic="Dr. Nathan Anderson's Clinic (GP Resident)",
    doctor="Dr. Nathan Anderson",
    footer_text="Confidential Medical Consultation Briefing — For Dr. Nathan Anderson's Clinic Review",
    pagesize=A4,
    margin=14 * mm,
    top_margin=14 * mm,
    bottom_margin=14 * mm,
    accent="#1F4E79",       # Deep Clinical Navy
    accent_dark="#163756",
    output="James_Jones_Clinical_Consult_Agenda_2026-11-04.pdf",
)

ACCENT = colors.HexColor(CONFIG["accent"])
ACCENT_DARK = colors.HexColor(CONFIG["accent_dark"])
INK = colors.HexColor("#1A1A1A")          # Body text (near-black, never pure black)
MUTED = colors.HexColor("#64748B")        # Captions, labels, secondary info
RULE = colors.HexColor("#CBD5E1")         # Hairlines and dividers
BORDER = colors.HexColor("#94A3B8")       # Subtle outer card borders
CARD_BG = colors.HexColor("#FFFFFF")
HEADER_BG = colors.HexColor("#F1F5F9")    # Subtle slate tint for card headers
ACTION_BG = colors.HexColor("#F8FAFC")    # Clean tint for action blocks
PRIORITY_BG = colors.HexColor("#EEF4FA")  # Key takeaway callout tint


# ───────────────────────────── FONT REGISTRATION ──────────────────────────
def register_fonts():
    """Register system Arial TrueType fonts for macOS, with fallback to Helvetica."""
    base = "/System/Library/Fonts/Supplemental/"
    files = {
        "Body": base + "Arial.ttf",
        "Body-Bold": base + "Arial Bold.ttf",
        "Body-Italic": base + "Arial Italic.ttf",
        "Body-BoldItalic": base + "Arial Bold Italic.ttf",
    }
    if all(os.path.exists(p) for p in files.values()):
        for name, path in files.items():
            pdfmetrics.registerFont(TTFont(name, path))
        pdfmetrics.registerFontFamily(
            "Body",
            normal="Body",
            bold="Body-Bold",
            italic="Body-Italic",
            boldItalic="Body-BoldItalic"
        )
        return "Body", "Body-Bold", "Body-Italic", "Body-BoldItalic"
    return "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique"


F_NORM, F_BOLD, F_ITAL, F_BOLDITAL = register_fonts()


# ───────────────────────────── STYLES ─────────────────────────────────────
def S(name, **kw):
    base = dict(
        fontName=F_NORM,
        fontSize=9,
        leading=12.5,
        textColor=INK,
        spaceAfter=0,
    )
    base.update(kw)
    return ParagraphStyle(name, **base)


STYLES = dict(
    title=S("DocTitle", fontName=F_BOLD, fontSize=15, leading=18, textColor=ACCENT, spaceAfter=2),
    subtitle=S("DocSubtitle", fontName=F_NORM, fontSize=9, leading=12, textColor=MUTED, spaceAfter=6),
    meta_key=S("MetaKey", fontName=F_BOLD, fontSize=8, leading=11, textColor=ACCENT),
    meta_val=S("MetaVal", fontName=F_NORM, fontSize=8, leading=11, textColor=INK),
    callout_bold=S("CalloutBold", fontName=F_BOLD, fontSize=8.5, leading=12, textColor=ACCENT),
    callout_text=S("CalloutText", fontName=F_NORM, fontSize=8.5, leading=12, textColor=INK),
    item_num=S("ItemNum", fontName=F_BOLD, fontSize=8.5, leading=11, textColor=colors.white),
    item_title=S("ItemTitle", fontName=F_BOLD, fontSize=9, leading=12, textColor=ACCENT),
    field_label=S("FieldLabel", fontName=F_BOLD, fontSize=8, leading=11, textColor=ACCENT),
    body_text=S("BodyText", fontName=F_NORM, fontSize=8.5, leading=11.5, textColor=INK),
    action_text=S("ActionText", fontName=F_NORM, fontSize=8.5, leading=11.5, textColor=INK),
    section_head=S("SectionHead", fontName=F_BOLD, fontSize=10, leading=13, textColor=ACCENT, spaceBefore=8, spaceAfter=4),
)


def P(text, style="body_text"):
    """Render paragraph containing pre-validated safe markup."""
    return Paragraph(text, STYLES[style])


def T(text, style="body_text"):
    """Render paragraph from raw un-escaped text."""
    return Paragraph(escape(str(text)), STYLES[style])


# ───────────────────────────── NUMBERED CANVAS ────────────────────────────
class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas for dynamic total page count, running header, and professional footer."""

    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self._draw_page_chrome(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def _draw_page_chrome(self, page_count):
        self.saveState()
        w, h = CONFIG["pagesize"]
        m = CONFIG["margin"]

        # Running Header (pages > 1)
        if self._pageNumber > 1:
            self.setFont(F_NORM, 8)
            self.setFillColor(MUTED)
            self.drawString(m, h - m + 4 * mm, f"{CONFIG['patient']}  |  {CONFIG['title']}  |  {CONFIG['date']}")
            self.setStrokeColor(RULE)
            self.setLineWidth(0.5)
            self.line(m, h - m + 2 * mm, w - m, h - m + 2 * mm)

        # Running Footer (all pages)
        self.setStrokeColor(RULE)
        self.setLineWidth(0.5)
        self.line(m, m - 3 * mm, w - m, m - 3 * mm)
        self.setFont(F_NORM, 7.5)
        self.setFillColor(MUTED)
        self.drawString(m, m - 7 * mm, CONFIG["footer_text"])
        self.drawRightString(w - m, m - 7 * mm, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


# ───────────────────────────── CONTENT BUILDER ────────────────────────────
def build_pdf():
    pdf_filename = CONFIG["output"]
    w, h = CONFIG["pagesize"]
    m = CONFIG["margin"]
    usable_w = w - 2 * m  # 210mm - 36mm = 174mm (~493.2 pt)

    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=CONFIG["pagesize"],
        leftMargin=m,
        rightMargin=m,
        topMargin=CONFIG.get("top_margin", m),
        bottomMargin=CONFIG.get("bottom_margin", m)
    )

    story = []

    # 1. Document Title & Subtitle
    story.append(P("PATIENT CLINICAL CONSULTATION AGENDA & SYMPTOM INVENTORY", "title"))
    story.append(P(
        f"Structured Patient Experience (Plain Language) & Pathophysiology for Bedside Review  |  {CONFIG['date']}",
        "subtitle"
    ))

    # 2. Executive Patient & Consultation Details Block
    col_w = usable_w / 3.0
    meta_table_data = [
        [
            Paragraph("<b>Patient:</b> " + CONFIG["patient"], STYLES["meta_val"]),
            Paragraph("<b>DOB:</b> " + CONFIG["dob"], STYLES["meta_val"]),
            Paragraph("<b>Medicare:</b> " + CONFIG["medicare"], STYLES["meta_val"]),
        ],
        [
            Paragraph("<b>Centrelink CRN:</b> " + CONFIG["crn"], STYLES["meta_val"]),
            Paragraph("<b>Consult Date:</b> " + CONFIG["date"], STYLES["meta_val"]),
            Paragraph("<b>Clinic:</b> " + CONFIG["clinic"], STYLES["meta_val"]),
        ]
    ]
    meta_table = Table(meta_table_data, colWidths=[col_w, col_w, col_w])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HEADER_BG),
        ("BOX", (0, 0), (-1, -1), 0.75, ACCENT),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, RULE),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 2.5 * mm))

    # 3. Clinical Priorities Callout Banner
    callout_data = [[
        Paragraph(
            "<b>Key Bedside Priorities:</b> "
            "<b>(1) Acute Motor Deficit:</b> Right foot drop with daily tripping / fall risk onto fused cervical spine (urgent AFO prescription). "
            "<b>(2) Neuro-Axis Discordance:</b> Severe patellar hyperreflexia co-exacerbated during acute sciatica flares (cervical myelomalacia UMN vs. lumbar LMN). "
            "<b>(3) Legal & NDIS Documentation:</b> Clinic medical certificate for police/bail attendance compliance + NDIS Access Part B sign-off / summary letter.",
            STYLES["callout_text"]
        )
    ]]
    callout_table = Table(callout_data, colWidths=[usable_w])
    callout_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PRIORITY_BG),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(callout_table)
    story.append(Spacer(1, 2.5 * mm))

    # 4. The 15 Agenda Items
    items = [
        {
            "num": 1,
            "title": "Hyperreflexia & Patellar Kick (Worse When Sciatica Flares)",
            "layman": "My knee kicks out violently and uncontrollably when touched or lightly tapped. This exaggerated kick gets noticeably worse whenever my lower back sciatica pain flares up, and when the knee is hyper-reactive my back pain also feels more intense.",
            "clinical": "Bilateral patellar hyperreflexia (Grade 3+ to 4+ deep tendon reflex with unsustained clonus). Upper Motor Neuron (UMN) corticospinal tract disinhibition secondary to pre-existing cervical myelomalacia (C5–C7). Paradoxical co-exacerbation: acute lumbar nociceptive barrage cross-excites spinal interneuron reflex arcs (neuro-axis central sensitization).",
            "action": "Bedside reflex hammer testing of patellar and Achilles reflexes; clinical evaluation of Upper Motor Neuron (cervical cord) vs Lower Motor Neuron (lumbar root) interaction."
        },
        {
            "num": 2,
            "title": "Provocative Sciatic Nerve Shockwaves on Forward Lean",
            "layman": "When I lean forward even slightly with a bent knee, a violent electric shock shoots up the back of my leg directly into the disc bulge in my lower back.",
            "clinical": "Dynamic neurodynamic tension / slump test positive. Provocative dural and sciatic nerve root traction shockwaves confirming acute mechanical space-occupying disc protrusion (L4–L5 / L5–S1) impinging on the traversing/exiting nerve root.",
            "action": "Physical examination of neurodynamic tension; review of lumbar mechanical compression and disc stabilization."
        },
        {
            "num": 3,
            "title": "Right Foot Drop & Daily Tripping (Loss of Ground Clearance)",
            "layman": "I cannot lift my right foot properly when walking. My toes drag and catch on carpets and floors, forcing me to lift my knee high (high-stepping), leading to daily stumbling and near-falls.",
            "clinical": "Acute Lower Motor Neuron (LMN) motor deficit: marked weakness of right tibialis anterior and extensor hallucis longus (Grade 3/5 dorsiflexion). Unilateral right foot drop, loss of ground clearance in swing phase, and antalgic high-steppage gait.",
            "action": "Formal documentation of acute motor deficit in medical record; urgent referral / prescription for Ankle-Foot Orthosis (AFO) splint to prevent catastrophic falls onto fused cervical spine."
        },
        {
            "num": 4,
            "title": "Contralateral Left C7–T1 Burning Pain on Raising Right Arm",
            "layman": "Whenever I lift, reach out, or raise my RIGHT arm overhead, I feel a sharp, hot burning pain on the LEFT side of my neck and upper back near my shoulder blade.",
            "clinical": "Contralateral cervicothoracic junction (C7–T1) neuropathic burning evoked by contralateral arm scaption/abduction. Rotational shear stress and scapular anchoring forces transfer across the thoracic ribcage and dump into the rigid transitional C7–T1 segment immediately adjacent to the C5–C7 fusion construct.",
            "action": "Cervicothoracic and scapulothoracic kinetic chain examination; adjacent segment strain assessment."
        },
        {
            "num": 5,
            "title": "White, Numb Fingers When Cold (Raynaud's / Acral Vasospasm)",
            "layman": "My index and middle fingers suddenly turn chalk-white, freezing cold, and completely numb when exposed to cold air or chilly weather.",
            "clinical": "Cold-induced acral vasospasm / secondary Raynaud's phenomenon. Marked digital ischemic blanching and paresthesia, likely driven by autonomic sympathetic chain irritation at the cervicothoracic junction vs microvascular dysregulation.",
            "action": "Microvascular and peripheral pulse check; evaluation of sympathetic involvement related to cervical spine pathology."
        },
        {
            "num": 6,
            "title": "Morning Lumbar Stiffness, Evening Muscle Spasms & Sleep Disruption",
            "layman": "I wake up with a completely rigid lower back. As the day goes on, standing and sitting exhaust my muscles, turning into painful, exhausting spasms by night that wake me up repeatedly.",
            "clinical": "Severe diurnal paraspinal guarding and muscular fatigue. Early morning mechanical stiffness (VAS 6.8/10) escalating under upright axial gravity loading into severe evening paraspinal spasms (VAS 7.7/10) by 21:00, causing severe sleep fragmentation.",
            "action": "Review of daytime pacing protocols, muscle spasm pharmacotherapy, and sleep stabilization."
        },
        {
            "num": 7,
            "title": "Right Anterior Shoulder & Tendon Impingement on Elevation",
            "layman": "Pain in the front of my right shoulder when lifting my arm out to the side or overhead, feeling like a tendon is catching or pinching.",
            "clinical": "Right anterior shoulder subacromial impingement arc (60°–120° scaption) and bicipital/supraspinatus tendinopathy. Secondary to chronic altered scapulothoracic kinematics and persistent trapezius guarding following cervical spine fusion.",
            "action": "Neer's and Hawkins-Kennedy impingement testing; clinical differentiation from C6 radicular shoulder pain."
        },
        {
            "num": 8,
            "title": "Physical Inability to Handwrite & Loss of Fine Motor Dexterity",
            "layman": "I physically cannot write with a pen for more than a minute. Holding a pen triggers severe neck cramps, numbness shooting down my arm, and my fingers lock up and lose control.",
            "clinical": "Loss of fine motor dexterity and rapid intrinsic hand muscle fatigue secondary to cervical myelomalacia and C7/C8 nerve root tension. Static neck flexion combined with sustained pincer grip induces acute cervicobrachial spasm and functional handwriting incapacity.",
            "action": "Document physical handwriting incapacity in medical notes as clinical justification for digital attachments on legal and NDIS documents."
        },
        {
            "num": 9,
            "title": "Cervicobrachial Radiculopathy & Arm Numbness / Neck Tightness",
            "layman": "Constant tightness and burning in the back of my neck and shoulder blade, with pins-and-needles tingling traveling down the back of my arm into my fingers.",
            "clinical": "Chronic cervicobrachial radiculopathy (predominantly C7 dermatomal distribution). Persistent posterior cervical myofascial guarding, upper trapezius trigger bands, and triceps/dorsal forearm paresthesia.",
            "action": "Spurling's test and upper limb dermatomal/myotomal sensory testing."
        },
        {
            "num": 10,
            "title": "Intractable 24/7 Deep Right Lower Back & Leg Pain (Sciatica)",
            "layman": "A deep, agonizing ache and burning in my right lower back, buttock, and leg that never stops—it is there 24 hours a day, 7 days a week, and is my biggest source of pain.",
            "clinical": "Intractable right L4–L5 / L5–S1 lumbar radiculopathy and discogenic somatic pain. Primary continuous driver of physical disability (62% anatomical burden in longitudinal logs; baseline VAS 7.4/10).",
            "action": "Review of interventional pain management plan; review of candidacy for Spinal Cord Stimulation (SCS) with Dr. Brett Todhunter."
        },
        {
            "num": 11,
            "title": "Mid-Thoracic & Interscapular Back Pain",
            "layman": "A constant dull ache and heavy fatigue in the middle of my back between my shoulder blades that gets worse when sitting upright.",
            "clinical": "Mid-thoracic (T4–T8) axial muscular strain and costovertebral joint dysfunction. Postural compensatory fatigue resulting from altered sagittal balance between the rigid fused cervical spine above and the degenerative lumbar spine below.",
            "action": "Thoracic spinal palpation and rib cage mobility assessment."
        },
        {
            "num": 12,
            "title": "Doctor's Medical Certificate for Police & Bail Compliance",
            "layman": "I need a formal medical certificate for today for police/bail proving that I attended the medical clinic and that my spinal disability physically prevents standing in lines or attending in person.",
            "clinical": "Issuance of formal medical certificate certifying clinical attendance, acute spinal fragility, severe mobility restriction, and medical contraindication to prolonged static standing or physical travel for legal and bail compliance.",
            "action": "Complete and print formal medical certificate for police/court records today."
        },
        {
            "num": 13,
            "title": "NDIS Access Request Form (Part B Sign-Off or 1-Page Summary Letter)",
            "layman": "I need the doctor's section of the NDIS form signed (or a 1-page summary letter on clinic letterhead) confirming my spinal conditions are permanent and substantially reduce my ability to walk, care for myself, and write.",
            "clinical": "Treating Health Professional certification for NDIS Access Request (Section 24 criteria). Documentation confirming permanent diagnoses (C5–C7 ACDF with myelomalacia + L4–S1 disc extrusion with foot drop), permanence of impairment, and substantial reduction in functional capacity in Mobility, Self-Care, Self-Management, and Communication. (Fallback: 1-page clinical summary letter).",
            "action": "Sign Part B of NDIS Access Form OR provide signed 1-page clinical summary letter on clinic letterhead."
        },
        {
            "num": 14,
            "title": "Prescription / Referral for Ankle-Foot Orthosis (AFO Splint)",
            "layman": "I need a prescription or referral for a foot-up splint (AFO brace) to keep my right foot from dragging so I do not trip and fall, which could severely damage my neck fusion.",
            "clinical": "Medical prescription or allied health / orthotist referral for an Ankle-Foot Orthosis (AFO) or dynamic foot-up splint for mechanical gait correction of right tibialis anterior weakness and fall prevention.",
            "action": "Provide prescription or referral letter for orthotist / AFO fitting."
        },
        {
            "num": 15,
            "title": "Clinical Query: Do I Need Another MRI? Is It Definite Cord Compression?",
            "layman": "Because my knee kicks out so violently (hyperreflexia) and my foot is now dropping and tripping me, does this mean my spinal cord is being compressed again? Do I need an urgent new MRI of my neck or lower back?",
            "clinical": "Clinical review and decision regarding repeat neuroimaging: Does the clinical coexistence of brisk patellar hyperreflexia (UMN) and acute foot drop (LMN) warrant repeat cervical MRI (to evaluate cord myelomalacia progression vs adjacent segment disease C4-C5 / C7-T1) and repeat lumbar MRI (to evaluate high-grade root compression / cauda equina risk)? Differential: Is the hyperreflexia residual myelomalacia amplified by lumbar cross-sensitization, or active cord re-compression?",
            "action": "Clinical evaluation of cord compression signs (Hoffmann's, clonus, Babinski) and decision on issuing urgent repeat MRI referrals."
        }
    ]

    for item in items:
        # Structured Card Layout:
        # Header: Item Number + Item Title
        # Body 1: Patient Experience (Subjective report)
        # Body 2: Clinical Pathophysiology (Objective clinical description)
        # Footer: Consult Objective / Action Required
        header_text = f"<b>Item {item['num']}: {escape(item['title'])}</b>"
        layman_p = Paragraph(f"<b>Patient Experience (Subjective):</b> {escape(item['layman'])}", STYLES["body_text"])
        clinical_p = Paragraph(f"<b>Clinical Correlation &amp; Pathophysiology:</b> {escape(item['clinical'])}", STYLES["body_text"])
        action_p = Paragraph(f"<b>Required Consult Action / Objective:</b> {escape(item['action'])}", STYLES["action_text"])

        card_data = [
            [Paragraph(header_text, STYLES["item_title"])],
            [layman_p],
            [clinical_p],
            [action_p],
        ]

        card_table = Table(card_data, colWidths=[usable_w])
        card_table.setStyle(TableStyle([
            # Card Header
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
            ("LINEBELOW", (0, 0), (-1, 0), 1, ACCENT),
            ("TOPPADDING", (0, 0), (-1, 0), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 3.5),
            ("LEFTPADDING", (0, 0), (-1, 0), 6),
            ("RIGHTPADDING", (0, 0), (-1, 0), 6),

            # Subjective Row
            ("BACKGROUND", (0, 1), (-1, 1), CARD_BG),
            ("TOPPADDING", (0, 1), (-1, 1), 3),
            ("BOTTOMPADDING", (0, 1), (-1, 1), 2.5),
            ("LEFTPADDING", (0, 1), (-1, 1), 6),
            ("RIGHTPADDING", (0, 1), (-1, 1), 6),

            # Objective Row
            ("BACKGROUND", (0, 2), (-1, 2), CARD_BG),
            ("TOPPADDING", (0, 2), (-1, 2), 2.5),
            ("BOTTOMPADDING", (0, 2), (-1, 2), 3),
            ("LEFTPADDING", (0, 2), (-1, 2), 6),
            ("RIGHTPADDING", (0, 2), (-1, 2), 6),

            # Action / Plan Row
            ("BACKGROUND", (0, 3), (-1, 3), ACTION_BG),
            ("LINEABOVE", (0, 3), (-1, 3), 0.5, RULE),
            ("LINEBEFORE", (0, 3), (0, 3), 2.5, ACCENT),
            ("TOPPADDING", (0, 3), (-1, 3), 3),
            ("BOTTOMPADDING", (0, 3), (-1, 3), 3.5),
            ("LEFTPADDING", (0, 3), (-1, 3), 6),
            ("RIGHTPADDING", (0, 3), (-1, 3), 6),

            # Outer Card Border
            ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ]))

        story.append(KeepTogether([card_table, Spacer(1, 1.8 * mm)]))

    # 5. Doctor's Clinical Review & Disposition Box (at the end of Item 15)
    disposition_data = [
        [Paragraph("<b>CLINICIAN CONSULTATION DISPOSITION &amp; SIGN-OFF</b>", STYLES["item_title"])],
        [
            Table([
                [
                    Paragraph("<b>Prescriptions / Referrals Issued:</b><br/>[ &nbsp; ] AFO Splint Orthotist Referral<br/>[ &nbsp; ] Repeat Cervical / Lumbar MRI Referral<br/>[ &nbsp; ] Pain Management / SCS Review", STYLES["body_text"]),
                    Paragraph("<b>Administrative Documentation:</b><br/>[ &nbsp; ] Medical Certificate (Police / Bail Compliance)<br/>[ &nbsp; ] NDIS Access Request Form Part B Signed<br/>[ &nbsp; ] Clinical Summary Letter on Clinic Letterhead", STYLES["body_text"]),
                    Paragraph("<b>Clinician Signature &amp; Date:</b><br/><br/>____________________________________<br/>Dr. Nathan Anderson &nbsp;|&nbsp; 04/11/2026", STYLES["body_text"]),
                ]
            ], colWidths=[usable_w / 3.0, usable_w / 3.0, usable_w / 3.0])
        ]
    ]
    disposition_table = Table(disposition_data, colWidths=[usable_w])
    disposition_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("LINEBELOW", (0, 0), (-1, 0), 1, ACCENT),
        ("TOPPADDING", (0, 0), (-1, 0), 3.5),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3.5),
        ("LEFTPADDING", (0, 0), (-1, 0), 6),
        ("RIGHTPADDING", (0, 0), (-1, 0), 6),
        ("BACKGROUND", (0, 1), (-1, 1), CARD_BG),
        ("TOPPADDING", (0, 1), (-1, 1), 4),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 4),
        ("LEFTPADDING", (0, 1), (-1, 1), 6),
        ("RIGHTPADDING", (0, 1), (-1, 1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
    ]))
    story.append(KeepTogether([disposition_table]))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated improved PDF: {pdf_filename}")
    return pdf_filename


if __name__ == "__main__":
    build_pdf()
