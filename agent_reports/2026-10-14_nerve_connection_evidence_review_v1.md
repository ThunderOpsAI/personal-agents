# Nerve Connection Evidence Review (v1)

- Date: 2026-10-14
- Source ticket: `docs/wayfinder/rumble-oct-refresh/tickets/08-nerve-connection-research.md`
- MDT personas: Neurosurgeon, GP, Pain Management, Physiotherapist
- Status: Decision support for clinician discussion. Not a diagnosis.

> Medical disclaimer: This report is decision support and appointment preparation only. It does not diagnose any condition or replace examination by a treating clinician. Citations should be checked by the clinician; the agent did not examine the patient or view imaging directly.

## 1. Question

Can one spinal cause (cervical/thoracic cord compression, myelopathy, or nerve-root compression) explain all three of: (a) hyperreflexia, (b) sciatica, and (c) cold-triggered white, numb index fingertips? What else could explain them, and which tests tell them apart?

## 2. Relevant personal context (from local records)

- C5-C7 anterior cervical decompression and fusion, 24 June 2026 (`agent_reports/2026-10-02_monday_doctor_consult_prep_hyperreflexia_cervical_cns.md`).
- Brisk patellar reflexes, raising concern for an upper motor neuron (UMN) sign; differential documented there as static post-decompression myelomalacia vs new or adjacent-segment compression (C4-C5, C7-T1).
- Pain logs show right lumbar pain dominant (about 62%) with right sciatica (about 8%), plus neck, right shoulder, thoracic components (`agent_reports/medical_symptom_report.md`).
- Whole-spine involvement and possible further fusion candidacy (`agent_reports/MEDICAL_CONTEXT.md`).
- Clinician movement restrictions in `agent/skills/rehab_rules.md` remain in force and are not altered by this report.

## 3. Bottom line

1. No single spinal lesion is likely to explain all three symptoms well. The best-supported model is two or three overlapping processes:
   - Cervical (or upper thoracic) cord dysfunction explains hyperreflexia (UMN sign).
   - Lumbar nerve-root compression (typically L4-S1) explains sciatica. Lumbar root compression produces reduced, not increased, reflexes at the affected level, so it cannot itself cause hyperreflexia.
   - Episodic, cold-triggered white fingertips with a colour-change sequence is the classic description of Raynaud's phenomenon, a vascular (vasospastic) process. Cord or root compression produces numbness, but not blanching (whitening) triggered by cold.
2. A cervical-plus-lumbar combination ("tandem spinal stenosis") is well recognised and can mask findings: lumbar root disease can dampen leg reflexes that cervical myelopathy would otherwise make brisk, and vice versa.
3. The finger symptom is the most important one to characterise carefully: if the fingertip actually turns white (pallor) with cold, then rewarms blue/red, vascular evaluation is needed regardless of spine findings. If it is numbness without colour change, cervical root (C6/C7) or median nerve (carpal tunnel) causes rise up the list.

## 4. Evidence summary

### 4.1 Degenerative cervical myelopathy (DCM) and post-fusion states

- DCM presents with hand clumsiness, numb hands, gait imbalance, and UMN signs (hyperreflexia, Hoffmann sign, clonus, Babinski) (Davies et al., BMJ 2018; Fehlings et al., AO Spine/CSRS guideline, Global Spine J 2017).
- A diagnostic cluster of gait deviation, positive Hoffmann sign, inverted supinator sign, Babinski, and age over 45 had high specificity when 3 of 5 were present (Cook et al., J Man Manip Ther 2010). Individual signs like Hoffmann have limited sensitivity; a negative test does not rule myelopathy out.
- After decompression, persistent hyperreflexia may reflect intrinsic cord change (T2 signal, myelomalacia) rather than ongoing compression; adjacent-segment degeneration above or below a fusion is a recognised later cause of new compression (Fehlings 2017 guideline; Davies 2018).
- Cervical myelopathy numbness is usually glove-like, constant or posture-related, and not cold-blanching.

### 4.2 Thoracic cord compression

- Thoracic myelopathy produces lower-limb UMN signs (brisk knee and ankle reflexes, clonus, Babinski) with normal arm reflexes and no Hoffmann sign. It does not explain hand symptoms. This difference (arm reflexes normal vs brisk) is a key localising clue.

### 4.3 Sciatica (lumbar radiculopathy)

- Sciatica is most often caused by L4-L5 or L5-S1 disc herniation or stenosis compressing a nerve root; root compression is a lower motor neuron lesion and reduces the reflex at that level (e.g. reduced ankle jerk with S1) (NICE NG59, Low back pain and sciatica in over 16s, 2016, updated 2020).
- Cord compression can cause non-dermatomal leg pain ("funicular pain") that mimics sciatica, but this is uncommon; dermatomal, straight-leg-raise positive leg pain points to the lumbar root.
- Tandem cervical and lumbar stenosis is reported in a meaningful minority of patients with symptomatic stenosis at either level, and guidelines advise examining and, where indicated, imaging both regions (Davies 2018; tandem stenosis literature summarised in AO Spine guideline discussion).

### 4.4 Competing explanations for cold-triggered white numb index fingertips

| Condition | Typical features | Fits "white with cold"? | Key test |
|---|---|---|---|
| Primary Raynaud's phenomenon | Episodic, well-demarcated pallor then cyanosis/redness on cold or stress; symmetric; normal nailfold capillaries; no ulcers | Strong fit | Clinical history, photo of an attack, nailfold capillaroscopy, ANA |
| Secondary Raynaud's (e.g. systemic sclerosis, lupus, vibration exposure, some medicines such as stimulants/beta-blockers) | Older onset, asymmetric, painful, digital ulcers, abnormal capillaries, positive antibodies | Strong fit | ANA, ENA, inflammatory markers, capillaroscopy, medication review |
| Thoracic outlet syndrome (neurogenic or arterial) | Arm heaviness/paraesthesia with overhead use; arterial TOS can cause unilateral digital ischaemia/emboli | Possible, especially if one-sided | Positional exam, duplex ultrasound with arm positioning, CT/MR angiography if arterial suspected |
| Carpal tunnel syndrome | Night numbness thumb/index/middle, shaking relieves it; may feel cold, but not true blanching | Weak (numbness yes, whitening no) | NCS, Phalen/Tinel, ultrasound |
| C6/C7 radiculopathy (including adjacent-segment to fusion) | Neck-arm pain, dermatomal numbness, reduced biceps/triceps reflex | Weak (no blanching) | Exam, MRI cervical, EMG |
| Peripheral polyneuropathy (diabetes, B12, thyroid, alcohol) | Stocking-glove, feet before hands, reduced reflexes | Weak | Bloods (HbA1c, B12, TSH), NCS |

Sources: Wigley and Flavahan, Raynaud's phenomenon, N Engl J Med 2016; Maverakis et al., International consensus criteria for the diagnosis of Raynaud's phenomenon, J Autoimmun 2014; Illig et al., SVS reporting standards for thoracic outlet syndrome, J Vasc Surg 2016; AAOS Clinical Practice Guideline, Management of Carpal Tunnel Syndrome (2016, updated 2024).

Medication note for the clinician: stimulant ADHD medicines are listed among drugs associated with peripheral vasculopathy including Raynaud's phenomenon (FDA safety communication, 2013). If the user takes a stimulant, this is worth raising with the prescriber. Do not change any medication without the prescriber.

## 5. Tests that distinguish the explanations

| Test | What it distinguishes |
|---|---|
| Full UMN exam: arm and leg reflexes, Hoffmann, inverted supinator, clonus, Babinski, tandem gait, Romberg | Cervical (arms and legs brisk) vs thoracic (legs only) vs none |
| MRI cervical spine (with attention to C4-C5 and C7-T1 adjacent levels and cord T2 signal), compared to pre-op imaging | Static myelomalacia vs new/adjacent compression |
| MRI thoracic spine if legs brisk but arms normal | Thoracic cord compression |
| MRI lumbar spine | Root level and cause of sciatica |
| NCS/EMG upper and lower limbs | Root vs median nerve (carpal tunnel) vs polyneuropathy; quantifies root damage |
| Cold-provocation history, photo of attacks, nailfold capillaroscopy | Confirms and classifies Raynaud's |
| Bloods: ANA, ENA, ESR/CRP, FBC, HbA1c, B12, TSH | Secondary Raynaud's and neuropathy screens |
| Positional duplex ultrasound of subclavian artery | Arterial thoracic outlet syndrome |

## 6. Red flags requiring urgent review (same day, ED or urgent GP)

- New or worsening weakness, falls, or rapidly worsening walking or balance.
- New loss of hand dexterity (dropping things, buttons, handwriting) that is progressing.
- Saddle numbness, new bladder or bowel retention/incontinence, or sexual dysfunction (possible cauda equina syndrome).
- Sciatica in both legs or progressive foot drop.
- A finger that stays white or blue and does not rewarm, develops an ulcer, or becomes very painful (digital ischaemia).
- New neck symptoms with fever, wound changes, swallowing or breathing difficulty after fusion.
- Electric shocks down the spine with neck flexion that are new (Lhermitte sign), with progression.

## 7. Questions to bring to the spine specialist or neurologist

1. Is my hyperreflexia new since the June 2026 fusion, unchanged, or improving? Are my arm reflexes and Hoffmann sign also brisk?
2. Do I need a repeat cervical MRI to compare cord signal and check C4-C5 and C7-T1 adjacent levels?
3. If arms are normal but legs brisk, should my thoracic spine be imaged?
4. Is my sciatica explained by a specific lumbar root on MRI, and does my ankle reflex suggest S1 involvement?
5. Could I have tandem cervical and lumbar stenosis, and which should be prioritised?
6. Would NCS/EMG help separate root, carpal tunnel, and neuropathy causes for my hand and leg symptoms?
7. My index fingertips go white and numb in the cold. Does that sound vascular (Raynaud's) rather than nerve? Should I have ANA, capillaroscopy, or a rheumatology referral?
8. Could any of my current medicines contribute to cold, white fingers?
9. Are any of my current yoga, hydrotherapy, or cold exposures (pool temperature) unsafe given these findings?
10. Which changes in symptoms should trigger an urgent call to you?

## 8. Practical tracking suggestions (for Rumble pain log)

- When fingertips whiten, log: which fingers, one or both hands, trigger (cold, stress, pool), colour sequence, duration, and take a photo.
- Log any change in grip, dexterity, gait, or balance as a separate note; these are the earliest signs of myelopathy progression.
- Keep hands warm before and after hydrotherapy; this is a comfort measure, not treatment.

## 9. Proposed Nerves encyclopaedia outline (feeds ticket 03)

1. Upper vs lower motor neuron signs: why reflexes go up or down.
2. Cervical myelopathy and life after fusion.
3. Thoracic cord: the often-missed middle.
4. Sciatica and lumbar roots.
5. Tandem stenosis: when two levels overlap.
6. Nerve or blood vessel? Raynaud's vs neuropathy.
7. Peripheral entrapments: carpal tunnel and thoracic outlet.
8. Tests explained: MRI, NCS/EMG, Hoffmann, capillaroscopy.
9. Red flags and when to call.

## 10. References

1. Davies BM, Mowforth OD, Smith EK, Kotter MRN. Degenerative cervical myelopathy. BMJ. 2018;360:k186.
2. Fehlings MG, Tetreault LA, Riew KD, et al. A clinical practice guideline for the management of patients with degenerative cervical myelopathy. Global Spine J. 2017;7(3 Suppl):70S-83S.
3. Cook C, Brown C, Isaacs R, et al. Clustered clinical findings for diagnosis of cervical spine myelopathy. J Man Manip Ther. 2010;18(4):175-180.
4. National Institute for Health and Care Excellence. Low back pain and sciatica in over 16s: assessment and management (NG59). 2016, updated 2020.
5. Wigley FM, Flavahan NA. Raynaud's phenomenon. N Engl J Med. 2016;375(6):556-565.
6. Maverakis E, Patel F, Kronenberg DG, et al. International consensus criteria for the diagnosis of Raynaud's phenomenon. J Autoimmun. 2014;48-49:60-65.
7. Illig KA, Donahue D, Duncan A, et al. Reporting standards of the Society for Vascular Surgery for thoracic outlet syndrome. J Vasc Surg. 2016;64(3):e23-e35.
8. American Academy of Orthopaedic Surgeons. Management of Carpal Tunnel Syndrome Evidence-Based Clinical Practice Guideline. 2016 (updated 2024).
9. US Food and Drug Administration. Drug Safety Communication: ADHD stimulant medicines and risk of peripheral vasculopathy, including Raynaud's phenomenon. 2013.

---
*This is appointment preparation and second-opinion context, not a clinical
recommendation to act on independently. Discuss with your spine surgeon (neurosurgeon) and a neurologist, and with a rheumatologist or vascular specialist regarding the finger symptoms, before making changes to your treatment.*
*Discuss with your prescribing GP or pharmacist before adjusting any medication.*
*If symptoms are acute or worsening, seek medical attention promptly.*
