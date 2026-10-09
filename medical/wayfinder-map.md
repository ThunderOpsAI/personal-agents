## Destination

Fully written `SKILL.md` files for 5 specific medical personas and 1 Medical Overseer orchestrator, alongside a structured directory system for storing physical medical records, ready for manual CLI invocation.

## Notes

- **Domain:** Personal Medical Management, Chronic Pain, Post-operative (Cervical Fusion), ADHD.
- **Rules:** Output is decision support, not diagnosis. Preserve medical disclaimers. Do not override clinician restrictions.
- **Roles:**
  1. Medical Overseer / Orchestrator (MDT Lead & conflict resolution)
  2. Surgeon (Neuro / Ortho / Plastic)
  3. Physiotherapist
  4. Medical Researcher
  5. General Practitioner (GP)
  6. Diagnostic Practitioner
  7. Neuro-Psychiatric Pain Specialist (Neuro-PPS: Psych + Pain + Pharmacology)

## Decisions so far

- [Scaffold medical records directories](ticket-1) — Created `records/` with subfolders for Imaging, Referrals, Invoices, Rehab, Mental Health, Medication, Implants/Devices, Labs, Clinical Notes.
- [Define Medical Overseer logic](ticket-2) — Overseer acts as a Multi-Disciplinary Team (MDT) lead. Facilitates discussion, presents options, and provides a final recommendation. Added a combined "Surgeon" persona.
- [Define Neuro-PPS scope](ticket-3) — Proactive on pharmacology: advises on drug existence, risks, costs, and access pathways (e.g., Ozempic). Relies on Medical Researcher for evidence.
- [Draft the GP, Diagnostic Practitioner, and Surgeon skills](ticket-4) — Created `SKILL.md` files for these three personas in `medical/skills/`.
- [Draft the Physiotherapist, Medical Researcher, and Neuro-PPS skills](ticket-5) — Created `SKILL.md` files for these three personas in `medical/skills/`.
- [Draft the Medical Overseer / Orchestrator skill](ticket-6) — Created `SKILL.md` in `medical/skills/medical-overseer/`.

## Open Tickets (Frontier)

*The map is fully charted and executed. No open tickets remain.*

## Not yet specified

- How the Overseer parses and weighs conflicting advice from sub-personas.
- What specific scientific databases the Medical Researcher and Neuro-PPS should query (e.g., PubMed, OpenFDA, ChEMBL).
- How the Physiotherapist integrates with the existing 25-30 Rumble OS yoga routines.
- What format the Diagnostic Practitioner expects user inputs (e.g., text descriptions vs. parsed imaging reports).

## Out of scope

- Automated scheduling of appointments or autonomous sending of emails to doctors.
- Live integration into Rumble OS daily agenda (currently CLI invocation only).
