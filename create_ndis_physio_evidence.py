import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_ndis_physio_evidence_document():
    doc = docx.Document()

    # Page setup - 0.8 / 0.85 inch margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.85)
        section.right_margin = Inches(0.85)

    # Palette
    COLOR_PRIMARY = RGBColor(27, 54, 93)      # Deep Navy
    COLOR_SECONDARY = RGBColor(74, 37, 116)   # NDIS Deep Purple
    COLOR_TEXT = RGBColor(34, 34, 34)         # Charcoal
    COLOR_MUTED = RGBColor(100, 110, 120)     # Slate
    COLOR_ALERT = RGBColor(180, 40, 40)       # Red / Alert
    COLOR_CLINICAL = RGBColor(16, 92, 142)    # Clinical Cyan/Blue

    HEX_BG_LIGHT = "F4F6F9"
    HEX_BG_ACCENT = "EBF3FA"
    HEX_BG_NOTE = "FFF9E6"
    HEX_BG_CLINICAL = "E8F4F8"

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

    def add_callout(text, title="IMPORTANT NOTICE TO TREATING HEALTH PROFESSIONAL (CAMERON BISHOP)", bg_hex=HEX_BG_NOTE, border_color="E6A100"):
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
        r_title.font.color.rgb = RGBColor(160, 90, 0) if border_color == "E6A100" else COLOR_PRIMARY
        
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
        r_title.font.size = Pt(13.5)
        r_title.font.color.rgb = COLOR_PRIMARY

        # Divider line
        p_line = doc.add_paragraph()
        p_line.paragraph_format.space_before = Pt(0)
        p_line.paragraph_format.space_after = Pt(8)
        p_line.paragraph_format.keep_with_next = True
        r_line = p_line.add_run("―" * 58)
        r_line.font.color.rgb = RGBColor(200, 210, 220)

    def add_question(q_num, q_text, prefill_text="", action_note="", is_clinical=True):
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
            set_cell_background(cell, HEX_BG_CLINICAL if is_clinical else HEX_BG_LIGHT)
            set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
            
            tcPr = cell._tc.get_or_add_tcPr()
            border_hex = "105C8E" if is_clinical else "1B365D"
            borders = parse_xml(
                f'<w:tcBorders {nsdecls("w")}>'
                f'<w:left w:val="single" w:sz="16" w:space="0" w:color="{border_hex}"/>'
                f'<w:top w:val="none"/>'
                f'<w:right w:val="none"/>'
                f'<w:bottom w:val="none"/>'
                f'</w:tcBorders>'
            )
            tcPr.append(borders)
            
            p_ans = cell.paragraphs[0]
            p_ans.paragraph_format.space_before = Pt(2)
            p_ans.paragraph_format.space_after = Pt(2)
            
            r_ans_label = p_ans.add_run("Physiotherapist Pre-Filled Clinical Assessment & Findings:\n")
            r_ans_label.bold = True
            r_ans_label.font.size = Pt(9.5)
            r_ans_label.font.color.rgb = COLOR_CLINICAL if is_clinical else COLOR_PRIMARY
            
            r_ans = p_ans.add_run(prefill_text)
            r_ans.font.size = Pt(10)
            r_ans.font.color.rgb = COLOR_TEXT

        if action_note:
            p_note = doc.add_paragraph()
            p_note.paragraph_format.space_before = Pt(2)
            p_note.paragraph_format.space_after = Pt(6)
            r_icon = p_note.add_run("✍️ Note for Cameron: ")
            r_icon.bold = True
            r_icon.font.size = Pt(9.5)
            r_icon.font.color.rgb = COLOR_ALERT
            r_note = p_note.add_run(action_note)
            r_note.font.size = Pt(9.5)
            r_note.font.color.rgb = COLOR_MUTED

    # --- COVER / HEADER ---
    p_top = doc.add_paragraph()
    p_top.paragraph_format.space_before = Pt(0)
    p_top.paragraph_format.space_after = Pt(2)
    r_sub = p_top.add_run("NATIONAL DISABILITY INSURANCE SCHEME (NDIS) ACCESS REQUEST")
    r_sub.font.size = Pt(10)
    r_sub.bold = True
    r_sub.font.color.rgb = COLOR_SECONDARY

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(4)
    r_main = p_title.add_run("Evidence of Disability: Treating Health Professional Form\n(Section 2 / Part B: Allied Health Assessment)")
    r_main.font.size = Pt(18)
    r_main.bold = True
    r_main.font.color.rgb = COLOR_PRIMARY

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(0)
    p_meta.paragraph_format.space_after = Pt(10)
    r_meta = p_meta.add_run(
        "Participant: James Jones  |  DOB: 20/01/1986  |  Medicare: 3634 32502 1 (Ref 1)  |  CRN: 303065993H\n"
        "Treating Health Professional: Cameron Bishop (Registered Physiotherapist)\n"
        "Assessment Purpose: Formal Evidence of Substantially Reduced Functional Capacity under Section 24, NDIS Act 2013"
    )
    r_meta.font.size = Pt(9.5)
    r_meta.font.color.rgb = COLOR_MUTED

    # Notice to Cameron Bishop
    add_callout(
        "Hi Cameron,\n\n"
        "To streamline your clinical documentation and save you time (similar to the format prepared for the Disability Support Pension), "
        "this separate Word document contains the complete set of questions from the official NDIS Supporting Evidence / Treating Health Professional Form (Part B).\n\n"
        "All clinical diagnoses, objective functional tests (gait analysis, foot drop, range of motion, dural tension), and daily functional domain "
        "impacts have been pre-filled based on your ongoing physical therapy assessments and treatment history. "
        "Please review the clinical details, edit or adjust any specific measurements or wording as you see fit, "
        "and complete your provider details and signature in Part G.",
        title="CLINICIAN INSTRUCTIONS & SUMMARY FOR CAMERON BISHOP (PHYSIOTHERAPIST)"
    )

    # ==========================================
    # PART 1: PRACTITIONER & PATIENT IDENTIFICATION
    # ==========================================
    add_section_header("Practitioner & Patient Details", "Section 1: Clinical Identification")

    tbl_ident = doc.add_table(rows=10, cols=2)
    tbl_ident.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_ident)

    ident_fields = [
        ("Treating Professional Name", "Cameron Bishop"),
        ("Professional Discipline / Title", "Registered Physiotherapist (AHPRA Registered / APAM Member)"),
        ("AHPRA Registration / Provider No.", "[Cameron: Insert AHPRA Registration No. & Clinic Provider No.]"),
        ("Clinic / Practice Name", "Treating Physiotherapy Practice (Wangaratta / Regional VIC)"),
        ("Clinic Address & Phone", "Wangaratta, Victoria, Australia  |  Phone: [Insert Clinic Phone]"),
        ("Patient / Applicant Name", "James Jones"),
        ("Patient Date of Birth", "20/01/1986  (Age: 40)"),
        ("Patient Medicare Details", "Card No: 3634 32502 1  |  Ref: 1  |  Expires: 07/2032"),
        ("Treating Relationship Duration", "Long-standing treating relationship providing ongoing physical therapy, rehabilitation, functional capacity monitoring, and spinal stabilization"),
        ("Frequency of Treatment", "Regular outpatient physical therapy, manual rehabilitation, exercise prescription, and clinical gait monitoring")
    ]

    for idx, (lbl, val) in enumerate(ident_fields):
        row = tbl_ident.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(2.4), Inches(4.3)
        set_cell_background(c0, HEX_BG_LIGHT)
        set_cell_margins(c0, top=70, bottom=70, left=120, right=120)
        set_cell_margins(c1, top=70, bottom=70, left=120, right=120)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before, p0.paragraph_format.space_after = Pt(0), Pt(0)
        r0 = p0.add_run(lbl)
        r0.bold, r0.font.size, r0.font.color.rgb = True, Pt(9.5), COLOR_PRIMARY
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before, p1.paragraph_format.space_after = Pt(0), Pt(0)
        r1 = p1.add_run(val)
        r1.font.size, r1.font.color.rgb = Pt(9.5), COLOR_TEXT

    # ==========================================
    # PART 2: DIAGNOSIS & PERMANENCE
    # ==========================================
    add_section_header("Diagnosis, Etiology & Permanence of Impairment", "Section 2: Medical & Impairment Profile")

    add_question(
        "2.1",
        "Primary physical, neurological, or sensory impairments treated:",
        "1. Complex Multi-Level Degenerative Spinal Pathology & Instability:\n"
        "   - Post-surgical Cervical Myelomalacia / Cord Injury status-post C5–C7 Anterior Cervical Discectomy & Fusion (ACDF).\n"
        "   - Adjacent Segment Pathology (C7–T1 junction) presenting with severe neuropathic burning evoked by contralateral arm movement.\n"
        "   - Severe L4–L5 and L5–S1 Lumbar Disc Protrusions/Extrusion with bilateral radiculopathy and acute dural traction irritability.\n\n"
        "2. Lower Motor Neuron (LMN) Deficit – Right Foot Drop:\n"
        "   - Pronounced weakness of right tibialis anterior and extensor hallucis longus (Medical Research Council Grade 3/5 dorsiflexion).\n"
        "   - Significant loss of active foot clearance during swing phase of gait, causing compensatory high-steppage gait, dragging of toes, and severe fall risk.\n\n"
        "3. Upper Motor Neuron (UMN) Disinhibition & Corticospinal Irritability:\n"
        "   - Marked bilateral patellar hyperreflexia (Grade 3+ to 4+ with unsustained clonus).\n"
        "   - Paradoxical neuro-axis cross-sensitization: acute lumbar nociceptive flares markedly exacerbate hyperreflexia and vice versa.\n\n"
        "4. Intractable Chronic Neuro-Mechanical Spine Pain & Severe Diurnal Paraspinal Spasms:\n"
        "   - Severe morning lumbar rigidity (VAS ~6.8/10) escalating under axial gravity loading to severe paraspinal spasms (VAS ~7.7/10) by evening.",
        "Adjust or expand clinical diagnosis terminology as preferred."
    )

    add_question(
        "2.2",
        "Is the impairment permanent? (Is there evidence the impairment is likely to be lifelong?)",
        "YES — The impairment is permanent and lifelong.\n\n"
        "Clinical Rationale:\n"
        "• Irreversible Structural Pathology: Spinal cord myelomalacia and structural multi-level spinal degeneration are irreversible. The patient has permanent post-surgical anatomical alteration (fused C5–C7) and chronic neural compromise.\n"
        "• Stability of Deficits: Motor deficits (right foot drop Grade 3/5) and neuropathic symptoms have persisted chronically despite surgical fusion, clinical physiotherapy, interventional pain injections, and tailored exercise rehabilitation.\n"
        "• Lifelong Prognosis: While physical therapy and clinical exercises are vital for maintaining baseline mobility, preventing joint contractures, and preventing falls, they will not reverse the underlying structural spinal cord and disc pathology.",
        ""
    )

    add_question(
        "2.3",
        "Have all known, available, and appropriate treatment options been exhausted?",
        "YES — All appropriate, evidenced-based conservative and surgical treatments have been explored or undertaken:\n"
        "• Surgery: Anterior cervical decompression and fusion (C5–C7) has been completed. Further invasive spine surgeries carry substantial neurological risk.\n"
        "• Pharmacotherapy: Multimodal analgesic management under pain specialist supervision (Dr. Brett Todhunter) including opioids, neuropathic modulators, and muscle relaxants.\n"
        "• Physical Therapy & Rehabilitation: Extensive individual physical therapy, clinical exercise programs, and hydrotherapy have been conducted over an extended timeframe.\n"
        "• Interventional Escalation: Currently undergoing specialist evaluation for long-term Spinal Cord Stimulator (SCS) implantation for intractable refractory pain.\n\n"
        "Conclusion: No medical, surgical, or therapeutic intervention will restore normal functional capacity. The residual functional deficits are permanent under Section 24(1)(b) of the NDIS Act.",
        ""
    )

    # ==========================================
    # PART 3: OBJECTIVE CLINICAL EXAMINATION FINDINGS
    # ==========================================
    add_section_header("Physiotherapy Objective Examination & Physical Findings", "Section 3: Objective Physical Findings")

    add_question(
        "3.1",
        "Gait & Locomotion Assessment (High-Steppage Pattern, Ground Clearance, Foot Drop):",
        "OBJECTIVE PHYSICAL FINDINGS:\n"
        "• Observational Gait Analysis: Pronounced antalgic, high-steppage gait pattern on the right side. Marked inability to achieve active heel strike on the right; the patient lands flat-footed or on the lateral forefoot.\n"
        "• Ground Clearance: Significant loss of ground clearance during swing phase due to right tibialis anterior weakness (Grade 3/5). The patient catches his right toes on low thresholds, uneven ground, and carpets, causing frequent stumbling and daily near-falls.\n"
        "• Cadence & Velocity: Substantially reduced walking velocity and cadence. Requires conscious visual monitoring of foot placement to avoid tripping.\n"
        "• Fall Hazard Severity: Due to the cervical fusion construct (C5–C7), any mechanical fall represents an acute risk of catastrophic adjacent segment failure or secondary spinal cord trauma.",
        "Include any measured gait speed, Timed Up and Go (TUG), or specific clinic observations if available."
    )

    add_question(
        "3.2",
        "Spine Range of Motion (ROM), Postural Tolerance & Neurodynamic Testing:",
        "OBJECTIVE PHYSICAL FINDINGS:\n"
        "• Lumbar Active Range of Motion: Active lumbar flexion is severely restricted to <20 degrees from vertical. Forward trunk flexion immediately triggers provocative dural shockwaves shooting up the sciatic nerve into the lumbar spine (positive Slump Test).\n"
        "• Lumbar Extension & Lateral Flexion: Guarded in all planes due to paraspinal muscle hypertonicity and facet arthropathy.\n"
        "• Static Postural Tolerance:\n"
        "  - Sitting: Intolerance to static sitting >15–20 minutes before dural traction pain and sciatic ache escalate.\n"
        "  - Standing: Intolerance to static upright standing >10–15 minutes due to axial spinal compression and rapid muscular fatigue.\n"
        "• Cervical Spine & Upper Limb Dynamics: Reduced cervical active rotation bilaterally (secondary to C5–C7 fusion). Abduction/scaption of the right arm provokes burning pain in the contralateral left C7–T1 junction.",
        ""
    )

    add_question(
        "3.3",
        "Neurological & Reflex Examination (Upper vs Lower Motor Neuron):",
        "OBJECTIVE PHYSICAL FINDINGS:\n"
        "• Deep Tendon Reflexes: Bilateral patellar hyperreflexia (Grade 3+ to 4+ with brisk excursion and unsustained clonus). Demonstrates Upper Motor Neuron disinhibition secondary to cervical myelomalacia.\n"
        "• Sensory & Vasomotor: Patient presents with cold-induced digital vasospasm/pallor in right fingers and patchy paresthesia across the right L5/S1 dermatome.\n"
        "• Motor Power Testing (MRC Scale):\n"
        "  - Right Tibialis Anterior (Ankle Dorsiflexion): Grade 3/5 (moves against gravity but easily breaks with minimal resistance).\n"
        "  - Right Extensor Hallucis Longus: Grade 3/5.\n"
        "  - Right Quadriceps & Hamstrings: Grade 4-/5 with rapid fatigue.\n"
        "  - Left Lower Limb: Grade 4+/5 to 5/5.",
        ""
    )

    # ==========================================
    # PART 4: FUNCTIONAL CAPACITY IMPACT (6 CORE DOMAINS)
    # ==========================================
    add_section_header("Functional Capacity Assessment (Section 24 NDIS Criteria)", "Section 4: Daily Functional Impact")

    add_callout(
        "In accordance with Section 24(1)(c) of the NDIS Act 2013, the following sections document the substantially reduced functional capacity "
        "observed clinically across core life domains, demonstrating that the patient requires lifelong disability support.",
        title="NDIS SECTION 24 STATUTORY DOMAIN ASSESSMENT",
        bg_hex=HEX_BG_ACCENT,
        border_color="1B365D"
    )

    # Domain 1: Mobility
    add_question(
        "4.1",
        "MOBILITY: Moving around the home, accessing community, walking, stairs, transfers, fine motor control",
        "PHYSIOTHERAPY ASSESSMENT — SUBSTANTIALLY REDUCED CAPACITY IN MOBILITY:\n\n"
        "• Walking & Fall Risk: The patient cannot ambulate safely on community terrain or for functional distances without acute tripping hazard from right foot drop. Walking is limited to short bouts before pain and fatigue force cessation.\n"
        "• Stairs & Elevation: Highly unsafe on stairs and steps. High-stepping fails to provide consistent stair clearance, creating extreme fall risk.\n"
        "• Transfers: Getting off the floor, out of low seating, or out of a bathtub is severely impaired. Patient requires upper limb leverage and stable support structures due to lumbar pain and lower limb weakness.\n"
        "• Fine Motor & Handwriting: Due to cervical myelomalacia, neck posture intolerance, and upper limb neuromuscular fatigue, the patient cannot physically handwrite standard forms without severe cervical spasm. Digital dictation tools are required.\n"
        "• Postural Pacing: Inability to maintain static postures requires frequent position shifts between lying supine, brief standing, and supported reclining.",
        ""
    )

    # Domain 2: Self-Care
    add_question(
        "4.2",
        "SELF-CARE: Showering, bathing, dressing, personal hygiene, meal preparation",
        "PHYSIOTHERAPY ASSESSMENT — SUBSTANTIALLY REDUCED CAPACITY IN SELF-CARE:\n\n"
        "• Lower Body Dressing: Severe functional impairment. Pulling on underwear, trousers, socks, and shoes requires lumbar flexion and trunk bending, which triggers acute provocative dural shockwaves. Patient requires adaptive dressing aids (long-handled shoe horns, sock aids) or physical assistance.\n"
        "• Showering & Bathing: Showering on wet, slippery surfaces poses a critical fall hazard due to unilateral foot drop and impaired proprioception. Patient requires a shower chair, grab rails, and non-slip aids to bathe safely.\n"
        "• Meal Preparation: Standing at a kitchen counter for more than 10 minutes induces severe paraspinal fatigue and spasm. Lifting heavy pots, reaching into low ovens, or handling boiling water is physically hazardous due to sudden spasm risk.",
        ""
    )

    # Domain 3: Self-Management
    add_question(
        "4.3",
        "SELF-MANAGEMENT: Domestic tasks, household maintenance, laundry, cleaning, shopping",
        "PHYSIOTHERAPY ASSESSMENT — SUBSTANTIALLY REDUCED CAPACITY IN DOMESTIC SELF-MANAGEMENT:\n\n"
        "• Heavy Domestic Tasks: Patient is completely unable to perform routine domestic cleaning, vacuuming, mopping floors, scrubbing bathrooms, or changing heavy bed linen. The repetitive bending, twisting, and axial shear forces provoke acute spinal flares.\n"
        "• Laundry & Waste: Cannot lift full laundry baskets or wheel heavy council garbage bins to the kerb.\n"
        "• Shopping & Heavy Lifting: Unable to push loaded supermarket shopping trolleys or carry grocery bags due to lumbar disc loading and foot drop gait instability. Completely dependent on delivery or assistance.\n"
        "• Transportation: Driving is restricted due to right leg motor weakness and sudden pedal control vulnerability; public transport is inaccessible due to high fall risk on buses/trains.",
        ""
    )

    # Domain 4: Social Interaction & Community Participation
    add_question(
        "4.4",
        "SOCIAL INTERACTION & COMMUNITY PARTICIPATION: Engaging in community life, maintaining relationships",
        "PHYSIOTHERAPY ASSESSMENT — SUBSTANTIALLY REDUCED CAPACITY:\n\n"
        "• Severe Community Disconnection: Due to unpredictable neuro-mechanical pain flares (ranging up to 9.5/10) and severe mobility restrictions, the patient is largely confined to his home environment.\n"
        "• Loss of Social Independence: Inability to navigate standard community seating, dining venues, or public spaces has resulted in profound isolation, requiring structured support worker assistance to access community safely.",
        ""
    )

    # Domain 5: Communication
    add_question(
        "4.5",
        "COMMUNICATION: Expressing needs, paperwork, written communication",
        "PHYSIOTHERAPY ASSESSMENT — FUNCTIONAL CAPACITY IMPACT:\n\n"
        "• Physical Writing Incapacity: Neuromuscular hand weakness and cervical posture-induced spasms prevent physical handwriting. Patient is fully dependent on voice dictation, ergonomic software, and assistive technology.\n"
        "• Cognitive Stamina: Intractable chronic pain creates cognitive fatigue, necessitating structured, clear, and paced administrative processes.",
        ""
    )

    # Domain 6: Learning
    add_question(
        "4.6",
        "LEARNING: Processing instructions, implementing rehabilitation routines, pacing strategies",
        "PHYSIOTHERAPY ASSESSMENT — FUNCTIONAL CAPACITY IMPACT:\n\n"
        "• Complex Rehabilitation Execution: Patient demonstrates good cognitive understanding of physical pacing but requires clear, documented, structured digital routines (such as hydrotherapy and adaptive exercise libraries) to pace safely without provoking acute neuro-mechanical crises.",
        ""
    )

    # ==========================================
    # PART 5: CLINICAL RECOMMENDATIONS & SUPPORTS
    # ==========================================
    add_section_header("Recommended NDIS Supports & Assistive Technology", "Section 5: Professional Recommendations")

    add_question(
        "5.1",
        "Prescribed / Recommended Assistive Technology (Capital Supports):",
        "1. Orthotic Mobility Support (CRITICAL FOR FALL PREVENTION):\n"
        "   - Prescription and fitting of a custom Ankle-Foot Orthosis (AFO) / dynamic foot-up brace for the right lower limb to restore toe clearance, eliminate high-steppage tripping, and safeguard the cervical fusion construct.\n\n"
        "2. Bathroom Safety & Personal Care Equipment:\n"
        "   - Medical-grade height-adjustable shower chair with armrests.\n"
        "   - Professional installation of bathroom grab rails (shower and toilet transfer points).\n\n"
        "3. Adaptive Daily Living Aids:\n"
        "   - Long-handled shoe horn, sock aid, and mechanical reacher/grabber tool to eliminate provocative lumbar trunk flexion.\n\n"
        "4. Ergonomic & Assistive Computing Equipment:\n"
        "   - Sit-to-stand motorized desk, ergonomic chair with high cervical headrest, and dedicated voice-to-text dictation software to accommodate handwriting disability.",
        "Add any specific brace models or modifications you feel are best suited."
    )

    add_question(
        "5.2",
        "Recommended Core & Capacity Building Supports:",
        "1. Core Supports – Assistance with Daily Living (Support Worker):\n"
        "   - Funded support worker hours (e.g., 6–10 hours/week) for domestic cleaning, changing linen, meal preparation, heavy lifting, and yard maintenance.\n\n"
        "2. Core Supports – Transport & Community Access:\n"
        "   - Support worker transport assistance to attend medical appointments, clinical hydrotherapy, and community access.\n\n"
        "3. Capacity Building – Ongoing Allied Health & Clinical Maintenance:\n"
        "   - Ongoing Physiotherapy (1x fortnightly/monthly for spinal joint mobilization, neurodynamic management, and gait monitoring).\n"
        "   - Specialized Exercise Physiology (1x weekly) for tailored, low-load core stabilization and neuro-muscular conditioning.\n"
        "   - Guided Hydrotherapy sessions in warm water (2–3x weekly) to unload axial spine gravity and suppress evening muscle spasticity.\n\n"
        "4. Capacity Building – Support Coordination:\n"
        "   - Level 2 Support Coordination to organize, implement, and monitor complex multidisciplinary care pathways.",
        ""
    )

    # ==========================================
    # PART 6: DECLARATION & SIGN-OFF
    # ==========================================
    add_section_header("Treating Practitioner Declaration & Sign-off", "Section 6: Formal Declaration")

    add_question(
        "6.1",
        "Treating Health Professional Declaration & Sign-off:",
        "PRACTITIONER DECLARATION:\n"
        "I, Cameron Bishop, confirm that I am a registered Physiotherapist currently treating James Jones. "
        "I declare that the information provided in this assessment is true, correct, and based on my professional clinical examinations, "
        "objective physical findings, and treating relationship with the patient.\n\n"
        "In my professional opinion, James Jones has permanent physical and neurological impairments resulting in substantially reduced "
        "functional capacity across mobility, self-care, and self-management, satisfying the statutory disability access requirements "
        "under Section 24 of the National Disability Insurance Scheme Act 2013.\n\n"
        "Practitioner Name:      Cameron Bishop\n"
        "Professional Title:     Registered Physiotherapist\n"
        "AHPRA Registration:     [Cameron: Insert AHPRA Number]\n"
        "Clinic / Practice:      [Cameron: Insert Practice Name / Stamp]\n"
        "Practice Address:       [Cameron: Insert Practice Address]\n"
        "Practice Phone / Email: [Cameron: Insert Contact Details]\n\n"
        "Signature:              _________________________________________\n\n"
        "Date:                   ____ / ____ / 2026\n",
        "Sign and date above, and apply clinic stamp if applicable."
    )

    # Footer note
    p_end = doc.add_paragraph()
    p_end.paragraph_format.space_before = Pt(16)
    p_end.paragraph_format.space_after = Pt(0)
    r_end = p_end.add_run("― End of NDIS Treating Health Professional Supporting Evidence Document ―")
    r_end.font.size = Pt(9.5)
    r_end.font.italic = True
    r_end.font.color.rgb = COLOR_MUTED
    p_end.alignment = WD_ALIGN_PARAGRAPH.CENTER

    output_filename = "NDIS_Treating_Health_Professional_Evidence_Cameron_Bishop_Physio.docx"
    doc.save(output_filename)
    print(f"Document successfully created: {output_filename}")
    return output_filename

if __name__ == "__main__":
    create_ndis_physio_evidence_document()
