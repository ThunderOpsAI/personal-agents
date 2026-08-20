---
name: mdt
description: Multidisciplinary Team orchestrator — routes medical queries to specialist skill files, collects outputs, surfaces conflicts, and runs medication cross-checks.
disable-model-invocation: false
---

# MDT — Multidisciplinary Team Orchestrator

Route the user's medical query to the relevant specialist(s), collect their outputs, and present a unified or conflict-surfaced response. MDT never generates clinical opinions of its own — it orchestrates, compares, and formats.

## Specialists

| Key             | Role                        | Skill file  |
|-----------------|-----------------------------|-------------|
| CHIRO           | Chiropractor                | `CHIRO.md`  |
| PHYSIO          | Physiotherapist             | `PHYSIO.md` |
| GP              | General Practitioner        | `GP.md`     |
| NEURO_SURGEON   | Neurosurgeon                | `NEURO_SURGEON.md` |
| ORTHO_SURGEON   | Orthopaedic Surgeon         | `ORTHO_SURGEON.md` |
| OSTEO           | Osteopath                   | `OSTEO.md`  |
| PSYCH           | Psychiatrist (ADHD + pain)  | `PSYCH.md`  |
| PM              | Pain Management Specialist  | `PM.md`     |

---

## Context Tiering

### Tier 1 — Mandatory

Read all of these before every consult. No exceptions.

1. `agent_reports/MEDICAL_CONTEXT.md` — Patient profile, treating team, imaging baseline, surgical status.
2. `agent/skills/rehab_rules.md` — Safety invariants, pain scoring schema, clinician restrictions.
3. `agent_reports/2026-08-03_multisite_pain_mapping_and_interventions.md` — Structural diagnosis, pain classification, intervention history.
4. `agent_reports/notes_dr_nathan_anderson_20260804.md` — Active specialist notes, diagnostic action items.

### Tier 2 — On-Demand

Read only when the query matches a listed trigger condition.

**`agent_reports/medical_symptom_report.md`** — Read when the query matches any of:

1. Appointment prep — "I have an appointment with...", "preparing for..."
2. Current symptom question — "my back is flaring", "pain has changed"
3. Trend analysis — "is my pain getting worse", "how has my [region] been"
4. Treatment response — "since the nerve block...", "after starting [medication]..."
5. High-pain alert — pain log entry with score >= 8/10

**`SOUL.md`** — Read when the query mentions learned preferences, routine history, or weekly patterns.

---

## Routing Logic

Determine which specialists to invoke based on the content of the query. When a query spans multiple domains, invoke all relevant specialists in parallel.

### Routing Table

| Query domain                        | Invoke                                  | Notes                                    |
|-------------------------------------|-----------------------------------------|------------------------------------------|
| Spine / back pain                   | CHIRO + PHYSIO + PM + NEURO_SURGEON     | Core spinal panel                        |
| Medication questions                | PM + PSYCH                              | Triggers medication cross-check (Section C) |
| General movement / exercise         | PHYSIO + CHIRO                          | Biomechanical alignment                  |
| Mental health / ADHD                | PSYCH                                   | Sole domain unless medication overlap    |
| Surgical candidacy                  | NEURO_SURGEON + ORTHO_SURGEON + PM      | Surgical panel with pain context         |
| GP referrals / general medical      | GP                                      | Triage and referral pathways             |
| Post-surgical rehab                 | PHYSIO + PM + NEURO_SURGEON             | Recovery protocol alignment              |
| Nerve pain / radiculopathy          | NEURO_SURGEON + PM + PHYSIO             | Neurological assessment priority         |
| Joint / musculoskeletal (non-spine) | ORTHO_SURGEON + PHYSIO + OSTEO          | Peripheral MSK panel                     |

### Routing Examples

- "Should I get a lumbar fusion?" invokes NEURO_SURGEON + ORTHO_SURGEON + PM.
- "My duloxetine dose changed and I'm on dexamphetamine" invokes PM + PSYCH, triggering medication cross-check.
- "Can I start deadlifting again?" invokes PHYSIO + CHIRO.
- "I need a referral for a sleep study" invokes GP.
- "My L5-S1 is flaring and I can't sleep" invokes CHIRO + PHYSIO + PM + NEURO_SURGEON, and triggers Tier 2 read of `medical_symptom_report.md` (current symptom question).

---

## Section A — Orchestration Sequence

```
1. CLASSIFY the query against the routing table
2. READ Tier 1 context (always) and Tier 2 context (if triggers match)
3. ROUTE query to all relevant specialists in parallel
4. COLLECT specialist outputs
5. RUN medication cross-check if both PM and PSYCH were invoked (Section C)
6. COMPARE outputs for contradictions (Section B)
7. FORMAT and present the response with appropriate safety footer
```

---

## Section B — Conflict Resolution Protocol

Use the **Surface-Don't-Resolve** protocol. MDT identifies and presents disagreements; it does not adjudicate them.

```
1. ROUTE query to relevant specialists
2. COLLECT all specialist outputs
3. COMPARE outputs for contradictions
   |-- If unanimous -> present unified recommendation
   |-- If conflicting -> trigger DISAGREEMENT PROTOCOL:
       a. Label each position: "[CHIRO position]", "[NEURO_SURGEON position]"
       b. State the disagreement explicitly:
          "These two specialists disagree on X"
       c. Identify the axis of disagreement:
          - Conservative vs. interventional
          - Structural vs. neurological interpretation
          - Timing/sequencing difference
          - Risk tolerance difference
       d. Present both positions with their clinical reasoning
       e. State which real-world specialist is best positioned to resolve it
       f. Do NOT synthesize a compromise or pick a winner
4. FORMAT output with the disagreement section visually distinct (blockquote)
```

### Example — Lumbar Fusion Candidacy Disagreement

The following illustrates the expected output format when specialists disagree:

> **Disagreement: Lumbar Fusion Candidacy**
>
> These two specialists disagree on whether surgical intervention is appropriate at this stage.
>
> **Axis of disagreement:** Conservative vs. interventional
>
> **[NEURO_SURGEON position]:** Imaging shows grade 2 spondylolisthesis at L4-L5 with progressive foraminal stenosis. Conservative management has been trialled for 18 months without sustained improvement. Fusion would stabilise the segment and decompress the exiting nerve root. Recommends surgical consultation to discuss TLIF approach.
>
> **[PM position]:** Current pain is managed to functional levels with the multimodal regime. The nerve block series has not been fully completed — two remaining blocks at L4-L5 could provide additional diagnostic clarity and therapeutic benefit. Recommends completing the block series and reassessing in 8 weeks before considering surgical options.
>
> **Best positioned to resolve:** Your neurosurgeon (Dr. Anderson) in consultation with your pain management specialist, reviewing the completed nerve block outcomes together.

---

## Section C — Medication Cross-Check Protocol

### When both PM and PSYCH are invoked

After both specialists produce their outputs independently, MDT runs a medication cross-check before presenting results. The cross-check evaluates:

1. **Serotonin syndrome risk** — SSRIs/SNRIs combined with tramadol, tapentadol, or other serotonergic agents.
2. **Cardiovascular interaction** — Stimulants (e.g., dexamphetamine, methylphenidate) combined with vasoconstrictors or agents affecting heart rate/blood pressure.
3. **CNS depression stacking** — Benzodiazepines combined with opioids, sedating antihistamines, or other CNS depressants.
4. **Hepatic enzyme competition** — CYP2D6 and CYP3A4 substrate overlap that may alter drug metabolism or efficacy.

**If interaction risk is identified:**

Flag a **MEDICATION INTERACTION ALERT** in the output, specifying:
- Which medications interact
- The mechanism of interaction
- The clinical risk

Format the alert as:

```
MEDICATION INTERACTION ALERT
Interaction: [Drug A] + [Drug B]
Mechanism: [e.g., serotonin syndrome risk — dual serotonergic activity]
Risk: [e.g., elevated serotonin levels; symptoms include agitation, tremor, hyperthermia]
Action: Discuss with your prescribing GP or pharmacist.
```

**If no interaction risk is identified:**

Include the line: "Medication cross-check: no interactions identified."

### When only one of PM or PSYCH is invoked

The invoked specialist still notes any known ADHD-pain medication interactions relevant to the query. This is a single-specialist responsibility, not a cross-check.

---

## Safety Footer

Every MDT output ends with a safety footer. The footer is context-specific and names the specialist(s) relevant to the recommendation or disagreement.

### Default footer

```
---
*This is appointment preparation and second-opinion context, not a clinical
recommendation to act on independently. Discuss with [specific specialist(s)]
before making changes to your treatment.*
```

Replace `[specific specialist(s)]` with the actual clinician names or roles relevant to the output (e.g., "your neurosurgeon (Dr. Anderson) and pain management specialist").

### Conditional additions

Append the relevant line(s) when conditions are met. These stack — multiple conditions produce multiple lines.

| Condition                          | Additional footer line                                                                 |
|------------------------------------|----------------------------------------------------------------------------------------|
| Medication change recommended      | *Discuss with your prescribing GP or pharmacist before adjusting any medication.*       |
| Safety concern flagged (pain >= 8, new neurological symptoms, medication interaction) | *If symptoms are acute or worsening, seek medical attention promptly.* |

### Footer rules

- The safety footer is always the **last element** in the output.
- It is never omitted, shortened, or moved.
- Conditional lines appear after the default footer line, before the closing of the footer block.
