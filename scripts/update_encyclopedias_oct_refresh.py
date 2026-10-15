import re
import json

with open('dashboard/lib/encyclopedias.ts', 'r', encoding='utf-8') as f:
    orig = f.read()

# 1. Update interface Encyclopedia
# Replace id: "pain" | "ai" | "tech" | "cbt"; with id: string; and add archived?: boolean;
if 'id: "pain" | "ai" | "tech" | "cbt";' in orig:
    orig = orig.replace(
        'id: "pain" | "ai" | "tech" | "cbt";\n  title: string;',
        'id: string;\n  title: string;\n  archived?: boolean;'
    )

# 2. Add archived: true to ai and tech
orig = orig.replace(
    '  "ai": {\n    "id": "ai",',
    '  "ai": {\n    "id": "ai",\n    "archived": true,'
)
orig = orig.replace(
    '  "tech": {\n    "id": "tech",',
    '  "tech": {\n    "id": "tech",\n    "archived": true,'
)

# 3. Prepare the new encyclopedias: nerves, nutrition, business
nerves_chapters = [
    {
        "id": "nerves-ch1",
        "chapterNumber": 1,
        "title": "Upper vs Lower Motor Neuron Signs: Why Reflexes Go Up or Down",
        "subtitle": "Decoupling spinal cord pathways from peripheral nerve root compression",
        "readingTimeMin": 15,
        "summary": "Hyperreflexia and brisk tendon jerks indicate upper motor neuron (UMN) disinhibition along the spinal cord, whereas root lesions (radiculopathy) suppress reflexes. Understanding this distinction clarifies why disparate symptoms coexist.",
        "keyTakeaways": [
            "Upper motor neurons travel down the spinal cord corticospinal tracts; compression removes inhibitory control, causing hyperreflexia and clonus.",
            "Lower motor neurons exit the spine into peripheral nerves; compression interrupts the reflex arc, diminishing or abolishing reflexes.",
            "Pathological briskness in lower limb reflexes (patellar, Achilles) points to cervical or thoracic cord compromise, not lumbar roots."
        ],
        "content": "<h3>1. The Biomechanics of Motor Pathways</h3><p>The nervous system divides motor control into two primary functional divisions: <strong>Upper Motor Neurons (UMN)</strong>, which reside within the brain and descend down the spinal cord, and <strong>Lower Motor Neurons (LMN)</strong>, which branch outward from the spinal cord anterior horn cells to directly innervate peripheral muscles.</p><div style=\"background: rgba(168, 85, 247, 0.08); border-left: 4px solid #a855f7; padding: 12px 16px; margin: 16px 0; border-radius: 4px;\"><strong>The Cardinal Distinction:</strong><ul><li><strong>UMN Lesion (Cord Compression / Myelopathy):</strong> Hyperreflexia (+3 to +4 brisk reflexes), Hoffmann sign, ankle clonus, spasticity, loss of fine motor dexterity.</li><li><strong>LMN Lesion (Nerve Root / Radiculopathy / Sciatica):</strong> Hyporeflexia (0 to +1 diminished reflex), flaccid muscle weakness, focal dermatomal numbness.</li></ul></div><h3>2. Clinical Implication: The Disconnected Reflex</h3><p>When an individual presents with brisk patellar reflexes alongside classic sciatica, the hyperreflexia cannot physiologically originate from the lumbar nerve root. A compressed L5 or S1 nerve root causes reflex loss, not elevation. Therefore, brisk lower-limb reflexes indicate that higher neural structures (cervical or thoracic cord) lack inhibitory modulation, demanding comprehensive multi-level neurological appraisal.</p>"
    },
    {
        "id": "nerves-ch2",
        "chapterNumber": 2,
        "title": "Cervical Myelopathy & Life After Fusion (C5-C7)",
        "subtitle": "Biomechanics of the anterior fusion construct, adjacent segment strain, and cord monitoring",
        "readingTimeMin": 15,
        "summary": "Following multi-level anterior cervical discectomy and fusion (ACDF), spinal biomechanics change dramatically. This chapter reviews residual cord signal, adjacent segment degeneration (C4-C5 and C7-T1), and monitoring for cord compression.",
        "keyTakeaways": [
            "ACDF eliminates motion at fused levels, redistributing flexion and rotational torque to adjacent mobile discs (C4-C5 and C7-T1).",
            "Pre-existing cord signal changes (myelomalacia) can cause permanent hyperreflexia even after successful surgical decompression.",
            "Key functional markers of myelopathy include subtle hand clumsiness (buttoning shirts) and unsteady gait in the dark."
        ],
        "content": "<h3>1. Post-Fusion Biomechanics</h3><p>Anterior cervical fusion at C5-C7 solidifies the motion segments to protect neural structures from dynamic microtrauma. However, eliminating motion at two intervertebral discs increases mechanical lever-arm forces at adjacent mobile segments—primarily <strong>C4-C5 superiorly</strong> and <strong>C7-T1 inferiorly</strong>.</p><h3>2. Distinguishing Chronic Myelomalacia from New Compression</h3><p>On T2-weighted MRI, focal hyperintensity within the spinal cord often represents chronic gliosis or myelomalacia from pre-operative compression. While surgical decompression halts progressive ischemia, histological cord scarring remains. A repeat MRI comparing cord cross-sectional area and signal intensity against post-operative baselines is the clinical standard to distinguish stable chronic scarring from new adjacent-level impingement.</p>"
    },
    {
        "id": "nerves-ch3",
        "chapterNumber": 3,
        "title": "The Thoracic Cord: The Often-Missed Middle",
        "subtitle": "Navigating narrow canal dimensions, kyphotic loading, and thoracic disc herniation",
        "readingTimeMin": 12,
        "summary": "Because the thoracic spinal canal has the smallest canal-to-cord clearance ratio, subtle thoracic disc bulges can produce profound lower-extremity hyperreflexia while sparing upper-extremity reflexes.",
        "keyTakeaways": [
            "The thoracic cord is highly vulnerable due to limited vascular watershed zones and narrow bony dimensions.",
            "If arm reflexes and Hoffmann signs are completely normal while knee jerks are hyperactive, the thoracic cord is a prime suspect.",
            "Band-like torso or ribcage paresthesia is a hallmark symptom of thoracic radiculopathy."
        ],
        "content": "<h3>1. The Narrow Anatomical Margin</h3><p>The thoracic spine is mechanically stabilized by the rib cage, but its canal-to-cord ratio is the tightest in the spinal axis. Thoracic disc herniations represent under 2% of all spinal disc bulges, yet their clinical impact is disproportionately severe because even minimal posterior protrusion impinges upon descending corticospinal tracts.</p><h3>2. The Clinical Signpost</h3><p>When upper-limb examination demonstrates normal tone, normal biceps/triceps reflexes, and negative Hoffmann signs, but the lower limbs demonstrate 3+ patellar hyperreflexia and tight paraspinal guarding, clinical attention must focus between T1 and T12. Sparing of the arms places the lesion below C8.</p>"
    },
    {
        "id": "nerves-ch4",
        "chapterNumber": 4,
        "title": "Sciatica & Lumbar Root Compression",
        "subtitle": "L4, L5, and S1 dermatomal mapping, mechanical traction, and chemical radiculitis",
        "readingTimeMin": 15,
        "summary": "Sciatica is not a disease but a symptom of mechanical impingement and inflammatory irritation of the lumbar nerve roots forming the sciatic nerve trunk. This chapter details radicular dermatomes and tension testing.",
        "keyTakeaways": [
            "Sciatica involves both mechanical compression and inflammatory chemical irritation from disc nucleus pulposus.",
            "L4 affects the knee-extension reflex; L5 affects great toe dorsiflexion without a primary reflex; S1 abolishes the Achilles reflex.",
            "Straight-leg raise and slump tests create longitudinal mechanical traction along the sciatic nerve sheath."
        ],
        "content": "<h3>1. Mechanical vs Chemical Radiculopathy</h3><p>True sciatica involves radiating sharp, burning pain traveling below the knee into the calf or foot. Research demonstrates that pure mechanical compression creates numbness and motor weakness, whereas severe radicular pain requires the presence of <strong>inflammatory cytokines (TNF-alpha, IL-6)</strong> leaking from the disc core onto the dorsal root ganglion.</p><h3>2. Dermatomal & Reflex Localization</h3><ul><li><strong>L4 Root:</strong> Pain over anterior thigh and shin; diminished patellar tendon reflex.</li><li><strong>L5 Root:</strong> Pain radiating down lateral calf to the dorsal big toe; weakness in ankle dorsiflexion (heel walking); no dedicated reflex arc.</li><li><strong>S1 Root:</strong> Pain down posterior calf to the lateral foot/sole; diminished or absent Achilles tendon reflex.</li></ul>"
    },
    {
        "id": "nerves-ch5",
        "chapterNumber": 5,
        "title": "Tandem Stenosis: When Two Levels Overlap",
        "subtitle": "Managing coexisting cervical cord myelopathy and lumbar root radiculopathy",
        "readingTimeMin": 15,
        "summary": "Tandem stenosis describes simultaneous spinal narrowing in both the cervical and lumbar regions. This chapter outlines the diagnostic challenge when UMN and LMN signs collide.",
        "keyTakeaways": [
            "Tandem stenosis occurs in approximately 10-20% of patients with degenerative spinal disease.",
            "Lumbar root compression can mask cervical hyperreflexia by blunting the lower limb reflex arc.",
            "Surgical prioritization universally favors the cervical spine first to protect cord viability before addressing lumbar mechanics."
        ],
        "content": "<h3>1. The Diagnostic Conundrum</h3><p>When an individual suffers from both cervical canal stenosis and lumbar spinal stenosis, clinical findings can appear contradictory. The cervical stenosis drives upper motor neuron signs (hyperreflexia, spasticity, balance disturbance), while lumbar stenosis drives neurogenic claudication and root suppression. If the lumbar root is severely compressed, the expected hyperreflexia in the Achilles reflex may be completely abolished, leading clinicians to underestimate cervical cord compromise.</p><h3>2. Prioritization Algorithm</h3><p>In patients with symptomatic tandem stenosis, neurosurgical consensus firmly prioritizes <strong>decompression of the cervical spine first</strong>. Cervical myelopathy carries irreversible quadriplegic risks, whereas lumbar radiculopathy rarely threatens life or upper-body autonomy.</p>"
    },
    {
        "id": "nerves-ch6",
        "chapterNumber": 6,
        "title": "Nerve or Blood Vessel? Raynaud's Phenomenon vs Radiculopathy",
        "subtitle": "Differentiating vasospasm, cold-triggered digital pallor, and radicular nerve fire",
        "readingTimeMin": 15,
        "summary": "Cold-triggered white, numb fingertips are characteristic of vascular vasospasm (Raynaud's phenomenon), not cervical nerve root compression. This chapter deconstructs the microvascular mechanics of digital blanching.",
        "keyTakeaways": [
            "Cervical radiculopathy causes dermatomal pain, tingling, and weakness regardless of environmental temperature.",
            "Raynaud's phenomenon produces sharp demarcated digital blanching (pallor) followed by cyanosis and hyperemic rubor triggered by cold or emotional stress.",
            "ADHD stimulant medications and systemic sympathetic surges are known pharmacological aggravators of peripheral digital vasospasm."
        ],
        "content": "<h3>1. The Triple-Phase Color Transition</h3><p>Raynaud's phenomenon is a microvascular syndrome characterized by exaggerated alpha-2 adrenergic vasospasm of digital arteries. When exposed to cold water, ambient air drops, or acute psychological stress, arterioles constrict completely, causing <strong>sharp chalk-white ischemic blanching (pallor)</strong>, followed by blue cyanosis from capillary pooling, and finally throbbing red hyperemia upon rewarming.</p><h3>2. Radiculopathy vs Vasospasm</h3><p>Cervical nerve root compression (e.g. C6 or C7) does not cause well-demarcated digital blanching. Radicular nerve pain is lancinating, follows a linear band down the arm, and is aggravated by cervical rotation or axial loading (Spurling maneuver), not cold drafts. Recognizing this distinction prevents misattributing vascular vasospasm to spinal deterioration.</p>"
    },
    {
        "id": "nerves-ch7",
        "chapterNumber": 7,
        "title": "Peripheral Entrapments: Carpal Tunnel & Thoracic Outlet",
        "subtitle": "Median nerve entrapment, double-crush phenomena, and neurovascular compression",
        "readingTimeMin": 15,
        "summary": "When nerves are compressed at multiple levels along their trajectory, proximal cervical root irritation makes distal nerves hypersensitive to entrapment at the wrist (Carpal Tunnel) or shoulder (Thoracic Outlet).",
        "keyTakeaways": [
            "The 'Double Crush' hypothesis states that a proximal root compression reduces axonal transport, making peripheral branches vulnerable to entrapment.",
            "Carpal Tunnel Syndrome affects median nerve sensation (thumb, index, middle finger) and is provoked by Phalen's wrist flexion.",
            "Thoracic Outlet Syndrome (TOS) compresses the brachial plexus between the scalene muscles and clavicle, provoked by overhead arm positioning."
        ],
        "content": "<h3>1. The Double-Crush Hypothesis</h3><p>Formulated by Upton and McComas, the double-crush hypothesis explains why patients with cervical spine disease frequently develop peripheral neuropathies. A compressed cervical root at C6/C7 impairs the antegrade axoplasmic flow of vital proteins down the nerve fiber. Consequently, the distal median nerve at the wrist becomes hyper-susceptible to minor mechanical pressure inside the carpal tunnel.</p><h3>2. Thoracic Outlet Mechanics</h3><p>Neurogenic Thoracic Outlet Syndrome occurs when the lower trunk of the brachial plexus (C8-T1) is compressed as it traverses the interscalene triangle and costoclavicular space. Unlike pure cervical radiculopathy, TOS symptoms are directly exacerbated by elevating the arms overhead or carrying heavy loads that depress the shoulder girdle.</p>"
    },
    {
        "id": "nerves-ch8",
        "chapterNumber": 8,
        "title": "Diagnostic Tests Explained: MRI, NCS/EMG, Hoffmann Sign & Capillaroscopy",
        "subtitle": "Navigating modern neurological diagnostics, imaging modalities, and clinical tests",
        "readingTimeMin": 15,
        "summary": "Understanding what each diagnostic test can and cannot reveal empowers patients to interpret clinical evaluations objectively without catastrophizing incidental imaging findings.",
        "keyTakeaways": [
            "MRI reveals anatomical structural compression and cord edema, but cannot measure physiological nerve conduction velocity.",
            "Nerve Conduction Studies (NCS) and Electromyography (EMG) evaluate large-fiber functional axonal loss and active denervation.",
            "The Hoffmann sign is a quick bedside screening tool for cervical upper motor neuron irritability.",
            "Nailfold capillaroscopy differentiates benign primary Raynaud's from autoimmune secondary connective tissue diseases."
        ],
        "content": "<h3>1. Anatomical Imaging vs Functional Electrophysiology</h3><p>An MRI provides structural imaging of discs, ligaments, and the spinal cord. However, up to 30% of asymptomatic adults exhibit disc bulges on MRI. <strong>NCS and EMG provide physiological confirmation</strong>: NCS measures the speed and amplitude of electrical conduction along peripheral nerve trunks, while needle EMG detects spontaneous fibrillation potentials indicating active motor axon denervation.</p><h3>2. The Hoffmann Sign Protocol</h3><p>The examiner flickers the patient's middle fingernail downward. A positive Hoffmann response occurs when the terminal phalanx of the thumb and index finger involuntarily flex and adduct. While present in some hyper-reflexic healthy individuals, an asymmetrical or newly developed Hoffmann sign strongly warrants cervical spine evaluation.</p>"
    },
    {
        "id": "nerves-ch9",
        "chapterNumber": 9,
        "title": "Clinical Red Flags & When to Call Your Spine Surgeon",
        "subtitle": "Definitive triage indicators for cauda equina syndrome, acute myelopathy, and motor deficits",
        "readingTimeMin": 12,
        "summary": "While chronic nerve discomfort is manageable through conservative pacing, specific neurological red flags require emergent medical evaluation. This chapter outlines exact emergency thresholds.",
        "keyTakeaways": [
            "Cauda Equina Syndrome is a surgical emergency: look for saddle anesthesia, urinary retention or incontinence, and severe bilateral sciatica.",
            "Rapidly progressing motor drop (foot drop, unable to push up onto toes) requires urgent clinical evaluation within 24-48 hours.",
            "Unexplained clumsiness with buttoning clothes or progressive loss of balance demands formal neurological reassessment."
        ],
        "content": "<h3>1. The Emergency Surgical Red Flags</h3><p>While chronic nerve irritation, sciatica, and cervical tightness fluctuate with activity, acute neural compression syndromes require immediate emergency decompression. The three non-negotiable emergency presentations are:</p><ul><li><strong>Saddle Anesthesia:</strong> Loss of sensation around the perineum, buttocks, inner thighs, and perianal region.</li><li><strong>Bladder / Bowel Dysfunction:</strong> Inability to urinate (urinary retention with overflow incontinence) or sudden loss of anal sphincter control.</li><li><strong>Acute Progressive Motor Paralysis:</strong> Sudden severe foot drop (inability to lift foot while walking) or bilateral leg collapse.</li></ul><h3>2. Routine vs Urgent Communication Thresholds</h3><p>Gradual baseline fluctuations in nerve tingling or pain scores do not indicate structural emergency. Keep a structured symptom log, and present objective trend data to your managing spine specialist during routine reviews.</p>"
    }
]

nutrition_chapters = [
    {
        "id": "nutrition-ch1",
        "chapterNumber": 1,
        "title": "The Neuro-Immunology of Inflammation & Chronic Pain",
        "subtitle": "How circulating pro-inflammatory cytokines sensitize spinal dorsal horn nociceptors",
        "readingTimeMin": 15,
        "summary": "Chronic pain is not merely a mechanical problem; it is driven by systemic biochemical neuro-inflammation. Circulating cytokines cross the blood-spinal cord barrier, lowering nociceptive firing thresholds.",
        "keyTakeaways": [
            "Systemic low-grade inflammation keeps peripheral nociceptors and central spinal neurons in a hyper-sensitized state.",
            "Pro-inflammatory cytokines (IL-1beta, IL-6, TNF-alpha) activate microglial cells within the dorsal horn of the spinal cord.",
            "Dietary interventions directly alter systemic cytokine concentrations within 4 to 8 weeks."
        ],
        "content": "<h3>1. The Biochemical Fire</h3><p>Pain perception is profoundly modulated by the systemic inflammatory environment. When an injury occurs, immune cells release pro-inflammatory signaling proteins, including <strong>Interleukin-1beta (IL-1b), Interleukin-6 (IL-6), and Tumor Necrosis Factor-alpha (TNF-a)</strong>. In healthy physiology, this response resolves within days. In chronic pain states, systemic inflammation remains perpetually elevated, fueling central sensitization.</p><h3>2. Microglial Priming</h3><p>Within the central nervous system, microglial cells act as resident macrophages. Chronic systemic inflammation crosses the compromised blood-spinal cord barrier, 'priming' microglia into a hyper-reactive state. Once primed, even innocuous mechanical movements from daily activities trigger intense pain signals.</p>"
    },
    {
        "id": "nutrition-ch2",
        "chapterNumber": 2,
        "title": "Anti-Inflammatory Nutritional Protocols",
        "subtitle": "Omega-3 to Omega-6 ratios, polyphenol biochemistry, and Mediterranean foundations",
        "readingTimeMin": 15,
        "summary": "Practical dietary interventions that reliably suppress systemic inflammation: optimizing essential fatty acid ratios, harnessing dark polyphenols, and eliminating ultra-processed inflammatory oils.",
        "keyTakeaways": [
            "The standard Western diet skews Omega-6 to Omega-3 ratios toward 20:1; clinical pain reduction targets a 3:1 to 1:1 ratio.",
            "EPA and DHA omega-3 fatty acids synthesize resolvins and protectins that actively terminate inflammatory cascades.",
            "Polyphenols (curcumin, resveratrol, quercetin) inhibit the master inflammatory transcription factor NF-kB."
        ],
        "content": "<h3>1. The Fatty Acid Equilibrium</h3><p>Eicosanoids are local signaling molecules derived from fatty acids. Arachidonic acid (an omega-6 found in seed oils and processed foods) produces pro-inflammatory prostaglandins (PGE2) and leukotrienes. Conversely, <strong>Eicosapentaenoic acid (EPA) and Docosahexaenoic acid (DHA)</strong> produce anti-inflammatory resolvins and protectins that deactivate spinal inflammation.</p><h3>2. The Anti-Inflammatory Core Protocol</h3><ul><li><strong>High-Dose EPA/DHA:</strong> Wild salmon, sardines, mackerel, or high-potency molecularly distilled fish oils.</li><li><strong>Polyphenol Abundance:</strong> Wild blueberries, dark leafy greens, extra virgin olive oil (rich in oleocanthal, a natural COX-inhibitor), and green tea (EGCG).</li><li><strong>Elimination of Industrial Seed Oils:</strong> Completely remove soybean, corn, and sunflower oils that flood cell membranes with arachidonic acid.</li></ul>"
    },
    {
        "id": "nutrition-ch3",
        "chapterNumber": 3,
        "title": "The Gut-Brain-Microbiome Axis: Neurotransmitters & Enteric Health",
        "subtitle": "Intestinal hyperpermeability, endotoxemia, and serotonin synthesis in the gut",
        "readingTimeMin": 15,
        "summary": "Over 90% of the body's serotonin and 50% of dopamine are synthesized in the enteric nervous system. Gut dysbiosis and leaky gut permit lipopolysaccharides to enter circulation, aggravating pain pathways.",
        "keyTakeaways": [
            "The gut microbiome produces key neuroactive compounds including GABA, dopamine, and short-chain fatty acids (SCFAs).",
            "Intestinal hyperpermeability ('leaky gut') allows bacterial endotoxins (LPS) to enter the portal vein, driving systemic neuro-inflammation.",
            "Fermented foods and prebiotic fibers fuel Akkermansia and Faecalibacterium species that reinforce the mucosal barrier."
        ],
        "content": "<h3>1. The Enteric Nervous System</h3><p>The gut contains over 500 million neurons, forming the enteric nervous system, which communicates bidirectionally with the central nervous system via the <strong>vagus nerve</strong>. The intestinal microbiome metabolizes dietary fibers into <strong>Short-Chain Fatty Acids (SCFAs: butyrate, propionate, acetate)</strong>, which cross the blood-brain barrier to promote neuroplasticity and quiet microglial hyperactivity.</p><h3>2. Endotoxemia & The Pain Flare</h3><p>When gut mucosal junctions degrade due to stress, NSAID overuse, or poor nutrition, bacterial lipopolysaccharides (LPS) leak into systemic circulation. This metabolic endotoxemia triggers Toll-Like Receptor 4 (TLR4) on nociceptive neurons, directly provoking systemic muscle aching and widespread pain flares.</p>"
    },
    {
        "id": "nutrition-ch4",
        "chapterNumber": 4,
        "title": "Glycemic Volatility, Insulin Resistance & Peripheral Nerve Irritation",
        "subtitle": "Advanced glycation end-products (AGEs), microvascular perfusion, and neuropathy",
        "readingTimeMin": 15,
        "summary": "Rapid blood sugar spikes and chronic hyperinsulinemia damage delicate microvascular beds (vasa nervorum) that feed peripheral nerves, amplifying neuropathic pain and Raynaud's vasospasm.",
        "keyTakeaways": [
            "Glucose spikes create reactive oxygen species and Advanced Glycation End-products (AGEs) that cross-link nerve myelin.",
            "Insulin resistance impairs nitric oxide release in digital microvessels, exacerbating cold-triggered vasospasms.",
            "Stabilizing glycemic variability through protein-first eating significantly dampens neuropathic burning."
        ],
        "content": "<h3>1. Starving the Vasa Nervorum</h3><p>Peripheral nerves are nourished by microscopic blood vessels known as the <em>vasa nervorum</em>. When blood glucose spikes rapidly after high-glycemic meals, excess glucose binds non-enzymatically to proteins, creating <strong>Advanced Glycation End-products (AGEs)</strong>. These compounds trigger oxidative stress and constrict the microvascular capillaries feeding your spinal nerve roots and digital nerve endings.</p><h3>2. The Glycemic Pacing Rule</h3><p>To preserve microvascular perfusion to nerve roots: prioritize protein and soluble fiber before complex carbohydrates at every meal, eliminate sugary drinks, and engage in 10 minutes of gentle post-prandial walking to pull glucose directly into muscle beds via non-insulin GLUT4 transport.</p>"
    },
    {
        "id": "nutrition-ch5",
        "chapterNumber": 5,
        "title": "Food Sensitivities, Mast Cell Activation & Histamine Burden",
        "subtitle": "Identifying non-allergic inflammatory triggers and downregulating mast cell degranulation",
        "readingTimeMin": 14,
        "summary": "Mast cells reside adjacent to sensory nerve fibers throughout the musculoskeletal system. Excess histamine and dietary allergens cause mast cell degranulation, triggering unexplained full-body flares.",
        "keyTakeaways": [
            "Mast cells lie in close anatomical proximity to nociceptors and release histamine, proteases, and cytokines upon activation.",
            "High-histamine aged foods, alcohol, and certain food preservatives can overwhelm diamine oxidase (DAO) clearance.",
            "Elimination and reintroduction diets remain the gold standard for uncovering individual symptom triggers."
        ],
        "content": "<h3>1. The Mast Cell-Nerve Crosstalk</h3><p>Mast cells are immune sentinels positioned directly alongside peripheral nerve endings. When stimulated, mast cells degranulate, releasing a cocktail of histamine, substance P, and tryptase. These compounds sensitize the TRPV1 receptors on sensory nerves, causing severe itching, tingling, paraspinal aching, and burning sensations without identifiable anatomical trauma.</p><h3>2. Navigating Histamine Load</h3><p>If you experience post-meal palpitations, facial flushing, brain fog, and sudden pain surges, evaluate your intake of high-histamine items: aged cheeses, cured meats, wine, fermented soy, and leftover meals that accumulate bacterial histamine. Fresh, single-origin proteins and anti-histaminic bioflavonoids (quercetin, luteolin) provide relief.</p>"
    },
    {
        "id": "nutrition-ch6",
        "chapterNumber": 6,
        "title": "Hydration, Electrolyte Gradients & Fascial Elasticity",
        "subtitle": "Cellular hydration, extracellular matrix gliding, and muscle spindle cramp prevention",
        "readingTimeMin": 12,
        "summary": "Fascial tissue requires optimal bound water content to slide smoothly. Electrolyte imbalances (sodium, potassium, magnesium) disrupt cellular resting potentials, causing paraspinal spasms.",
        "keyTakeaways": [
            "Fascial layers rely on hyaluronic acid and water hydration for low-friction tissue sliding.",
            "Dehydration turns fascial fluid viscous, binding adjacent muscle layers and increasing mechanical shear stress.",
            "Magnesium glycinate or malate acts as a natural calcium-channel blocker, preventing involuntary muscle guarding."
        ],
        "content": "<h3>1. The Thixotropic Property of Fascia</h3><p>The extracellular matrix surrounding muscles and nerves is rich in hyaluronic acid. In a well-hydrated state, this fluid exhibits <em>thixotropy</em>—it becomes slippery and low-viscosity with gentle movement. When systemically dehydrated, this gel becomes thick and sticky, causing adjacent myofascial layers to adhere to one another and trap cutaneous nerves.</p><h3>2. The Magnesium Muscle Shield</h3><p>Muscle contraction is triggered by intracellular calcium influx; muscle relaxation requires active ATP-driven calcium extrusion, which is strictly magnesium-dependent. Supplementing with bioavailable magnesium (glycinate or malate) helps uncouple stubborn paraspinal guarding and nocturnal cramping.</p>"
    },
    {
        "id": "nutrition-ch7",
        "chapterNumber": 7,
        "title": "Stoic Psychology & Cognitive Pain Reframing",
        "subtitle": "Epictetus, Marcus Aurelius, and the Dichotomy of Control applied to chronic symptoms",
        "readingTimeMin": 15,
        "summary": "Stoic philosophy provides a powerful psychological operating system for living with chronic spinal conditions. Differentiating what is up to us from what is not halts psychological suffering.",
        "keyTakeaways": [
            "Pain is an objective biological sensation; suffering is the subjective cognitive narrative constructed around it.",
            "The Stoic Dichotomy of Control: we cannot control raw nociception; we fully control our response, rehab execution, and mindset.",
            "Amor Fati (loving one's fate) shifts the mindset from victimhood to radical ownership and purposeful resilience."
        ],
        "content": "<h3>1. The Dichotomy of Control</h3><p>The ancient Stoic philosopher Epictetus laid down the cardinal principle of mental sovereignty: <em>\"Some things are within our power, while others are not.\"</em> In chronic rehabilitation, nociceptive nerve impulses, weather pressure shifts, and historical surgical fusions are outside your direct control. Your daily movement consistency, your hydration, your cognitive appraisal, and your response to stiffness are 100% within your power.</p><h3>2. Deconstructing the Pain Story</h3><p>Marcus Aurelius wrote: <em>\"Reject your sense of injury and the injury itself disappears.\"</em> When a flare occurs, our default instinct is to catastrophize: 'My back is ruined, today is wasted.' Stoic reframing pauses this narrative: 'My lumbar spine is transmitting sensory input right now. It is uncomfortable, but it is not damage. I will complete my gentle decompression protocol and focus on my work.'</p>"
    },
    {
        "id": "nutrition-ch8",
        "chapterNumber": 8,
        "title": "Dopamine Circuitry, Chronic Stress & Sleep Architecture",
        "subtitle": "Restoring restorative slow-wave sleep and protecting dopamine receptors from pain fatigue",
        "readingTimeMin": 15,
        "summary": "Chronic pain drains dopamine receptors and fragments slow-wave delta sleep. This chapter details non-pharmacological sleep hygiene and neurochemical restoration protocols.",
        "keyTakeaways": [
            "Deep Slow-Wave Sleep (Stage 3 NREM) is the only phase where growth hormone is released to repair musculoskeletal microtrauma.",
            "Chronic pain and unmanaged anxiety deplete striatal dopamine D2 receptors, creating motivational fatigue and anhedonia.",
            "Morning sunlight exposure, consistent circadian timing, and evening thermal downregulation restore sleep architecture."
        ],
        "content": "<h3>1. Sleep as the Master Neuro-Repair Window</h3><p>During deep Stage 3 NREM sleep, the glymphatic system expands by 60%, flushing metabolic waste from the spinal cord and brain. Furthermore, the pituitary gland pulses human growth hormone (HGH) to repair fascial tears and disc tissues. When chronic pain fragments sleep, tissue regeneration halts and pain thresholds drop precipitously the following morning.</p><h3>2. The Circadian Reset Protocol</h3><ul><li><strong>Morning Photonic Signal:</strong> View direct outdoor sunlight within 30 minutes of waking for 10-15 minutes to anchor cortisol and melatonin cycles.</li><li><strong>Thermal Downregulation:</strong> Core body temperature must drop by 1°C to initiate sleep. Take a warm shower or bath 60 minutes before bed; vasodilation in hands and feet sheds core heat rapidly.</li><li><strong>Dopamine Preservation:</strong> Avoid doom-scrolling and rapid digital dopamine spikes during morning hours; allow natural dopamine tone to recover through purposeful rehabilitation wins.</li></ul>"
    }
]

business_chapters = [
    {
        "id": "business-ch1",
        "chapterNumber": 1,
        "title": "Getting Started: ABN, Business Structure & RAM Access",
        "subtitle": "Establishing legal administrative authority and navigating Relationship Authorisation Manager",
        "readingTimeMin": 15,
        "summary": "Taking over the admin and bookkeeping for a Victorian trade business requires proper digital authorization. This chapter details setting up RAM with myID, understanding Sole Trader vs Company structures, and establishing safe digital access.",
        "keyTakeaways": [
            "The business owner must use myID and the Relationship Authorisation Manager (RAM) to grant you scoped access to Online Services for Business.",
            "Never share passwords or myID credentials directly; statutory identity rules require individual login audit trails.",
            "Sole traders report business income under individual TFNs; companies and trusts require separate tax returns and ASIC compliance."
        ],
        "content": "<h3>1. The Legal Gateway: Relationship Authorisation Manager (RAM)</h3><p>When stepping in to manage administration for a mate's tiling business, the first critical step is establishing proper, secure ATO access. The business owner (the Principal Authority) must log into <strong>RAM (info.authorisationmanager.gov.au)</strong> using their verified myID. From there, they issue a formal digital authorization assigning you as an 'Authorisation Administrator' or 'Standard User' with custom permissions.</p><h3>2. Business Structures in Trade Services</h3><ul><li><strong>Sole Trader:</strong> Simple and low-cost to run. Business profits flow directly to the individual's personal tax return. The owner bears unlimited personal liability.</li><li><strong>Pty Ltd Company:</strong> A separate legal entity. Offers limited liability protection, but requires formal ASIC corporate registers, separate company tax returns (25% base rate), and director duties.</li></ul>"
    },
    {
        "id": "business-ch2",
        "chapterNumber": 2,
        "title": "Bookkeeping Fundamentals: Invoicing, Receipts & 5-Year Records",
        "subtitle": "Chart of accounts, valid tax invoice criteria, and statutory record-keeping compliance",
        "readingTimeMin": 15,
        "summary": "The ATO legally mandates keeping business records for a minimum of 5 years. This chapter outlines the elements of a valid Australian tax invoice and modern digital receipt workflows.",
        "keyTakeaways": [
            "Records must be kept in English (or easily convertable) for at least 5 years from the date the transaction occurred.",
            "Tax invoices for sales over $82.50 (incl. GST) must explicitly state 'Tax Invoice', show the seller's ABN, the date, and the GST amount.",
            "Digital records and photographic receipts stored in compliant accounting software (Xero, MYOB) are fully legally accepted by the ATO."
        ],
        "content": "<h3>1. Statutory 5-Year Record Keeping Rule</h3><p>Under Section 382-5 of Schedule 1 to the <em>Taxation Administration Act 1953</em>, businesses must retain all records that explain transactions, tax invoices, bank statements, wage payments, and subcontractor contracts for <strong>at least 5 years</strong>. If an expense or BAS credit is challenged during an ATO audit without supporting documentation, the input tax credit is denied and penalties apply.</p><h3>2. The Anatomy of a Valid Tax Invoice</h3><p>For purchases over $82.50 (inclusive of GST), you cannot claim a GST credit without a valid tax invoice. The invoice must clearly display: (1) The words 'Tax Invoice', (2) The seller's identity and ABN, (3) Date of issue, (4) Description of goods/services, (5) Total amount payable, and (6) The GST amount (or statement that total includes GST).</p>"
    },
    {
        "id": "business-ch3",
        "chapterNumber": 3,
        "title": "GST In Depth: Taxable Supplies, Input Tax Credits & Simpler BAS",
        "subtitle": "Mandatory $75k registration threshold, cash vs accruals, and Simpler BAS reporting",
        "readingTimeMin": 15,
        "summary": "Once GST turnover reaches or exceeds $75,000, registration is mandatory. This chapter explains calculating GST on sales, claiming input tax credits on supplies, and choosing cash accounting.",
        "keyTakeaways": [
            "GST registration is mandatory within 21 days of turnover reaching or being projected to reach $75,000.",
            "Small businesses with aggregated turnover under $10M can account for GST on a Cash basis (reporting when money actually changes hands).",
            "Simpler BAS streamlines reporting for small businesses, requiring only G1 (Total Sales), 1A (GST on Sales), and 1B (GST on Purchases)."
        ],
        "content": "<h3>1. Mandatory GST Registration</h3><p>In the construction and tiling trades, turnover easily surpasses the $75,000 statutory threshold. As soon as current or projected 12-month turnover hits $75k, the business must register for Goods and Services Tax (GST). Failing to register means the business becomes liable to pay 1/11th of all gross income to the ATO out of pocket, without having collected it from customers.</p><h3>2. Cash vs Accruals Accounting</h3><p>For a trade contractor, <strong>Cash Accounting</strong> is heavily recommended. Under cash accounting, you only remit GST to the ATO after your client has actually paid your invoice. Under accruals accounting, you must pay GST as soon as the invoice is issued, even if the builder takes 60 or 90 days to settle the bill, creating severe cash-flow strain.</p>"
    },
    {
        "id": "business-ch4",
        "chapterNumber": 4,
        "title": "Quarterly BAS Masterclass: Labels G1, 1A, 1B, W1, W2 & Deadlines",
        "subtitle": "Deconstructing the Business Activity Statement with a worked Victorian tiling case study",
        "readingTimeMin": 15,
        "summary": "Master the quarterly BAS cycle. Understand exact lodgement deadlines (28 Oct, 28 Feb, 28 Apr, 28 Jul), key form labels, and calculate net GST liability with complete precision.",
        "keyTakeaways": [
            "Quarterly BAS due dates: Q1 (28 Oct), Q2 (28 Feb), Q3 (28 Apr), Q4 (28 Jul). Registered tax/BAS agents receive extended concessions.",
            "Net GST payable = Label 1A (GST collected on sales) minus Label 1B (GST paid on business purchases).",
            "Always set aside 10% of every customer payment into a dedicated tax savings account immediately upon receipt."
        ],
        "content": "<h3>1. The Quarterly Lodgement Calendar</h3><p>Small trade businesses lodge their BAS quarterly. The standard statutory due dates for self-lodgers are:</p><table style=\"width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.85rem;\"><tr style=\"background: rgba(255,255,255,0.05);\"><th style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">Quarter</th><th style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">Period</th><th style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">Due Date</th></tr><tr><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">Q1</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">1 Jul – 30 Sep</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">28 October</td></tr><tr><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">Q2</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">1 Oct – 31 Dec</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">28 February</td></tr><tr><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">Q3</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">1 Jan – 31 Mar</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">28 April</td></tr><tr><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">Q4</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">1 Apr – 30 Jun</td><td style=\"padding: 8px; border: 1px solid rgba(255,255,255,0.1);\">28 July</td></tr></table><h3>2. Worked Case Study: Tiling Contractor Q1</h3><p>Total sales collected (incl. GST): $44,000 &rarr; <strong>G1 = $44,000</strong>. GST on sales: <strong>1A = $4,000</strong>. Purchases (tiles, adhesives, diamond blades, fuel incl. GST): $13,200 &rarr; GST credit: <strong>1B = $1,200</strong>. Net GST payable = $4,000 - $1,200 = <strong>$2,800</strong>.</p>"
    },
    {
        "id": "business-ch5",
        "chapterNumber": 5,
        "title": "PAYG Instalments & Withholding: Rules for Small Trades",
        "subtitle": "Prepaying annual income tax and managing mandatory withholding obligations",
        "readingTimeMin": 15,
        "summary": "PAYG Instalments prepay business income tax throughout the year to prevent massive end-of-year tax shock. PAYG Withholding applies to employees and contractors failing to quote an ABN.",
        "keyTakeaways": [
            "PAYG Instalments are entered automatically once business tax liability exceeds ATO entry thresholds.",
            "You can choose between an ATO-calculated instalment amount (Option 1) or calculating an instalment rate against quarterly income (Option 2).",
            "If a subcontractor fails to quote a valid ABN on their invoice, you are legally mandated to withhold tax at the top marginal rate (47%)."
        ],
        "content": "<h3>1. PAYG Instalments (Your Tax Prepayment)</h3><p>PAYG Instalments prevent trade owners from being hit with an unmanageable five-figure tax bill at the end of the financial year. Once your annual tax return reflects business income above statutory thresholds, the ATO automatically enters the business into the PAYG instalment system. Every quarter on your BAS, you remit a portion of your expected annual income tax.</p><h3>2. No-ABN Withholding (The 47% Trap)</h3><p>When you hire a subcontractor (e.g. a labourer or specialist screeder), always verify their ABN on the <strong>ABN Lookup (abr.business.gov.au)</strong> before paying them. If a contractor invoices you without a valid ABN, tax law requires you to withhold <strong>47%</strong> from their payment and remit it to the ATO at label W2. Paying in full without an ABN exposes your business to severe penalties.</p>"
    },
    {
        "id": "business-ch6",
        "chapterNumber": 6,
        "title": "Paying Workers: Contractor vs Employee in Construction",
        "subtitle": "High-risk misclassification, the whole-relationship test, and award requirements",
        "readingTimeMin": 15,
        "summary": "Misclassifying an employee as a contractor is illegal under sham contracting laws. Understand the multi-factor common law test: control, delegation, commercial risk, and tools.",
        "keyTakeaways": [
            "Simply having an ABN does not legally make a worker an independent contractor.",
            "If a worker has no right of delegation, works set hours, uses your tools, and bears no commercial risk, they are an employee.",
            "Misclassification triggers severe retrospective liabilities: unpaid superannuation, WorkCover back-premiums, and Fair Work penalties."
        ],
        "content": "<h3>1. The Whole-of-Relationship Test</h3><p>The Australian High Court decisions in <em>CFMEU v Personnel Contracting</em> and <em>ZG Operations v Jamsek</em> affirmed that the written terms of the contract govern the relationship, examined through the lens of common law factors:</p><ul><li><strong>Control:</strong> Does the business dictate how, when, and where the work is performed?</li><li><strong>Delegation:</strong> Can the worker pay someone else to do the work without permission?</li><li><strong>Tools & Equipment:</strong> Does the worker provide major trade plant (tile cutters, mixers, vehicles) or basic hand tools?</li><li><strong>Commercial Risk:</strong> Who pays to rectify defective tiling work? Contractors rectify work at their own expense; employees are paid for their time.</li></ul>"
    },
    {
        "id": "business-ch7",
        "chapterNumber": 7,
        "title": "Super Guarantee (12%) & Payday Super (from July 2026)",
        "subtitle": "Statutory superannuation rates, contractor deeming rules, and the new real-time pay cycle",
        "readingTimeMin": 15,
        "summary": "Super guarantee reaches 12% on 1 July 2025. Furthermore, beginning 1 July 2026, Payday Super mandates paying superannuation concurrently with each pay run instead of quarterly.",
        "keyTakeaways": [
            "The legislated Superannuation Guarantee (SG) rate is 12.0% starting 1 July 2025.",
            "Contractors engaged primarily for their personal labour are deemed employees for superannuation purposes under Section 12(3) of the SGAA.",
            "Payday Super takes effect 1 July 2026: employers must pay super contributions simultaneously with each wage run, received by funds within 7 business days."
        ],
        "content": "<h3>1. The 12% Superannuation Mandate</h3><p>The Superannuation Guarantee rate reached its final legislated step of <strong>12.0% on 1 July 2025</strong>. It applies to all Ordinary Time Earnings (OTE). If superannuation is unpaid by the statutory due date, the Superannuation Guarantee Charge (SGC) applies, which includes interest, administrative fees, and loses all income tax deductibility.</p><h3>2. The Contractor Super Trap (Section 12(3))</h3><p>Many tradespeople assume that if a subcontractor gives them an invoice with an ABN, zero super is payable. Under Section 12(3) of the <em>Superannuation Guarantee (Administration) Act 1992</em>, if a contract is wholly or principally for the labour of the individual, they are deemed an employee for super purposes, even if they hold an ABN!</p>"
    },
    {
        "id": "business-ch8",
        "chapterNumber": 8,
        "title": "Single Touch Payroll (STP) & Year-End Finalisation",
        "subtitle": "STP Phase 2 compliance, reporting pay on or before payday, and 14 July finalisation",
        "readingTimeMin": 14,
        "summary": "Single Touch Payroll (STP) Phase 2 sends salary, tax withholding, and superannuation data directly to the ATO every time wages are disbursed. This chapter covers pay-run filings and year-end procedures.",
        "keyTakeaways": [
            "STP reports must be lodged on or before the pay date using certified payroll software.",
            "STP Phase 2 disaggregates gross wages into base pay, overtime, allowances, bonuses, and paid leave.",
            "Employers must lodge an STP Finalisation Declaration by 14 July each year so employees can complete their tax returns."
        ],
        "content": "<h3>1. Real-Time Pay Reporting</h3><p>Single Touch Payroll Phase 2 connects your accounting software directly to the ATO. Every time you run payroll for an apprentice, labourer, or office helper, salary details, PAYG withholding, and super entitlements are transmitted immediately. Payment summaries (group certificates) no longer exist; employees view their 'income statement' directly in MyGov.</p><h3>2. Annual Finalisation Deadline: 14 July</h3><p>By <strong>14 July</strong> following the end of each financial year (30 June), you must make an STP Finalisation Declaration in your software. This locks the tax year and certifies to the ATO that payroll data is complete, allowing staff to lodge their personal tax returns.</p>"
    },
    {
        "id": "business-ch9",
        "chapterNumber": 9,
        "title": "Building & Construction Specifics: TPAR Annual Reporting by 28 August",
        "subtitle": "Taxable Payments Annual Report compliance for building trade contractors",
        "readingTimeMin": 15,
        "summary": "Businesses in the building and construction industry that pay contractors for trade services must submit an annual Taxable Payments Annual Report (TPAR) to the ATO by 28 August.",
        "keyTakeaways": [
            "Tiling is explicitly classified as a building and construction service under TPAR legislation.",
            "The TPAR report must be lodged by 28 August each year, detailing total payments and GST paid to every subcontractor.",
            "Accurate contractor records (ABN, business name, address, gross payments) must be captured continuously throughout the year."
        ],
        "content": "<h3>1. What is TPAR?</h3><p>The Taxable Payments Reporting System was created by the ATO to combat the shadow economy in building and construction. If your tiling business earns more than 50% of its income from building and construction services, and you pay any subcontractors for trade labour during the financial year, you <strong>must lodge a TPAR by 28 August</strong>.</p><h3>2. Required TPAR Data Fields</h3><p>For every subcontractor engaged during the year from 1 July to 30 June, your TPAR submission must state: (1) Their ABN, (2) Legal business or individual name, (3) Physical address, (4) Total gross amount paid (including GST), (5) Total GST included in that amount, and (6) Any tax withheld where no ABN was quoted.</p>"
    },
    {
        "id": "business-ch10",
        "chapterNumber": 10,
        "title": "Victorian State Obligations: WorkSafe Insurance ($7,500 Remuneration Threshold)",
        "subtitle": "WorkCover policy mandates, rateable remuneration calculations, and apprentice rules",
        "readingTimeMin": 15,
        "summary": "In Victoria, WorkSafe insurance is mandatory if you pay more than $7,500 in rateable remuneration annually, or hire any apprentice. Learn premium calculations and contractor inclusion rules.",
        "keyTakeaways": [
            "WorkSafe Victoria insurance is legally required once annual rateable remuneration exceeds $7,500.",
            "If you employ any apprentice or trainee, you must register regardless of the remuneration amount.",
            "Deemed workers and labour-only contractors count towards rateable remuneration when calculating premiums."
        ],
        "content": "<h3>1. The $7,500 WorkSafe Trigger</h3><p>Under Victorian law, employers must obtain a WorkCover insurance policy through an authorized WorkSafe agent (e.g. Allianz, Gallagher Bassett, EML). The registration threshold is remarkably low: if you pay or expect to pay more than <strong>$7,500 in rateable remuneration</strong> in a financial year, registration is mandatory within 60 days.</p><h3>2. Who Counts as Rateable Remuneration?</h3><p>Rateable remuneration includes gross wages, superannuation contributions, allowances, bonuses, and payments to <em>deemed workers</em>. If you hire a subcontract tiler who works exclusively for you and provides minimal equipment, WorkSafe guidelines often classify their labour component as rateable remuneration for premium calculations.</p>"
    },
    {
        "id": "business-ch11",
        "chapterNumber": 11,
        "title": "Victorian Payroll Tax & Small Business Thresholds ($1M Threshold)",
        "subtitle": "State Revenue Office Victoria payroll tax rules, rates, and grouping provisions",
        "readingTimeMin": 12,
        "summary": "Victorian payroll tax applies only when Australian-wide wages exceed $1,000,000 annually. This chapter covers the regional employer discount and grouping provisions.",
        "keyTakeaways": [
            "The Victorian payroll tax exemption threshold is $1,000,000 annually ($83,333 per month).",
            "Metropolitan employers pay a general rate of 4.85%; regional Victorian employers enjoy a concessional rate of 1.2125%.",
            "Small trade crews rarely exceed the $1M threshold unless grouped with other allied entities."
        ],
        "content": "<h3>1. Thresholds and Rates</h3><p>Payroll tax is a state-based tax levied by the State Revenue Office (SRO) of Victoria. For the 2025-26 and 2026-27 tax years, the annual tax-free threshold is <strong>$1,000,000</strong>. Unless your tiling business is paying over $83,333 in monthly wages, no payroll tax registration or liability exists.</p><h3>2. The Grouping Warning</h3><p>Beware of grouping provisions: if the owner owns multiple related companies (e.g. a tiling firm, a waterproofing company, and a property development entity) with shared control or inter-company labor, their total payrolls are aggregated together toward the $1M threshold.</p>"
    },
    {
        "id": "business-ch12",
        "chapterNumber": 12,
        "title": "Vehicle Logbooks, Tool Depreciation & Instant Asset Write-Offs",
        "subtitle": "Maximizing commercial vehicle deductions, travel logs, and capital allowance rules",
        "readingTimeMin": 15,
        "summary": "Vehicle travel and trade equipment represent massive tax deductions in the construction trade. Master the 12-week logbook method and instant asset write-off thresholds.",
        "keyTakeaways": [
            "A valid 12-week continuous logbook establishes your business use percentage for motor vehicles for up to 5 years.",
            "Utes and vans with a carrying capacity over 1 tonne are exempt from Fringe Benefits Tax (FBT) if private use is strictly minor and infrequent.",
            "Small tools and machinery under the legislated instant write-off threshold are deducted immediately rather than depreciated over years."
        ],
        "content": "<h3>1. The Motor Vehicle Logbook Method</h3><p>Trade work requires hauling wet tiles, adhesive bags, and cutters to job sites. To maximize tax deductions on your commercial ute or van, maintain a compliant logbook for a continuous <strong>12-week period</strong>. Record: date, starting and ending odometer readings, kilometers traveled, and the specific business purpose. This establishes a legally binding business use percentage applied against all fuel, servicing, insurance, and lease costs for up to 5 full years.</p><h3>2. Instant Asset Write-Off</h3><p>Eligible small businesses (turnover under $10M) can immediately deduct the full cost of eligible depreciating assets costing less than the applicable threshold (e.g. high-end wet saws, mixing stations, dust extractors) in the year they are first used or installed ready for use.</p>"
    },
    {
        "id": "business-ch13",
        "chapterNumber": 13,
        "title": "Legal Boundaries: TPB Regulations on Providing BAS Services",
        "subtitle": "When helping a mate crosses into fee-or-reward regulation under the Tax Agent Services Act 2009",
        "readingTimeMin": 15,
        "summary": "Under the Tax Agent Services Act 2009, providing BAS services for a fee or other reward requires registration with the Tax Practitioners Board. Understand what you can legally do as an employee or unpaid helper.",
        "keyTakeaways": [
            "Providing BAS services (preparing/lodging BAS, advising on GST or super) for a fee or reward without TPB registration is illegal.",
            "Genuinely unpaid help or bona fide employees of the business acting for their direct employer are fully exempt.",
            "Non-monetary rewards (e.g. free tiling work in return for bookkeeping) count as 'other reward' under TPB scrutiny."
        ],
        "content": "<h3>1. The Tax Agent Services Act 2009 (TASA)</h3><p>Under Australian law, the Tax Practitioners Board (TPB) regulates who can provide tax and BAS services. Section 50-5 of TASA states that an individual must not provide a BAS service for a <strong>fee or other reward</strong> unless they are a registered BAS agent or registered tax agent. Penalties for unregistered provision of BAS services exceed $50,000 for individuals.</p><h3>2. The Scope of Permitted Unregistered Assistance</h3><ul><li><strong>Direct Employee:</strong> If you are formally employed by the tiling business on payroll, you are acting as an internal employee and are completely exempt.</li><li><strong>Genuinely Unpaid Assistance:</strong> If you are helping a mate completely free of charge with zero compensation, you are permitted to assist. Note: barter arrangements (e.g. 'I'll do your BAS if you tile my bathroom') constitute 'other reward' and are regulated!</li><li><strong>Supervised Data Entry:</strong> Preparing data entry, organizing receipts, and reconciling bank accounts under the direct supervision and sign-off of the business's external registered BAS or tax agent is 100% legal and best practice.</li></ul>"
    }
]

new_encyclopedias_data = {
    "nerves": {
        "id": "nerves",
        "title": "Nerves & Spinal Pathways",
        "tagline": "Spinal cord vs nerve root dynamics, cervical myelopathy, sciatica, and peripheral vasospasm.",
        "badgeClass": "neon-purple",
        "color": "#a855f7",
        "totalChapters": len(nerves_chapters),
        "chapters": nerves_chapters
    },
    "nutrition": {
        "id": "nutrition",
        "title": "Nutrition & Pain Psychology",
        "tagline": "Anti-inflammatory biochemical eating, the gut-brain axis, and stoic pain appraisal.",
        "badgeClass": "neon-blue",
        "color": "#00e5ff",
        "totalChapters": len(nutrition_chapters),
        "chapters": nutrition_chapters
    },
    "business": {
        "id": "business",
        "title": "Victorian Business Finance & Compliance",
        "tagline": "Essential tax, BAS, payroll, and statutory compliance for a Victorian trade business.",
        "badgeClass": "neon-yellow",
        "color": "#eab308",
        "totalChapters": len(business_chapters),
        "chapters": business_chapters
    }
}

# Serialize new encyclopedias into TypeScript syntax
def to_ts_obj(obj, indent=2):
    return json.dumps(obj, indent=indent)

# Insert before closing "};\n"
closing_idx = orig.rfind('};')
if closing_idx != -1:
    addition = ""
    for enc_key, enc_val in new_encyclopedias_data.items():
        addition += f'\n  "{enc_key}": {to_ts_obj(enc_val, indent=4)},\n'
    updated = orig[:closing_idx] + addition + orig[closing_idx:]
    with open('dashboard/lib/encyclopedias.ts', 'w', encoding='utf-8') as f:
        f.write(updated)
    print("Successfully updated dashboard/lib/encyclopedias.ts with Nerves, Nutrition, and Business Finance!")
else:
    print("Error: Could not find closing }; in encyclopedias.ts")
