export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  readingTimeMin: number;
  summary: string;
  content: string;
  keyTakeaways: string[];
}

export interface Encyclopedia {
  id: string;
  title: string;
  tagline: string;
  badgeClass: string;
  color: string;
  totalChapters: number;
  archived?: boolean;
  chapters: Chapter[];
}

export const ENCYCLOPEDIAS: Record<string, Encyclopedia> = {
  pain: {
    id: "pain",
    title: "Pain Science & Sensitization",
    tagline: "Neurobiology of persistent pain and central sensitization",
    badgeClass: "neon-red",
    color: "#ff003c",
    totalChapters: 20,
    archived: false,
    chapters: [
      {
        id: "pain_ch1",
        chapterNumber: 1,
        title: "Central Sensitization & Neurotag Remodeling",
        subtitle: "How prolonged pain alters spinal cord dorsal horn excitability",
        readingTimeMin: 4,
        summary: "Central sensitization represents an amplification of neural signaling within the central nervous system that elicits pain hypersensitivity. Secondary hyperalgesia and allodynia develop when dorsal horn nociceptive neurons lower their activation threshold.",
        content: `
          <p><strong>Central sensitization</strong> is defined by the International Association for the Study of Pain (IASP) as increased responsiveness of nociceptive neurons in the central nervous system to their normal or subthreshold afferent input.</p>
          <p>In chronic back, neck, or neuropathic pain syndromes, the nervous system acts like a faulty volume dial turned up to maximum. Even innocuous mechanical pressures (such as prolonged sitting or slight movements) are encoded as threatening alerts by wide dynamic range (WDR) neurons.</p>
          <h4>Mechanisms at Play:</h4>
          <ul>
            <li><strong>Wind-Up Phenomenon:</strong> Repetitive C-fiber nociceptive discharges cause progressive summation of dorsal horn action potentials.</li>
            <li><strong>Glial Cell Activation:</strong> Microglia and astrocytes release pro-inflammatory cytokines (IL-1β, TNF-α) that sustain synaptic hypersensitivity.</li>
            <li><strong>Loss of Descending Inhibition:</strong> Periaqueductal gray (PAG) and rostral ventromedial medulla (RVM) pathways lose serotonergic and noradrenergic tone.</li>
          </ul>
        `,
        keyTakeaways: [
          "Pain does not equal structural damage; it is a neurological protective alarm.",
          "Gentle graded exposure and diaphragmatic downregulation systematically calm dorsal horn excitability.",
          "Consistency in daily gentle mobility remodels cortical neurotags safely."
        ]
      },
      {
        id: "pain_ch2",
        chapterNumber: 2,
        title: "Graded Motor Imagery & Mirror Therapy",
        subtitle: "Retraining the cortical homunculus without provoking nociception",
        readingTimeMin: 5,
        summary: "When moving the spine or limbs triggers pain guarding, visual and cognitive imagery protocols reactivate motor cortex representations safely.",
        content: `
          <p>Chronic pain leads to smudging of the sensory-motor cortex maps. Graded Motor Imagery (GMI) is a 3-stage protocol (Implicit motor imagery, Explicit motor imagery, and Mirror therapy) designed to restore cortical clarity.</p>
        `,
        keyTakeaways: [
          "Left/right judgment tasks engage premotor areas without activating pain receptors.",
          "Mental rehearsal of smooth spinal articulation promotes neural reorganization.",
          "Pacing prevents the vicious cycle of overexertion and multi-day crash."
        ]
      }
    ]
  },
  cbt: {
    id: "cbt",
    title: "Cognitive Behavioral Therapy for Pain",
    tagline: "Reframing threat appraisal, pacing, and autonomic regulation",
    badgeClass: "neon-green",
    color: "#00ff66",
    totalChapters: 20,
    archived: false,
    chapters: [
      {
        id: "cbt_ch1",
        chapterNumber: 1,
        title: "Cognitive Restructuring & Pain Catastrophizing",
        subtitle: "Deconstructing worst-case appraisals and hypervigilance",
        readingTimeMin: 4,
        summary: "Pain catastrophizing involves magnification of pain threat, rumination, and perceived helplessness. Cognitive restructuring dismantles cognitive distortions that escalate cortisol and sympathetic tone.",
        content: `
          <p>When chronic pain flares occur, automatic thoughts such as 'my back is broken forever' activate the amygdala and trigger muscle guarding. By identifying these automatic thoughts and substituting evidence-based neutral appraisals ('this is a temporary sensitized flare, not tissue destruction'), systemic autonomic arousal decreases.</p>
        `,
        keyTakeaways: [
          "Notice automatic catastrophic thoughts without emotional judgment.",
          "Replace catastrophic statements with realistic, safe factual anchors.",
          "Use paced diaphragmatic breathing during flare spikes to dampen the sympathetic alarm."
        ]
      }
    ]
  },
  nerves: {
    id: "nerves",
    title: "Neuro-Anatomy & Peripheral Nerve Flossing",
    tagline: "Upper vs lower motor neuron pathways and nerve glides",
    badgeClass: "neon-purple",
    color: "#b500ff",
    totalChapters: 9,
    archived: false,
    chapters: [
      {
        id: "nerves_ch1",
        chapterNumber: 1,
        title: "Upper vs Lower Motor Neuron Pathophysiology",
        subtitle: "Distinguishing spasticity, hyperreflexia, and nerve root compression",
        readingTimeMin: 5,
        summary: "Understanding cervical cord compression (myelopathy) vs lumbar radiculopathy (sciatica) and clinical indicators such as hyperreflexia and Hoffmann's sign.",
        content: `
          <p>Upper motor neuron (UMN) lesions originate in the brain or spinal cord (e.g., cervical canal stenosis), presenting with spasticity, hyperreflexia, and clonus. Lower motor neuron (LMN) lesions occur along peripheral nerve roots (e.g. L5-S1 disc herniation), presenting with flaccidity, hyporeflexia, and dermatomal numbness.</p>
        `,
        keyTakeaways: [
          "Hyperreflexia in lower limbs during cervical consult indicates central cord pressure requiring MRI.",
          "Nerve sliders facilitate axonal axoplasmic fluid flow without creating mechanical tension.",
          "Never stretch an irritated nerve into numbness, tingling, or electrical shock sensations."
        ]
      }
    ]
  },
  nutrition: {
    id: "nutrition",
    title: "Neuro-Immunology & Anti-Inflammatory Nutrition",
    tagline: "Nutritional modulation of microglial activation and systemic inflammation",
    badgeClass: "neon-blue",
    color: "#00f0ff",
    totalChapters: 8,
    archived: false,
    chapters: [
      {
        id: "nutrition_ch1",
        chapterNumber: 1,
        title: "Microglial Inhibition & Gut-Brain Axis",
        subtitle: "Dietary polyphenols, omega-3 fatty acids, and inflammatory cytokines",
        readingTimeMin: 4,
        summary: "Systemic low-grade endotoxemia and high omega-6 to omega-3 ratios prime spinal microglia into an M1 pro-inflammatory state. Nutritional anti-inflammatory strategies suppress neuroinflammation.",
        content: `
          <p>Curcumin, EPA/DHA, and high dietary fiber nourish the intestinal mucosal barrier, decreasing circulating lipopolysaccharides (LPS). This lowers microglial Toll-like receptor (TLR4) activation in the central nervous system.</p>
        `,
        keyTakeaways: [
          "Target EPA/DHA intake to shift prostaglandin synthesis away from PGE2.",
          "Adequate hydration and magnesium glycinate support neuromuscular relaxation.",
          "Avoid sharp glycemic spikes that trigger transient pain flare-ups."
        ]
      }
    ]
  },
  business: {
    id: "business",
    title: "Victorian Trade Compliance & Financial Operations",
    tagline: "VBA regulations, BAS reporting, and contract administration",
    badgeClass: "neon-yellow",
    color: "#eab308",
    totalChapters: 13,
    archived: false,
    chapters: [
      {
        id: "business_ch1",
        chapterNumber: 1,
        title: "Victorian Building Authority Compliance & BAS Timelines",
        subtitle: "Managing insurance, statutory warranties, and tax compliance",
        readingTimeMin: 5,
        summary: "Essential compliance guidelines under the Victorian Domestic Building Contracts Act 1995, building practitioner licensing, and quarterly BAS reporting schedules.",
        content: `
          <p>Operating a trade or contracting enterprise in Victoria requires strict adherence to statutory warranties under the DBC Act. Contracts exceeding $10,000 require statutory written form, and works over $16,000 necessitate Domestic Building Insurance (DBI).</p>
        `,
        keyTakeaways: [
          "Maintain weekly budget logs and BAS reserves for quarterly tax commitments.",
          "Document progress claims and variations in written, verifiable records.",
          "Separate business operating accounts from personal recovery expenditures."
        ]
      }
    ]
  },
  ai: {
    id: "ai",
    title: "AI & Distributed Systems (Archived)",
    tagline: "Large language models and edge orchestration",
    badgeClass: "neon-purple",
    color: "#a855f7",
    totalChapters: 6,
    archived: true,
    chapters: []
  },
  tech: {
    id: "tech",
    title: "Engineering Architecture (Archived)",
    tagline: "Cloud computing and microservices",
    badgeClass: "neon-blue",
    color: "#3b82f6",
    totalChapters: 6,
    archived: true,
    chapters: []
  }
};

export const ROTATING_LEARNING_TOPICS = [
  {
    category: "MEDICINE",
    title: "Neuroplasticity",
    summary: "The brain's ability to reorganize itself by forming new neural connections throughout life, crucial for rehabilitation.",
    details: "<ul><li><strong>Adaptive Rewiring:</strong> The brain can form new pathways around damaged areas.</li><li><strong>Experience-Dependent:</strong> Repetitive tasks and novel experiences drive neuroplastic changes.</li><li><strong>Critical Periods:</strong> While plastic throughout life, certain windows offer accelerated adaptation.</li><li><strong>Rehabilitation Focus:</strong> Targeted exercises leverage plasticity to restore lost motor or cognitive functions.</li></ul>",
    data_points: [
      { label: "Key Mechanism", value: "Synaptic Pruning" },
      { label: "Primary Benefit", value: "Functional Recovery" },
      { label: "Influencing Factor", value: "Repetition" }
    ],
    external_link: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3222570/"
  },
  {
    category: "THERAPY",
    title: "Myofascial Release",
    summary: "A specialized physical and manual therapy used for the effective treatment and rehabilitation of soft tissue and fascial tension.",
    details: "<ul><li><strong>Fascial Network:</strong> Targets the continuous web of connective tissue surrounding muscles and organs.</li><li><strong>Tension Reduction:</strong> Applies sustained pressure to eliminate pain and restore motion.</li><li><strong>Trauma Response:</strong> Addresses restrictions caused by trauma, inflammatory responses, or surgical procedures.</li><li><strong>Holistic Impact:</strong> Improves overall structural alignment and physiological function.</li></ul>",
    data_points: [
      { label: "Target Tissue", value: "Fascia" },
      { label: "Technique", value: "Sustained Pressure" },
      { label: "Primary Goal", value: "Pain Relief" }
    ],
    external_link: "https://www.physio-pedia.com/Myofascial_Release"
  },
  {
    category: "PHYSIOLOGY",
    title: "Breathing Mechanics",
    summary: "The physiological processes of inhalation and exhalation, focusing on the optimal use of the diaphragm and secondary respiratory muscles.",
    details: "<ul><li><strong>Diaphragmatic Control:</strong> Engaging the primary respiratory muscle for efficient gas exchange.</li><li><strong>Autonomic Regulation:</strong> Conscious breath control can modulate the sympathetic nervous system.</li><li><strong>Postural Influence:</strong> Proper mechanics rely on and support optimal spinal alignment.</li><li><strong>Stress Reduction:</strong> Slow, deep breathing techniques trigger the relaxation response.</li></ul>",
    data_points: [
      { label: "Primary Muscle", value: "Diaphragm" },
      { label: "Nervous System", value: "Autonomic Control" },
      { label: "Key Benefit", value: "Stress Reduction" }
    ],
    external_link: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5455070/"
  }
];
