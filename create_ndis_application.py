import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def create_ndis_application_document():
    doc = docx.Document()

    # Page setup - 1 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Palette
    COLOR_PRIMARY = RGBColor(27, 54, 93)     # Deep Navy
    COLOR_SECONDARY = RGBColor(74, 37, 116)  # NDIS Deep Purple
    COLOR_TEXT = RGBColor(34, 34, 34)        # Charcoal
    COLOR_MUTED = RGBColor(100, 110, 120)    # Slate
    COLOR_ALERT = RGBColor(180, 40, 40)      # Muted Red for notes
    COLOR_PREFILL = RGBColor(15, 82, 186)    # Blue for pre-filled text

    HEX_BG_HEADER = "1B365D"
    HEX_BG_LIGHT = "F4F6F9"
    HEX_BG_ACCENT = "EBF3FA"
    HEX_BG_NOTE = "FFF9E6"
    HEX_BORDER = "CCCCCC"

    # Helper functions
    def set_cell_background(cell, fill_hex):
        shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
        cell._tc.get_or_add_tcPr().append(shading_elm)

    def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
        tcPr = cell._tc.get_or_add_tcPr()
        tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
        tcPr.append(tcMar)

    def set_table_borders(table, color="D3D3D3"):
        tblPr = table._tbl.tblPr
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
            f'<w:insideV w:val="none"/>'
            f'<w:left w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr.append(borders)

    def add_callout(text, title="IMPORTANT NOTICE TO NDIA ASSESSOR / ACCESS DELEGATE", bg_hex=HEX_BG_NOTE, border_color="E6A100"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, bg_hex)
        set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>'
            f'<w:top w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(4)
        r_title = p.add_run(f"{title}\n")
        r_title.bold = True
        r_title.font.size = Pt(10.5)
        r_title.font.color.rgb = RGBColor(160, 90, 0)
        
        r_body = p.add_run(text)
        r_body.font.size = Pt(10)
        r_body.font.color.rgb = COLOR_TEXT

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_before = Pt(0)
        p_spacer.paragraph_format.space_after = Pt(4)

    def add_section_header(title, part_label=""):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        
        if part_label:
            r_part = p.add_run(part_label.upper() + "\n")
            r_part.bold = True
            r_part.font.size = Pt(9.5)
            r_part.font.color.rgb = COLOR_SECONDARY

        r_title = p.add_run(title)
        r_title.bold = True
        r_title.font.size = Pt(14)
        r_title.font.color.rgb = COLOR_PRIMARY

        # Divider line
        p_line = doc.add_paragraph()
        p_line.paragraph_format.space_before = Pt(0)
        p_line.paragraph_format.space_after = Pt(10)
        p_line.paragraph_format.keep_with_next = True
        r_line = p_line.add_run("―" * 58)
        r_line.font.color.rgb = RGBColor(200, 210, 220)

    def add_question(q_num, q_text, prefill_text="", user_prompt_note="", is_table=False):
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(10)
        p_q.paragraph_format.space_after = Pt(3)
        p_q.paragraph_format.keep_with_next = True
        
        r_num = p_q.add_run(f"Question {q_num}: ")
        r_num.bold = True
        r_num.font.size = Pt(11)
        r_num.font.color.rgb = COLOR_PRIMARY
        
        r_text = p_q.add_run(q_text)
        r_text.bold = True
        r_text.font.size = Pt(11)
        r_text.font.color.rgb = COLOR_TEXT

        if prefill_text:
            tbl = doc.add_table(rows=1, cols=1)
            tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
            cell = tbl.cell(0, 0)
            set_cell_background(cell, HEX_BG_LIGHT)
            set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
            
            tcPr = cell._tc.get_or_add_tcPr()
            borders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>'
                f'<w:left w:val="single" w:sz="16" w:space="0" w:color="1B365D"/>'
                f'<w:top w:val="none"/>'
                f'<w:right w:val="none"/>'
                f'<w:bottom w:val="none"/>'
                f'</w:tcBorders>'
            )
            tcPr.append(borders)
            
            p_ans = cell.paragraphs[0]
            p_ans.paragraph_format.space_before = Pt(2)
            p_ans.paragraph_format.space_after = Pt(2)
            
            r_ans_label = p_ans.add_run("Applicant Pre-filled Response:\n")
            r_ans_label.bold = True
            r_ans_label.font.size = Pt(9.5)
            r_ans_label.font.color.rgb = COLOR_PRIMARY
            
            r_ans = p_ans.add_run(prefill_text)
            r_ans.font.size = Pt(10)
            r_ans.font.color.rgb = COLOR_TEXT

        if user_prompt_note:
            p_note = doc.add_paragraph()
            p_note.paragraph_format.space_before = Pt(2)
            p_note.paragraph_format.space_after = Pt(6)
            r_icon = p_note.add_run("✏️ Action for James: ")
            r_icon.bold = True
            r_icon.font.size = Pt(9.5)
            r_icon.font.color.rgb = COLOR_ALERT
            r_note = p_note.add_run(user_prompt_note)
            r_note.font.size = Pt(9.5)
            r_note.font.color.rgb = COLOR_MUTED

    # --- COVER / HEADER TITLE ---
    p_top = doc.add_paragraph()
    p_top.paragraph_format.space_before = Pt(0)
    p_top.paragraph_format.space_after = Pt(2)
    r_sub = p_top.add_run("NATIONAL DISABILITY INSURANCE SCHEME (NDIS) ACCESS APPLICATION")
    r_sub.font.size = Pt(10)
    r_sub.bold = True
    r_sub.font.color.rgb = COLOR_SECONDARY

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    r_main = p_title.add_run("Formal Access Request & Functional Evidence Attachment")
    r_main.font.size = Pt(20)
    r_main.bold = True
    r_main.font.color.rgb = COLOR_PRIMARY

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(12)
    r_meta = p_meta.add_run("Applicant: James Jones  |  DOB: 20/01/1986  |  Location: Wangaratta VIC 3677\nDocument Type: Comprehensive Applicant Response to Form Questions (Digital Attachment)")
    r_meta.font.size = Pt(10)
    r_meta.font.color.rgb = COLOR_MUTED

    # Callout notice regarding handwriting impairment
    add_callout(
        "This Word document contains the complete set of questions from the official NDIS Access Request Form (ARF) "
        "and Supporting Evidence Questionnaires, submitted as a formal attachment.\n\n"
        "REASON FOR ATTACHED DIGITAL SUBMISSION: The applicant, James Jones, has severe neurological deficits and spinal cord/nerve "
        "impairments resulting in loss of upper limb fine motor dexterity and acute physical incapacity to handwrite on the physical paper form. "
        "Pursuant to the Disability Discrimination Act 1992 and the NDIS Act 2013 reasonable adjustment principles, all formal answers have been "
        "digitally prepared, reviewed, and authenticated by the applicant.",
        title="CRITICAL NOTICE: DIGITAL ATTACHMENT DUE TO PHYSICAL HANDWRITING INCAPACITY"
    )

    # ==========================================
    # PART A: APPLICANT DETAILS
    # ==========================================
    add_section_header("Applicant Personal & Contact Information", "Part A: Person's Details")

    # Table of personal info
    tbl_personal = doc.add_table(rows=10, cols=2)
    tbl_personal.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_personal)
    
    personal_fields = [
        ("Full Legal Name", "James Jones"),
        ("Preferred Name", "James"),
        ("Date of Birth (DOB)", "20/01/1986  (Age: 40)"),
        ("Gender", "Male"),
        ("Residential Address", "158 Tone Rd, Wangaratta VIC 3677"),
        ("Postal Address", "158 Tone Rd, Wangaratta VIC 3677 (Same as residential)"),
        ("Primary Mobile Phone", "0402 270 259"),
        ("Primary Email Address", "thunderops.ai@gmail.com"),
        ("Medicare Card Details", "Card No: 3634 32502 1  |  Ref: 1  |  Expires: 07/2032"),
        ("Centrelink CRN", "303065993H")
    ]

    for idx, (lbl, val) in enumerate(personal_fields):
        row = tbl_personal.rows[idx]
        c0 = row.cells[0]
        c1 = row.cells[1]
        c0.width = Inches(2.2)
        c1.width = Inches(4.5)
        
        set_cell_background(c0, HEX_BG_LIGHT)
        set_cell_margins(c0, top=80, bottom=80, left=120, right=120)
        set_cell_margins(c1, top=80, bottom=80, left=120, right=120)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(0)
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(lbl)
        r0.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = COLOR_PRIMARY

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(val)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_TEXT

    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(4)
    p_sp.paragraph_format.space_after = Pt(4)

    add_question(
        "A1",
        "Preferred contact method and communication assistance requirements",
        "Preferred Method of Contact: Email (thunderops.ai@gmail.com) and Mobile (0402 270 259).\n"
        "Communication Accommodation: Written/digital communication is strongly preferred for documentation. "
        "Due to severe cervical spine neuropathy and upper-limb motor weakness, the applicant cannot write by hand, "
        "and physical mail causes severe ergonomic strain. All notices, correspondence, and plan drafts should be transmitted digitally via email.",
        ""
    )

    add_question(
        "A2",
        "Residency and Citizenship Status",
        "Country of Birth: Australia\n"
        "Citizenship / Visa Status: Australian Citizen / Permanent Resident\n"
        "Residency Status: Currently residing in Wangaratta, Victoria (VIC 3677).",
        ""
    )

    add_question(
        "A3",
        "Aboriginal or Torres Strait Islander origin",
        "[X] No, neither Aboriginal nor Torres Strait Islander\n"
        "[  ] Yes, Aboriginal\n"
        "[  ] Yes, Torres Strait Islander\n"
        "[  ] Both Aboriginal and Torres Strait Islander",
        ""
    )

    add_question(
        "A4",
        "Medicare and Centrelink Reference Details",
        "Medicare Card Number: 3634 32502 1\n"
        "Individual Reference Number (IRN): 1\n"
        "Card Expiry Date: 07/2032 (July 2032)\n"
        "Centrelink Customer Reference Number (CRN): 303065993H\n"
        "Department of Veterans' Affairs (DVA) Number: Not Applicable / None",
        ""
    )

    # ==========================================
    # PART B: NOMINEE & INFORMATION CONSENT
    # ==========================================
    add_section_header("Advocacy, Nominee & Information Sharing Consent", "Part B: Nominee & Consent")

    add_question(
        "B1",
        "Do you want someone else to act on your behalf or be contacted as an applicant representative?",
        "Applicant Self-Advocacy: James Jones is acting as the primary applicant.\n"
        "Nominee / Support Person: If you wish to appoint a family member, friend, advocate, or support coordinator to speak with the NDIA on your behalf, provide their details below:\n"
        "• Name of Nominee / Support Person: [ None at present / Self-represented ]\n"
        "• Relationship to Applicant: [ e.g., Family member / Independent Advocate ]\n"
        "• Phone Number: [ ________________________ ]\n"
        "• Email Address: [ ________________________ ]",
        "If you want someone else (like an advocate or trusted person) to be authorized to talk to the NDIS for you, write their name and contact number here; otherwise leave as self-represented."
    )

    add_question(
        "B2",
        "Applicant Consent to Collect and Share Information",
        "STATEMENT OF CONSENT:\n"
        "I, James Jones (DOB: 20/01/1986), give consent for the National Disability Insurance Agency (NDIA) to collect, use, and disclose personal and health information relevant to my application for access to the NDIS. This includes contacting and obtaining clinical records, diagnostic imaging, and medical assessments from my treating general practitioners, interventional pain physicians, orthopaedic/neurological surgeons, and allied health clinicians listed in Part C of this application.\n\n"
        "This consent is given with the explicit stipulation that all information is handled in accordance with the Privacy Act 1988 and the National Disability Insurance Scheme Act 2013.",
        ""
    )

    # ==========================================
    # PART C: MEDICAL CONDITIONS & TREATING DOCTORS
    # ==========================================
    add_section_header("Medical Conditions, Diagnoses & Treating Team", "Part C: Disability Information")

    add_question(
        "C1",
        "What is your primary disability or medical condition that causes impairment?",
        "PRIMARY IMPAIRMENT: Severe, Complex Multi-Level Spinal Neuropathy & Structural Pathology\n"
        "1. Post-Cervical Spine Decompression & Fusion (C5–C7 ACDF with interbody cage and anterior titanium plate; performed June 2026 by Prof. Greg Cunningham).\n"
        "   - Underlying Pathology: Severe multi-level cervical spinal cord compression and chronic cervical myelomalacia.\n"
        "   - Neurological Consequences: Residual upper limb motor deficits, loss of fine motor dexterity preventing handwriting, cervicothoracic neuropathic burning, and hyperreflexia.\n"
        "2. Lumbar Spine Disc Extrusion & Neuropathy (L4–L5 / L5–S1):\n"
        "   - Underlying Pathology: Prominent right-sided focal disc extrusion producing marked nerve root impingement and intractable lumbar radiculopathy.\n"
        "   - Acute Neurological Progression: Severe right-sided foot drop (tibialis anterior weakness / loss of ground clearance), provocative dural traction shockwaves on minimal forward bending, antalgic high-steppage gait, and high daily tripping/fall hazard.\n\n"
        "PERMANENCE OF IMPAIRMENT: The neurological, spinal cord, and disc structural pathology is permanent. Surgical fusion and post-operative recovery have established that structural deficits, spinal cord myelomalacia, and nerve damage remain permanent functional barriers under Section 24(1)(b) of the NDIS Act.",
        ""
    )

    add_question(
        "C2",
        "What secondary conditions or co-morbidities do you experience?",
        "SECONDARY CONDITIONS & IMPACTS:\n"
        "1. Severe Intractable Neuropathic Pain Syndrome: Chronic longitudinal pain burden averaging 7.4/10 on the visual analog scale (derived from over 770 structured clinical log entries), severe evening spasms, and acute burning flares.\n"
        "2. Peripheral Joint Pathology: Right knee and ankle ligamentous and chondral injury, producing antalgic gait asymmetry and compounded weight-bearing strain.\n"
        "3. Paradoxical Central Hyperreflexia: Exaggerated spinal interneuron reflex loops secondary to cervical cord trauma, aggravated by acute lumbar flares.\n"
        "4. Chronic Sleep Disruption & Pain-Induced Fatigue: Fragmented restorative sleep causing significant diurnal fatigue and reduced physical endurance.",
        ""
    )

    add_question(
        "C3",
        "Have all available and appropriate medical treatments been completed or explored?",
        "CLINICAL TREATMENT HISTORY & PERMANENCE:\n"
        "Yes. The applicant has undergone and explored all appropriate, evidence-based treatments:\n"
        "• Major Spinal Surgery: C5–C7 Anterior Cervical Decompression & Fusion (June 2026).\n"
        "• Interventional Pain Management: Specialized interventional consultations, nerve evaluations, and candidacy assessments for neuromodulation / Spinal Cord Stimulation (SCS).\n"
        "• Pharmacotherapy: Comprehensive multi-agent pain and neuropathic regimens under specialist supervision.\n"
        "• Conservative Allied Health: Consistent self-directed clinical rehabilitation, adaptive hydrotherapy, and physical therapy routines.\n\n"
        "Conclusion: Despite maximum surgical and medical interventions, substantial permanent functional deficits persist across daily life domains.",
        ""
    )

    # Table of Treating Medical Practitioners
    doc.add_paragraph().paragraph_format.space_before = Pt(6)
    p_doc_title = doc.add_paragraph()
    p_doc_title.paragraph_format.space_before = Pt(4)
    p_doc_title.paragraph_format.space_after = Pt(2)
    p_doc_title.paragraph_format.keep_with_next = True
    r_dt = p_doc_title.add_run("Details of Treating Medical Practitioners & Specialists:")
    r_dt.bold = True
    r_dt.font.size = Pt(10.5)
    r_dt.font.color.rgb = COLOR_PRIMARY

    tbl_med = doc.add_table(rows=4, cols=3)
    tbl_med.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_med)

    headers = ["Practitioner & Specialty", "Clinic / Practice Name", "Contact Details & Address"]
    for i, h in enumerate(headers):
        cell = tbl_med.rows[0].cells[i]
        set_cell_background(cell, HEX_BG_HEADER)
        set_cell_margins(cell, top=100, bottom=100, left=120, right=120)
        p = cell.paragraphs[0]
        r = p.add_run(h)
        r.bold = True
        r.font.size = Pt(9)
        r.font.color.rgb = RGBColor(255, 255, 255)

    med_data = [
        ("Dr. Brett Todhunter\nMBBS, FANZCA, FFPMANZCA\nInterventional Pain Specialist", "Regional Pain Clinic", "Suite 2, 2 Ramsay Place, West Albury NSW 2640\nPh: (02) 6041 2477"),
        ("Prof. Greg Cunningham\nSpinal & Neurosurgeon", "St John of God Healthcare / Bendigo", "Bendigo VIC / St John of God Specialist Consulting Suites"),
        ("Dr. Nathan Anderson / Dr. Reno Riandito / Dr. Khan\nGeneral Practitioners", "Treating General Practice Clinic", "Wangaratta VIC 3677\nMedical certificates & clinical records on file")
    ]

    for idx, (p_name, c_name, c_addr) in enumerate(med_data):
        row = tbl_med.rows[idx + 1]
        for c_idx, val in enumerate([p_name, c_name, c_addr]):
            cell = row.cells[c_idx]
            if idx % 2 == 1:
                set_cell_background(cell, HEX_BG_LIGHT)
            set_cell_margins(cell, top=80, bottom=80, left=120, right=120)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(8.5)
            r.font.color.rgb = COLOR_TEXT

    p_sp2 = doc.add_paragraph()
    p_sp2.paragraph_format.space_before = Pt(4)
    p_sp2.paragraph_format.space_after = Pt(4)

    # ==========================================
    # PART D: FUNCTIONAL CAPACITY IMPACT (6 DOMAINS)
    # ==========================================
    add_section_header("Functional Capacity Assessment (NDIS Section 24 Criteria)", "Part D: Daily Life Impact")

    add_callout(
        "Under Section 24(1)(c) of the NDIS Act 2013, an applicant qualifies for access if their permanent impairment "
        "results in substantially reduced functional capacity to undertake activities in one or more of the following 6 areas: "
        "Mobility, Communication, Social Interaction, Learning, Self-Care, or Self-Management. "
        "The following detailed statements demonstrate substantially reduced capacity across MULTIPLE core domains.",
        title="SECTION 24 NDIS ACT STATUTORY ASSESSMENT FRAMEWORK",
        bg_hex=HEX_BG_ACCENT,
        border_color="1B365D"
    )

    # Domain 1: Mobility
    add_question(
        "D1",
        "DOMAIN 1: MOBILITY (Moving around the home, community, walking, standing, sitting, transfers, fine motor hand/arm movements)",
        "SUBSTANTIALLY REDUCED FUNCTIONAL CAPACITY IN MOBILITY:\n"
        "• Ground Clearance & Foot Drop: The applicant suffers from acute neurological motor deterioration with prominent right foot drop (tibialis anterior weakness). He cannot clear the foot normally during the swing phase of gait, causing a compensatory high-steppage gait, frequent dragging of the right toes, and severe daily tripping and fall hazards.\n"
        "• Inability to Prolong Sitting or Standing: Severe lumbar disc extrusion and cervical fragility prevent prolonged static sitting or standing. Sitting beyond 15–20 minutes triggers provocative sciatic nerve traction and severe burning lumbar spine pain (averaging 7.4/10). Standing causes escalating muscle fatigue and spasm.\n"
        "• Provocative Neurodynamic Shockwaves: When leaning forward even slightly with a bent knee, violent electric dural shockwaves shoot up the leg to the lumbar spine, rendering bending over, reaching to the floor, or lifting impossible without acute agony.\n"
        "• Inability to Physically Handwrite: Due to post-surgical cervical myelomalacia, neck posture intolerance, and upper limb motor weakness, the applicant cannot grip a pen or handwrite legible documents without severe cervical spasm and nerve pain.\n"
        "• Transfers & Stairs: Difficulty getting out of low chairs, off the floor, or out of bed. Navigating stairs is highly hazardous due to right foot drop and knee instability.",
        "Add any specific examples of near-falls, walking distances you can manage before pain stops you, or aids currently used."
    )

    # Domain 2: Communication
    add_question(
        "D2",
        "DOMAIN 2: COMMUNICATION (Expressing needs, writing, using communication equipment, paperwork)",
        "SUBSTANTIALLY REDUCED FUNCTIONAL CAPACITY IN WRITING & COMMUNICATION:\n"
        "• Physical Inability to Handwrite: The applicant is completely unable to physically handwrite standard paper forms, applications, or letters. Handwriting evokes acute muscle spasms in the neck and upper trapezius, shooting neuropathic burning across the cervicothoracic junction (C7–T1), and motor hand fatigue.\n"
        "• Complete Reliance on Assistive Digital Tools: The applicant requires digital communication, voice-to-text dictation, and ergonomic typing interfaces to express himself, communicate with medical teams, and manage legal or administrative affairs.\n"
        "• Fatigue and Cognitive Load: During severe pain flare-ups (7.0 to 9.5/10 pain scores), verbal communication is interrupted by pain spikes, requiring rest and pacing.",
        ""
    )

    # Domain 3: Social Interaction
    add_question(
        "D3",
        "DOMAIN 3: SOCIAL INTERACTION (Participating in community life, maintaining relationships, coping with environments)",
        "SUBSTANTIALLY REDUCED CAPACITY FOR COMMUNITY & SOCIAL PARTICIPATION:\n"
        "• Severe Community Isolation: Inability to sit in standard seating, drive comfortably, or walk distances has severely restricted social participation and community life.\n"
        "• Inability to Attend Events or Gatherings: Cannot participate in community events, public gatherings, or recreational venues because unpredictable pain spikes, physical vulnerability, and inability to stand or sit safely make attendance unsustainable.\n"
        "• Loss of Independence and Identity: The abrupt physical decline from an active lifestyle to severe spinal impairment has caused substantial isolation, requiring support to rebuild safe community access and engagement.",
        ""
    )

    # Domain 4: Learning
    add_question(
        "D4",
        "DOMAIN 4: LEARNING (Processing complex instructions, remembering steps, cognitive pacing under chronic pain)",
        "FUNCTIONAL IMPACT ON LEARNING & COGNITIVE STAMINA:\n"
        "• Intractable Pain Interference: Severe continuous neuropathic pain (mean 7.4/10) and chronic sleep fragmentation create significant cognitive fatigue and reduced working memory when processing complex, lengthy instructions.\n"
        "• Need for Digital & Written Breakdown: Information, medical instructions, and rehabilitation guidelines must be structured digitally, broken into paced steps, and documented in writing rather than communicated verbally in rushed clinical settings.",
        ""
    )

    # Domain 5: Self-Care
    add_question(
        "D5",
        "DOMAIN 5: SELF-CARE (Showering, dressing, personal hygiene, meal preparation, medication)",
        "SUBSTANTIALLY REDUCED FUNCTIONAL CAPACITY IN SELF-CARE:\n"
        "• Showering & Bathing: Showering is a major fall risk due to right foot drop, balance loss, and inability to stand securely with eyes closed or on wet surfaces. Applicant requires bathroom grab rails and a shower chair to prevent catastrophic falls.\n"
        "• Dressing & Lower Body Grooming: Putting on socks, shoes, and pants is excruciatingly difficult due to violent dural shockwaves triggered by forward trunk flexion. The applicant requires adaptive dressing aids or physical assistance.\n"
        "• Meal Preparation: Standing at a kitchen bench to prepare meals triggers severe lumbar spasms within 10–15 minutes. Lifting heavy pots, carrying hot fluids, or reaching high/low cupboards creates acute cervical and lumbar mechanical strain.\n"
        "• Medication & Self-Care Execution: Managing complex medication schedules, therapeutic icing, heat routines, and prescribed rehabilitation exercises requires substantial daily effort and pacing.",
        "Add any specific aids or struggles you have when dressing, cooking, or bathing."
    )

    # Domain 6: Self-Management
    add_question(
        "D6",
        "DOMAIN 6: SELF-MANAGEMENT (Domestic chores, cleaning, laundry, grocery shopping, household administration)",
        "SUBSTANTIALLY REDUCED FUNCTIONAL CAPACITY IN DOMESTIC SELF-MANAGEMENT:\n"
        "• Domestic Chores: The applicant cannot perform core domestic tasks: vacuuming, mopping floors, scrubbing bathrooms, changing bed linen, or carrying full laundry baskets. These activities involve axial loading and spinal flexion that immediately provoke severe spinal pain.\n"
        "• Heavy Waste & Maintenance: Cannot move heavy council wheelie bins or perform essential home maintenance due to acute spinal fragility and fall risk.\n"
        "• Grocery Shopping & Heavy Lifting: Cannot push heavy supermarket trolleys, lift bags of groceries, or transport food items without aggravating lumbar disc impingement. Dependent on home delivery or assistance.\n"
        "• Transportation: Physical inability to use public buses safely (sudden stops and walking to transit stops provoke foot drop tripping); driving is restricted due to right leg motor weakness and pain during pedal operation.",
        ""
    )

    # ==========================================
    # PART E: CURRENT SUPPORTS & ASSISTIVE TECHNOLOGY
    # ==========================================
    add_section_header("Current Supports, Assistive Equipment & Services", "Part E: Supports & Equipment")

    add_question(
        "E1",
        "What informal supports (family, friends, community) do you currently receive?",
        "INFORMAL SUPPORTS RECEIVED:\n"
        "• The applicant relies heavily on informal assistance for tasks requiring physical heavy lifting, driving assistance, and urgent domestic chores.\n"
        "• Sustainability: Informal support is unsustainable long-term and places significant burden on relationships, creating an urgent need for funded formal Core Support Worker assistance.",
        ""
    )

    add_question(
        "E2",
        "What mainstream and community health services do you currently use?",
        "MAINSTREAM HEALTH SERVICES:\n"
        "• General Practice (Medicare GP visits for medical certificates, referrals, script management).\n"
        "• Specialist Outpatient Clinics: Interventional pain medicine (Dr. Brett Todhunter) and spinal surgery review.\n"
        "• Self-Funded / Community Hydrotherapy: Regular warm-water hydrotherapy and clinical exercise sessions in Wangaratta to preserve residual mobility and reduce muscle spasticity.\n"
        "• Diagnostic Imaging: Repeated MRI, CT, and neurodynamic investigations.",
        ""
    )

    add_question(
        "E3",
        "What assistive technology, equipment, or home modifications do you currently use or need?",
        "ASSISTIVE TECHNOLOGY & MODIFICATIONS REQUIRED:\n"
        "1. Orthotic Mobility Support: Ankle-Foot Orthosis (AFO) / foot-up brace to manage right foot drop and eliminate daily tripping/fall hazards.\n"
        "2. Assistive Writing & Digital Workstation: Speech-to-text dictation software, ergonomic adaptive keyboard/mouse setup, and adjustable sit-stand furniture to overcome physical inability to handwrite and sit statically.\n"
        "3. Bathroom Safety Equipment: Shower chair and grab rails to allow safe, independent personal hygiene.\n"
        "4. Adaptive Self-Care Aids: Long-handled shoe horn, sock aid, and reacher/grabber tools to prevent provocative lumbar flexion shockwaves.",
        ""
    )

    # ==========================================
    # PART F: PARTICIPANT GOALS & REQUESTED SUPPORTS
    # ==========================================
    add_section_header("Participant Goals & Requested NDIS Supports", "Part F: Participant Goals")

    add_question(
        "F1",
        "What are your key personal goals under an NDIS plan?",
        "APPLICANT GOALS (Short-Term & Long-Term):\n\n"
        "• GOAL 1 (Physical Safety & Fall Prevention): To prevent falls, improve ground clearance, and stabilize my walking gait through appropriate orthotics (AFO) and specialized clinical exercise physiology/physiotherapy.\n\n"
        "• GOAL 2 (Independent Living at Home): To maintain my independent living in my home in Wangaratta safely by accessing core support worker assistance for domestic cleaning, heavy household tasks, laundry, and meal preparation.\n\n"
        "• GOAL 3 (Community Access & Safe Transport): To safely access essential medical consultations, clinical rehabilitation, hydrotherapy, and community life without risk of injury or intolerable pain flares.\n\n"
        "• GOAL 4 (Communication & Functional Autonomy): To overcome my physical inability to handwrite by accessing appropriate assistive technology, voice dictation, and ergonomic equipment, enabling me to manage my affairs independently.\n\n"
        "• GOAL 5 (Capacity Building & Care Coordination): To engage a Support Coordinator to navigate multidisciplinary care, interventional pain pathways, and allied health rehabilitation.",
        ""
    )

    add_question(
        "F2",
        "What specific NDIS support categories and funding are requested?",
        "REQUESTED NDIS SUPPORT CATEGORIES:\n"
        "1. Core Supports – Assistance with Daily Life: Support worker hours for domestic cleaning, meal prep, laundry, and heavy maintenance.\n"
        "2. Core Supports – Transport & Community Participation: Assistance traveling to healthcare appointments, hydrotherapy sessions, and community activities.\n"
        "3. Capital Supports – Assistive Technology: Orthotic brace (AFO), shower safety equipment, adaptive dressing aids, and assistive dictation/computing tools.\n"
        "4. Capacity Building – Improved Daily Living: Ongoing funding for Exercise Physiology, Physiotherapy, and guided Hydrotherapy sessions.\n"
        "5. Capacity Building – Support Coordination: Level 2 Support Coordination to organize and implement multidisciplinary clinical and support services.",
        ""
    )

    # ==========================================
    # PART G: DECLARATION & AUTHENTICATION
    # ==========================================
    add_section_header("Applicant Declaration & Signature", "Part G: Declaration")

    add_question(
        "G1",
        "Applicant Formal Declaration",
        "DECLARATION OF TRUTH & AUTHENTICATION:\n"
        "I, James Jones, declare that the information provided in this document and attached to my NDIS Access Request is true, correct, and complete to the best of my knowledge.\n\n"
        "SPECIAL ATTESTATION REGARDING DIGITAL COMPLETION:\n"
        "Due to severe cervical spinal cord myelomalacia and upper limb neurological impairment, I am physically unable to sign or handwrite with a pen on the standard printed paper form. This document has been digitally prepared, thoroughly reviewed, and authenticated by me as my official statement of answers.\n\n"
        "Applicant Full Name:  James Jones\n"
        "Date of Birth:         20/01/1986\n"
        "Submission Date:       " + docx.oxml.ns.qn("w:date") if False else "November 2026\n"
        "Signature:             /s/ James Jones (Digital Authentication - Handwriting Impaired)\n"
        "Residential Town:      Wangaratta, Victoria, Australia",
        ""
    )

    # Footer note
    p_end = doc.add_paragraph()
    p_end.paragraph_format.space_before = Pt(20)
    p_end.paragraph_format.space_after = Pt(0)
    r_end = p_end.add_run("― End of Formal NDIS Access Request Attachment ―")
    r_end.font.size = Pt(9.5)
    r_end.font.italic = True
    r_end.font.color.rgb = COLOR_MUTED
    p_end.alignment = WD_ALIGN_PARAGRAPH.CENTER

    output_filename = "NDIS_Application_Form_Answers_James_Jones.docx"
    doc.save(output_filename)
    print(f"Document successfully created: {output_filename}")
    return output_filename

if __name__ == "__main__":
    create_ndis_application_document()
