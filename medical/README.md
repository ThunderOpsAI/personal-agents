# Medical — Personal MDT System

This directory holds your personal Multi-Disciplinary Medical Team (MDT) records and supporting skill definitions.

## How to use

Talk to your medical team naturally in the AGY CLI. The **medical-team** skill will automatically engage whenever you mention pain, medications, symptoms, spine, rehab, ADHD, surgical history, or anything health-related.

Examples:
- *"My neck is flaring at 7/10 and I can't sleep — what's the MDT view?"*
- *"Is duloxetine safe to combine with my current dexamphetamine dose?"*
- *"Can I start deadlifting again given my fusion?"*
- *"Prepare me for my appointment with Dr Anderson next week."*

## Team structure

| Persona | Skill file | Role |
|---------|-----------|------|
| MDT Orchestrator | `MDT.md` | Routes query, resolves conflicts, medication cross-check |
| General Practitioner | `GP.md` | Triage, holistic overview, referrals |
| Physiotherapist | `PHYSIO.md` | Rehab, movement, hydrotherapy |
| Chiropractor | `CHIRO.md` | Spinal biomechanics |
| Osteopath | `OSTEO.md` | Fascial, visceral, craniosacral |
| Neurosurgeon | `NEURO_SURGEON.md` | Cervical fusion, decompression candidacy |
| Orthopaedic Surgeon | `ORTHO_SURGEON.md` | Peripheral MSK, non-spinal surgical |
| Pain Management | `PM.md` | Interventional procedures, pharmacology |
| Psychiatrist | `PSYCH.md` | ADHD, mental health, psychopharmacology |

All skill files live in: `../.agents/skills/medical-team/`

## Records

Physical and digital records go in the subdirectories below. Drop in PDFs, scans, or typed notes — the diagnostic practitioner persona will read and interpret them.

```
records/
  Imaging/               MRI, X-ray, CT reports
  Labs_and_Pathology/    Blood panels, pathology
  Clinical_Notes/        Specialist and GP appointment notes
  Implants_and_Devices/  Medtronic and other implant details
  Medication_and_Scripts/ Scripts and medication history
  Mental_Health/         Psychiatric records
  Rehab_Programs/        Physiotherapy and yoga programs
  Referrals/             Referral letters
  Invoices/              Medical invoices and receipts
```

## Reports

Every MDT synthesis, medication analysis, or consultation prep is saved automatically to:

```
../agent_reports/YYYY-MM-DD_<description>.md
```

Key reports already on file:
- `agent_reports/MEDICAL_CONTEXT.md` — full medical history
- `agent_reports/medical_symptom_report.md` — current symptom snapshot
- `agent_reports/notes_dr_nathan_anderson_20260804.md` — neurosurgeon notes
- `agent_reports/2026-08-03_multisite_pain_mapping_and_interventions.md`

## Safety

All output is **decision support only**, not diagnosis or prescription. Every response ends with a mandatory safety footer. Acute escalation (pain >= 8/10, new neurological symptoms, suspected medication interaction) triggers an additional safety clause.
