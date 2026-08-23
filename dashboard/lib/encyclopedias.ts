export interface EncyclopediaChapter {
  id: string;
  chapterNumber: number;
  title: string;
  subtitle: string;
  readingTimeMin: number;
  summary: string;
  keyTakeaways: string[];
  content: string;
}

export interface Encyclopedia {
  id: "pain" | "ai" | "tech" | "cbt";
  title: string;
  tagline: string;
  badgeClass: string;
  color: string;
  totalChapters: number;
  chapters: EncyclopediaChapter[];
}

export const ENCYCLOPEDIAS: Record<string, Encyclopedia> = {
  cbt: {
    id: "cbt",
    title: "Cognitive Behavioral Therapy",
    tagline: "Restructure negative thought patterns and build emotional resilience.",
    badgeClass: "neon-green",
    color: "#4caf50",
    totalChapters: 10,
    chapters: [
      {
        id: "cbt-ch1",
        chapterNumber: 1,
        title: "CBT Principle 1",
        subtitle: "Understanding cognitive behavioral therapy concept 1",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 1 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 1.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 1</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 1 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch2",
        chapterNumber: 2,
        title: "CBT Principle 2",
        subtitle: "Understanding cognitive behavioral therapy concept 2",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 2 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 2.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 2</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 2 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch3",
        chapterNumber: 3,
        title: "CBT Principle 3",
        subtitle: "Understanding cognitive behavioral therapy concept 3",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 3 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 3.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 3</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 3 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch4",
        chapterNumber: 4,
        title: "CBT Principle 4",
        subtitle: "Understanding cognitive behavioral therapy concept 4",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 4 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 4.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 4</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 4 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch5",
        chapterNumber: 5,
        title: "CBT Principle 5",
        subtitle: "Understanding cognitive behavioral therapy concept 5",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 5 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 5.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 5</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 5 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch6",
        chapterNumber: 6,
        title: "CBT Principle 6",
        subtitle: "Understanding cognitive behavioral therapy concept 6",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 6 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 6.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 6</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 6 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch7",
        chapterNumber: 7,
        title: "CBT Principle 7",
        subtitle: "Understanding cognitive behavioral therapy concept 7",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 7 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 7.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 7</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 7 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch8",
        chapterNumber: 8,
        title: "CBT Principle 8",
        subtitle: "Understanding cognitive behavioral therapy concept 8",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 8 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 8.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 8</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 8 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch9",
        chapterNumber: 9,
        title: "CBT Principle 9",
        subtitle: "Understanding cognitive behavioral therapy concept 9",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 9 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 9.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 9</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 9 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      },
      {
        id: "cbt-ch10",
        chapterNumber: 10,
        title: "CBT Principle 10",
        subtitle: "Understanding cognitive behavioral therapy concept 10",
        readingTimeMin: 4,
        summary: "This chapter covers core CBT concept 10 and how it applies to emotional regulation.",
        keyTakeaways: [
          "Identify cognitive distortions related to concept 10.",
          "Apply behavioral activation and reframing techniques.",
          "Build resilience through structured exposure."
        ],
        content: `
<h3>1. Introduction to Concept 10</h3>
<p>Cognitive Behavioral Therapy (CBT) focuses on the relationship between thoughts, feelings, and behaviors. This chapter explores concept 10 in depth.</p>
<h3>2. Application</h3>
<p>Practicing these techniques daily helps rewire automatic negative thoughts (ANTs) and builds emotional regulation.</p>
`
      }
    ]
  },
  pain: {
    id: "pain",
    title: "Pain Science & Neuro-Rehabilitation",
    tagline: "Neuroplasticity, fascial networks, pain gating, and evidence-based rehabilitation protocols.",
    badgeClass: "neon-red",
    color: "#ff3c3c",
    totalChapters: 10,
    chapters: [
      {
        id: "pain-ch1",
        chapterNumber: 1,
        title: "Neuroplasticity & Central Sensitization",
        subtitle: "How the central nervous system rewires its threat response",
        readingTimeMin: 4,
        summary: "Central sensitization occurs when nociceptive neurons in the dorsal horn develop increased excitability. Targeted graded exposure and neuroplastic retraining help restore normal sensitivity thresholds.",
        keyTakeaways: [
          "Pain is an output of the brain's danger evaluation system, not purely tissue damage.",
          "Central sensitization amplifies signals, lowering the activation threshold for innocuous stimuli.",
          "Graded motor imagery and paced movements leverage neuroplasticity to calm hyper-reactive neural circuits."
        ],
        content: `
<h3>1. The Adaptive Brain and Pain Signalling</h3>
<p>Pain is an active construct produced by the central nervous system when threat perception exceeds the body's internal safety threshold. In chronic or post-surgical pain states, the nervous system can become hyper-sensitized—a state known as <strong>Central Sensitization</strong>.</p>

<h3>2. Mechanisms of Sensitization</h3>
<ul>
  <li><strong>Dorsal Horn Hyperexcitability:</strong> Repeated nociceptive bombardment induces long-term potentiation in spinal cord pathways, causing wind-up.</li>
  <li><strong>Loss of Descending Inhibition:</strong> Endogenous opioid and serotonergic inhibitory pathways down-regulate, reducing the brain's ability to filter out non-harmful somatic signals.</li>
  <li><strong>Cortical Smudging:</strong> The somatosensory cortex map for the affected body area becomes blurred, impairing precise bodily localization.</li>
</ul>

<h3>3. Evidence-Based Rehabilitation Strategies</h3>
<p>Recovery requires active neuroplastic remodeling through consistent, non-threatening sensory and motor inputs. Graded motor imagery, gentle hydrotherapy, and structured breathwork systematically down-regulate sympathetic arousal and re-educate cortical representations.</p>
`
      },
      {
        id: "pain-ch2",
        chapterNumber: 2,
        title: "Myofascial Networks & Force Transmission",
        subtitle: "The continuous collagenous matrix and soft tissue release",
        readingTimeMin: 5,
        summary: "Fascia is a continuous, mechanosensitive connective tissue matrix. Postural strain and surgical scars create localized adhesions that transmit abnormal mechanical tension across distant kinematic chains.",
        keyTakeaways: [
          "Fascial tissue contains up to 10x more mechanoreceptors and free nerve endings than muscle.",
          "Adhesions and densification alter viscoelastic properties, creating compensatory strain patterns.",
          "Sustained, low-load myofascial release stimulates hyaluronan lubrication and reduces fascial stiffness."
        ],
        content: `
<h3>1. Fascia as a Continuous Sensory Organ</h3>
<p>Rather than thinking of muscles as isolated levers, biotensegrity demonstrates that forces are distributed through an uninterrupted three-dimensional web of collagen and elastin fibers.</p>

<h3>2. Mechanical Densification and Trigger Points</h3>
<ul>
  <li><strong>Hyaluronan Viscosity:</strong> Inflammation and immobility cause hyaluronic acid to polymerize into a viscous gel, preventing smooth gliding between myofascial planes.</li>
  <li><strong>Myofascial Trigger Points:</strong> Taut bands of muscle fibers create localized ischemia and energy crises, continuously firing nociceptors.</li>
  <li><strong>Remote Strain Propagation:</strong> Restrictions in the lumbar-pelvic fascia frequently cause compensatory overload in thoracic and cervical chains.</li>
</ul>

<h3>3. Intervention Protocols</h3>
<p>Targeted manual therapy, foam rolling with slow shear forces, and warm water hydrotherapy reduce tissue viscosity, allowing restored slide-and-glide mechanics and relief of regional tension.</p>
`
      },
      {
        id: "pain-ch3",
        chapterNumber: 3,
        title: "Hydrotherapy & Buoyancy Mechanics",
        subtitle: "Decompressing spinal joints while rebuilding neuromuscular endurance",
        readingTimeMin: 4,
        summary: "Hydrotherapy leverages hydrostatic pressure and Archimedes' buoyancy principle to decompress weight-bearing joints by up to 90%, enabling pain-free active movement and accelerated lymph drainage.",
        keyTakeaways: [
          "Immersion to chest depth unloads approximately 70-80% of body weight, relieving spinal compression.",
          "Hydrostatic pressure assists venous return and reduces peripheral edema.",
          "Therapeutic pool temperatures (33-35°C) stimulate cutaneous thermoreceptors to gate nociceptive input."
        ],
        content: `
<h3>1. Physical Principles of Aquatic Therapy</h3>
<p>Water immersion provides a unique mechanical environment. Buoyancy counteracts gravity, relieving compressive load on intervertebral discs, facet joints, and lower extremity articulations.</p>

<h3>2. Key Physiological Benefits</h3>
<ul>
  <li><strong>Spinal Unloading:</strong> Submersion to the xiphoid process reduces axial spine load by ~75%, allowing pain-free gait and core activation.</li>
  <li><strong>Hydrostatic Compression:</strong> Water pressure increases linearly with depth, boosting venous return and facilitating lymphatic clearance.</li>
  <li><strong>Thermal Pain Modulation:</strong> Heated pool water activates large-diameter A-beta nerve fibers, engaging the Melzack-Wall Gate Control mechanism.</li>
</ul>

<h3>3. Target Cadence</h3>
<p>A structured routine of 3 hydrotherapy sessions per week optimizes progressive joint mobility without triggering inflammatory flare-ups.</p>
`
      },
      {
        id: "pain-ch4",
        chapterNumber: 4,
        title: "Autonomic Modulation & The Vagus Nerve",
        subtitle: "Regulating the parasympathetic brake to extinguish chronic pain loops",
        readingTimeMin: 5,
        summary: "The autonomic nervous system directly influences pain sensitivity and systemic inflammation. Slow-paced diaphragmatic breathing activates the vagus nerve, reducing pro-inflammatory cytokines and muscle guarding.",
        keyTakeaways: [
          "Sympathetic dominance heightens nociception and promotes muscular hypertonicity.",
          "Prolonged exhalation with diaphragmatic descent engages the cholinergic anti-inflammatory pathway.",
          "Heart Rate Variability (HRV) serves as a direct biomarker of autonomic resilience."
        ],
        content: `
<h3>1. The Autonomic-Pain Axis</h3>
<p>Persistent pain maintains the sympathetic nervous system in a chronic fight-or-flight state. This causes vasoconstriction, elevated cortisol, and involuntary protective muscle guarding.</p>

<h3>2. The Vagal Anti-Inflammatory Pathway</h3>
<ul>
  <li><strong>Cholinergic Anti-Inflammatory Reflex:</strong> Vagal efferent signals stimulate acetylcholine release, suppressing macrophage production of TNF-alpha and IL-6.</li>
  <li><strong>Baroreceptor Stimulation:</strong> Slow breathing at ~6 breaths per minute maximizes respiratory sinus arrhythmia and arterial baroreflex sensitivity.</li>
  <li><strong>Cortical De-arousal:</strong> Vagal afferents terminate in the nucleus tractus solitarius, inhibiting the amygdala and lowering pain vigilance.</li>
</ul>

<h3>3. Evening Down-Regulation Protocol</h3>
<p>Utilizing a 4-7-8 breathing sequence or extended exhale meditation at 09:00 PM and midnight resets autonomic tone, priming restorative slow-wave sleep.</p>
`
      },
      {
        id: "pain-ch5",
        chapterNumber: 5,
        title: "Sleep Architecture & Cytokine Clearance",
        subtitle: "How restorative slow-wave sleep heals neural and connective tissues",
        readingTimeMin: 4,
        summary: "Slow-wave sleep is essential for physical repair, glymphatic brain clearance, and growth hormone secretion. Disrupted sleep increases hyperalgesia and systemic inflammation.",
        keyTakeaways: [
          "Stages 3 & 4 (NREM deep sleep) are when peak human growth hormone and tissue repair occur.",
          "The glymphatic system clears metabolic waste and inflammatory mediators during deep sleep.",
          "Consistent evening wind-down protocols dramatically increase sleep continuity."
        ],
        content: `
<h3>1. The Bidirectional Sleep-Pain Relationship</h3>
<p>Pain impairs sleep quality, and sleep deprivation significantly increases mechanical pain sensitivity. Breaking this cycle requires rigorous sleep architecture optimization.</p>

<h3>2. Cellular Repair During Deep NREM Sleep</h3>
<ul>
  <li><strong>Protein Synthesis & Collagen Cross-Linking:</strong> Deep sleep triggers systemic tissue repair mechanisms.</li>
  <li><strong>Glymphatic Clearance:</strong> Astroglial channels expand during NREM sleep to flush neurotoxic byproducts.</li>
  <li><strong>Cytokine Equilibrium:</strong> Balanced sleep maintains anti-inflammatory cytokine levels, reducing morning stiffness.</li>
</ul>
`
      },
      {
        id: "pain-ch6",
        chapterNumber: 6,
        title: "Pacing & The Graded Activity Envelope",
        subtitle: "Navigating the boom-and-bust cycle through calibrated activity quotas",
        readingTimeMin: 5,
        summary: "The graded activity envelope establishes sustainable movement thresholds, replacing symptom-contingent activity with time-contingent pacing to safely expand functional capacity.",
        keyTakeaways: [
          "Boom-and-bust behavior reinforces nervous system hypersensitivity.",
          "Time-contingent pacing sets quotas based on baseline capacity rather than immediate pain cues.",
          "Gradually expanding the activity envelope builds tissue tolerance without triggering flare-ups."
        ],
        content: `
<h3>1. Breaking the Boom-and-Bust Cycle</h3>
<p>Individuals in recovery often overexert on 'good days' and crash for subsequent days. Pacing establishes a consistent baseline that expands over time.</p>

<h3>2. Implementing Quotas</h3>
<ul>
  <li><strong>Establish Baselines:</strong> Determine the safe duration or volume for any activity (e.g. walking, coding, yoga) that can be sustained on a bad day.</li>
  <li><strong>Time-Contingent Stopping:</strong> Rest before symptom onset rather than pushing until forced to stop.</li>
  <li><strong>Incremental Progression:</strong> Increase quotas by 5-10% weekly once the current baseline is comfortable.</li>
</ul>
`
      }
,
      {
        id: "pain-ch7",
        chapterNumber: 7,
        title: "Advanced Pain Concept 7",
        subtitle: "Deep dive into pain chapter 7",
        readingTimeMin: 5,
        summary: "Advanced exploration of pain methodologies and practical applications.",
        keyTakeaways: [
          "Mastering pain advanced technique 1.",
          "Integrating pain advanced technique 2.",
          "Evaluating outcomes for pain."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of pain, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "pain-ch8",
        chapterNumber: 8,
        title: "Advanced Pain Concept 8",
        subtitle: "Deep dive into pain chapter 8",
        readingTimeMin: 5,
        summary: "Advanced exploration of pain methodologies and practical applications.",
        keyTakeaways: [
          "Mastering pain advanced technique 1.",
          "Integrating pain advanced technique 2.",
          "Evaluating outcomes for pain."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of pain, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "pain-ch9",
        chapterNumber: 9,
        title: "Advanced Pain Concept 9",
        subtitle: "Deep dive into pain chapter 9",
        readingTimeMin: 5,
        summary: "Advanced exploration of pain methodologies and practical applications.",
        keyTakeaways: [
          "Mastering pain advanced technique 1.",
          "Integrating pain advanced technique 2.",
          "Evaluating outcomes for pain."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of pain, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "pain-ch10",
        chapterNumber: 10,
        title: "Advanced Pain Concept 10",
        subtitle: "Deep dive into pain chapter 10",
        readingTimeMin: 5,
        summary: "Advanced exploration of pain methodologies and practical applications.",
        keyTakeaways: [
          "Mastering pain advanced technique 1.",
          "Integrating pain advanced technique 2.",
          "Evaluating outcomes for pain."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of pain, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      }
    ]
  },
  ai: {
    id: "ai",
    title: "Artificial Intelligence & Agentic Architectures",
    tagline: "Transformers, multi-agent orchestration, tool use, RAG, and reasoning foundations.",
    badgeClass: "neon-purple",
    color: "#a855f7",
    totalChapters: 10,
    chapters: [
      {
        id: "ai-ch1",
        chapterNumber: 1,
        title: "Transformer Architecture & Self-Attention",
        subtitle: "How multi-head attention maps high-dimensional contextual embeddings",
        readingTimeMin: 5,
        summary: "The Transformer architecture replaces sequential recurrent processing with parallel multi-head self-attention, allowing models to compute relationships across all tokens simultaneously.",
        keyTakeaways: [
          "Self-attention calculates pairwise query-key compatibility to produce weighted value aggregations.",
          "Multi-head attention enables the model to focus on diverse contextual representations simultaneously.",
          "Positional encodings provide sequence order without recurrent inductive bias."
        ],
        content: `
<h3>1. The Core Innovation: Attention Is All You Need</h3>
<p>Prior to transformers, sequential RNNs and LSTMs suffered from catastrophic forgetting over long horizons and could not be parallelized efficiently during training.</p>

<h3>2. The Scaled Dot-Product Attention Equation</h3>
<p style="font-family: monospace; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px;">
  Attention(Q, K, V) = softmax( (Q * K^T) / sqrt(d_k) ) * V
</p>
<ul>
  <li><strong>Query (Q):</strong> What the current token is looking for.</li>
  <li><strong>Key (K):</strong> What other tokens offer as contextual tags.</li>
  <li><strong>Value (V):</strong> The actual semantic representation extracted once compatibility is matched.</li>
</ul>

<h3>3. Multi-Head Representation</h3>
<p>By projecting queries, keys, and values into multiple subspaces, the model learns distinct relationship patterns (e.g. syntax, coreference, factual associations) in parallel.</p>
`
      },
      {
        id: "ai-ch2",
        chapterNumber: 2,
        title: "Agentic Reasoning & Tool Invocation",
        subtitle: "ReAct loops, function schemas, and structured environment interaction",
        readingTimeMin: 5,
        summary: "Autonomous agents use reasoning loops (Thought-Action-Observation) and JSON-schema tool definitions to ground LLM capabilities in real-world systems, APIs, and databases.",
        keyTakeaways: [
          "ReAct (Reason + Act) intertwines verbal reasoning traces with deterministic tool executions.",
          "Structured tool schemas constrain outputs to strict JSON contracts for reliable API integration.",
          "State management and memory persistence are essential for multi-step goal completion."
        ],
        content: `
<h3>1. Moving from Passive Text to Active Agency</h3>
<p>LLMs generate text, but AI agents act upon digital environments. By equipping models with executable tool schemas, agents can query databases, read emails, and execute code.</p>

<h3>2. The ReAct Architecture</h3>
<ul>
  <li><strong>Thought:</strong> The model generates internal chain-of-thought planning before acting.</li>
  <li><strong>Action:</strong> The agent emits a structured tool call payload.</li>
  <li><strong>Observation:</strong> The execution runtime feeds real results back into the model's context window.</li>
</ul>

<h3>3. Human-in-the-Loop Safety</h3>
<p>Side-effecting actions (e.g., sending emails, deleting records, calendar alterations) require synchronous approval gates (such as <code>needsApproval</code>) to prevent unintended side effects.</p>
`
      },
      {
        id: "ai-ch3",
        chapterNumber: 3,
        title: "Retrieval-Augmented Generation (RAG) & Vector Embeddings",
        subtitle: "Semantic similarity search, dense retrieval, and dynamic context injection",
        readingTimeMin: 5,
        summary: "RAG combines dense vector similarity search with LLM generation, grounding responses in external factual documents and eliminating hallucination without costly fine-tuning.",
        keyTakeaways: [
          "Embedding models convert text chunks into high-dimensional vector representations.",
          "Approximate Nearest Neighbor (ANN) search retrieves top-K relevant chunks in milliseconds.",
          "Hybrid search (combining dense vector search with sparse BM25) yields the highest retrieval accuracy."
        ],
        content: `
<h3>1. Why RAG Outperforms Static Fine-Tuning</h3>
<p>Fine-tuning updates model weights for style or domain jargon, but RAG provides real-time access to dynamic, proprietary, or rapidly changing knowledge bases without retraining.</p>

<h3>2. The RAG Pipeline</h3>
<ul>
  <li><strong>Chunking & Embedding:</strong> Documents are split into semantic chunks and embedded via models into vector space (e.g., ChromaDB).</li>
  <li><strong>Query Vectorization:</strong> User queries are embedded with the same model to identify cosine similarity matches.</li>
  <li><strong>Context Injection:</strong> Retrieved chunks are formatted into the prompt context with strict citation instructions.</li>
</ul>
`
      },
      {
        id: "ai-ch4",
        chapterNumber: 4,
        title: "Multi-Agent Orchestration & Subagent Delegation",
        subtitle: "Hierarchical agent networks, specialized skills, and message passing",
        readingTimeMin: 4,
        summary: "Complex workflows are best solved by specialized subagents coordinated by an orchestrator, isolating context windows and preventing prompt pollution.",
        keyTakeaways: [
          "Specialized subagents operate with narrow system prompts, domain skills, and reduced context bloat.",
          "The orchestrator agent plans, delegates tasks, and synthesizes final outputs.",
          "Strict concurrency rules prevent race conditions when subagents interact with shared state."
        ],
        content: `
<h3>1. The Limits of Monolithic Agents</h3>
<p>A single agent handling code generation, medical reasoning, calendar management, and email scraping suffers from context degradation and conflicting instructions.</p>

<h3>2. Hierarchical Orchestrator Architecture</h3>
<ul>
  <li><strong>Orchestrator:</strong> Receives top-level goals, decomposes tasks into sub-problems, and dispatches to specialists.</li>
  <li><strong>Domain Subagents:</strong> Deeply focused agents (e.g. Yoga Subagent, Meditation Subagent, Research Subagent) execute with dedicated tooling.</li>
  <li><strong>State Handoffs:</strong> Standardized JSON communication channels facilitate clear data passing between agents.</li>
</ul>
`
      },
      {
        id: "ai-ch5",
        chapterNumber: 5,
        title: "RLHF, DPO & Alignment Techniques",
        subtitle: "Guiding neural models toward human helpfulness, honesty, and safety",
        readingTimeMin: 5,
        summary: "Direct Preference Optimization (DPO) and Reinforcement Learning from Human Feedback (RLHF) align raw next-token predictors into coherent, user-attuned assistants.",
        keyTakeaways: [
          "Pre-training teaches world knowledge; post-training alignment teaches behavior, tone, and safety boundaries.",
          "DPO bypasses reward model training by directly optimizing the policy on paired preference data.",
          "Continuous feedback loops enable personalization to individual user needs."
        ],
        content: `
<h3>1. The Alignment Problem</h3>
<p>Base models trained to predict the next internet token often produce unhelpful, verbose, or hallucinatory responses. Alignment trains models to follow instructions and respect boundaries.</p>

<h3>2. Direct Preference Optimization (DPO)</h3>
<p>DPO reformulates the RLHF objective mathematically, allowing closed-form optimization directly from human preference pairs (chosen vs rejected) without unstable reinforcement learning reward loops.</p>
`
      },
      {
        id: "ai-ch6",
        chapterNumber: 6,
        title: "On-Device Inference & Quantization",
        subtitle: "Running high-performance models locally with 4-bit and 8-bit precision",
        readingTimeMin: 4,
        summary: "Post-training quantization (AWQ, GPTQ, GGUF) compresses neural network weights from 16-bit floats to 4-bit integers with minimal perplexity degradation, enabling fast on-device inference.",
        keyTakeaways: [
          "Quantization reduces memory bandwidth bottlenecks, which dominate LLM inference.",
          "Edge deployment ensures zero latency, zero cloud dependency, and total data privacy.",
          "Hybrid cloud-edge systems offload private data locally while routing complex tasks to cloud models."
        ],
        content: `
<h3>1. Memory Bandwidth and Token Generation</h3>
<p>Autoregressive LLM generation is fundamentally memory-bandwidth bound. Transferring weights into GPU/NPU registers for every token is the primary performance bottleneck.</p>

<h3>2. Quantization Breakthroughs</h3>
<ul>
  <li><strong>4-Bit Integer Quantization:</strong> Reduces model VRAM requirements by 70%, allowing 7B-14B models to run comfortably on standard laptops and mobile devices.</li>
  <li><strong>Activation-Aware Weight Quantization (AWQ):</strong> Preserves the top 1% salient weights in high precision to maintain reasoning accuracy.</li>
</ul>
`
      }
,
      {
        id: "ai-ch7",
        chapterNumber: 7,
        title: "Advanced Ai Concept 7",
        subtitle: "Deep dive into ai chapter 7",
        readingTimeMin: 5,
        summary: "Advanced exploration of ai methodologies and practical applications.",
        keyTakeaways: [
          "Mastering ai advanced technique 1.",
          "Integrating ai advanced technique 2.",
          "Evaluating outcomes for ai."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of ai, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "ai-ch8",
        chapterNumber: 8,
        title: "Advanced Ai Concept 8",
        subtitle: "Deep dive into ai chapter 8",
        readingTimeMin: 5,
        summary: "Advanced exploration of ai methodologies and practical applications.",
        keyTakeaways: [
          "Mastering ai advanced technique 1.",
          "Integrating ai advanced technique 2.",
          "Evaluating outcomes for ai."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of ai, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "ai-ch9",
        chapterNumber: 9,
        title: "Advanced Ai Concept 9",
        subtitle: "Deep dive into ai chapter 9",
        readingTimeMin: 5,
        summary: "Advanced exploration of ai methodologies and practical applications.",
        keyTakeaways: [
          "Mastering ai advanced technique 1.",
          "Integrating ai advanced technique 2.",
          "Evaluating outcomes for ai."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of ai, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "ai-ch10",
        chapterNumber: 10,
        title: "Advanced Ai Concept 10",
        subtitle: "Deep dive into ai chapter 10",
        readingTimeMin: 5,
        summary: "Advanced exploration of ai methodologies and practical applications.",
        keyTakeaways: [
          "Mastering ai advanced technique 1.",
          "Integrating ai advanced technique 2.",
          "Evaluating outcomes for ai."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of ai, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      }
    ]
  },
  tech: {
    id: "tech",
    title: "Modern Technology & Software Architecture",
    tagline: "Serverless edge runtimes, event streams, distributed databases, and high-performance web systems.",
    badgeClass: "neon-blue",
    color: "#00e5ff",
    totalChapters: 10,
    chapters: [
      {
        id: "tech-ch1",
        chapterNumber: 1,
        title: "Serverless & Edge Computing Paradigms",
        subtitle: "Global distribution, V8 isolates, and sub-millisecond cold starts",
        readingTimeMin: 4,
        summary: "Edge runtimes deploy lightweight JavaScript isolates across globally distributed CDN nodes, delivering ultra-low latency compute near users without cold-start overhead.",
        keyTakeaways: [
          "V8 isolates instantiate in microseconds with negligible memory overhead compared to Node.js containers.",
          "Serverless edge architectures scale automatically from zero to millions of concurrent invocations.",
          "State is offloaded to globally replicated serverless databases (e.g. Neon PostgreSQL, Upstash Redis)."
        ],
        content: `
<h3>1. From Monoliths to Edge Isolate Functions</h3>
<p>Traditional cloud architectures run monolithic apps on persistent virtual machines. Serverless edge computing shifts execution directly to CDN points of presence around the world.</p>

<h3>2. Key Architectural Advantages</h3>
<ul>
  <li><strong>Zero Cold Starts:</strong> Lightweight V8 isolates spin up in less than 5ms.</li>
  <li><strong>Global Proximity:</strong> Execution occurs within milliseconds of the end user, dramatically reducing network round trips.</li>
  <li><strong>Cost Efficiency:</strong> Billed strictly per millisecond of active CPU compute time.</li>
</ul>
`
      },
      {
        id: "tech-ch2",
        chapterNumber: 2,
        title: "Database Architectures: Relational vs Vector vs KV",
        subtitle: "Choosing the optimal persistence model for modern full-stack systems",
        readingTimeMin: 5,
        summary: "Modern high-performance applications leverage polyglot persistence: ACID-compliant relational databases for operational data, vector databases for embeddings, and KV stores for caching.",
        keyTakeaways: [
          "PostgreSQL provides strong consistency, transactional integrity, and JSON document flexibility.",
          "Vector databases (HNSW index) accelerate high-dimensional nearest-neighbor queries.",
          "Distributed KV caches protect databases from read-heavy traffic spikes."
        ],
        content: `
<h3>1. Polyglot Persistence Principles</h3>
<p>No single database technology is optimal for every workload. Scalable systems pair relational backbones with specialized indexing layers.</p>

<h3>2. Database Archetypes</h3>
<ul>
  <li><strong>Serverless PostgreSQL (Neon):</strong> Separates compute from storage, allowing instant branching, auto-scaling, and point-in-time recovery.</li>
  <li><strong>Vector Stores (ChromaDB / pgvector):</strong> Enables semantic search and memory persistence for AI agent interactions.</li>
  <li><strong>Embedded / Local Fallbacks (SQLite):</strong> Provides resilient offline development and caching capabilities.</li>
</ul>
`
      },
      {
        id: "tech-ch3",
        chapterNumber: 3,
        title: "Event-Driven Streams & Real-Time Sync",
        subtitle: "WebSocket duplexing, Server-Sent Events (SSE), and reactive state loops",
        readingTimeMin: 4,
        summary: "Real-time dashboards utilize unidirectional SSE and bidirectional WebSockets to stream AI tokens, live telemetry, and instant status changes without polling.",
        keyTakeaways: [
          "SSE is ideal for unidirectional text and token streaming (e.g. LLM chat completions).",
          "WebSockets provide full-duplex communication for multi-agent messaging and live collaborative state.",
          "Optimistic UI updates ensure zero perceived latency for user actions."
        ],
        content: `
<h3>1. Eliminating Inefficient Polling</h3>
<p>Periodic HTTP polling wastes bandwidth and increases server load. Modern architectures push updates reactively as state changes occur.</p>

<h3>2. Streaming Protocols Compared</h3>
<ul>
  <li><strong>Server-Sent Events (SSE):</strong> Simple HTTP-based text streaming with automatic reconnection, perfect for generative AI streaming.</li>
  <li><strong>WebSockets:</strong> Persistent TCP socket connection for bidirectional real-time event distribution.</li>
</ul>
`
      },
      {
        id: "tech-ch4",
        chapterNumber: 4,
        title: "OAuth 2.1 & Zero-Trust API Security",
        subtitle: "Token lifecycle management, PKCE flows, and scoped delegation",
        readingTimeMin: 5,
        summary: "Modern API security enforces zero-trust principles with short-lived access tokens, refresh rotation, and Proof Key for Code Exchange (PKCE) for third-party integrations.",
        keyTakeaways: [
          "OAuth 2.1 deprecates legacy implicit grant flows in favor of authorization code with PKCE.",
          "Refresh tokens must be rotated on every exchange to detect and prevent token reuse.",
          "Least-privilege scoping prevents third-party integrations from accessing unauthorized user resources."
        ],
        content: `
<h3>1. Zero-Trust Architecture</h3>
<p>Never trust, always verify. Every internal and external request must validate cryptographic signatures and granular permission scopes.</p>

<h3>2. Secure Workspace Integrations (Google Calendar / Gmail)</h3>
<ul>
  <li><strong>Read-Only Scopes:</strong> Requesting minimal required scopes (e.g. calendar.readonly) protects user data from unintended modification.</li>
  <li><strong>Safe Approval Barriers:</strong> Any side-effecting write or delete requires user approval before execution.</li>
</ul>
`
      },
      {
        id: "tech-ch5",
        chapterNumber: 5,
        title: "WebAssembly (WASM) & Browser Sandboxing",
        subtitle: "Near-native execution performance within web clients",
        readingTimeMin: 4,
        summary: "WebAssembly delivers binary bytecode execution inside browser sandboxes at near-native speed, enabling complex audio, video, OCR, and AI workloads on the client.",
        keyTakeaways: [
          "WASM executes compact binary format with predictable, close-to-metal performance.",
          "Enables C++, Rust, and Go codebases to run directly inside modern web browsers.",
          "Memory isolation guarantees security within the standard browser sandbox."
        ],
        content: `
<h3>1. Beyond JavaScript's Performance Ceiling</h3>
<p>While JavaScript V8 JIT compilers are fast, compute-heavy tasks like image OCR, vector math, and real-time audio analysis benefit from WASM's direct memory layout and deterministic performance.</p>

<h3>2. Client-Side AI & Document Processing</h3>
<p>Compiling OCR engines (e.g. Tesseract) or local embedding models to WebAssembly allows private, offline document processing on the user's device without sending sensitive documents to external clouds.</p>
`
      },
      {
        id: "tech-ch6",
        chapterNumber: 6,
        title: "Core Web Vitals & Frontend Performance Engineering",
        subtitle: "Optimizing LCP, INP, and CLS for instant, tactile dashboard responsiveness",
        readingTimeMin: 4,
        summary: "Core Web Vitals measure real-world user experience. Mastering Largest Contentful Paint (LCP) and Interaction to Next Paint (INP) creates ultra-responsive web dashboards.",
        keyTakeaways: [
          "Largest Contentful Paint (LCP) targets render times under 2.5s for main viewport content.",
          "Interaction to Next Paint (INP) ensures all clicks and taps respond with visual feedback in under 200ms.",
          "Cumulative Layout Shift (CLS) eliminates unexpected layout jumps during async content hydration."
        ],
        content: `
<h3>1. User-Centric Performance Metrics</h3>
<p>Modern web engineering focuses on perceived performance and tactile responsiveness rather than arbitrary window load times.</p>

<h3>2. Essential Optimization Techniques</h3>
<ul>
  <li><strong>CSS Containment & Content Visibility:</strong> Offscreen DOM nodes skip layout calculations until scrolled into view.</li>
  <li><strong>Font Display Swap & Preloading:</strong> Eliminates invisible text flash during initial font download.</li>
  <li><strong>Skeleton Loaders & Reserved Aspect Ratios:</strong> Prevents CLS by reserving layout space before async data loads.</li>
</ul>
`
      }
,
      {
        id: "tech-ch7",
        chapterNumber: 7,
        title: "Advanced Tech Concept 7",
        subtitle: "Deep dive into tech chapter 7",
        readingTimeMin: 5,
        summary: "Advanced exploration of tech methodologies and practical applications.",
        keyTakeaways: [
          "Mastering tech advanced technique 1.",
          "Integrating tech advanced technique 2.",
          "Evaluating outcomes for tech."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of tech, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "tech-ch8",
        chapterNumber: 8,
        title: "Advanced Tech Concept 8",
        subtitle: "Deep dive into tech chapter 8",
        readingTimeMin: 5,
        summary: "Advanced exploration of tech methodologies and practical applications.",
        keyTakeaways: [
          "Mastering tech advanced technique 1.",
          "Integrating tech advanced technique 2.",
          "Evaluating outcomes for tech."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of tech, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "tech-ch9",
        chapterNumber: 9,
        title: "Advanced Tech Concept 9",
        subtitle: "Deep dive into tech chapter 9",
        readingTimeMin: 5,
        summary: "Advanced exploration of tech methodologies and practical applications.",
        keyTakeaways: [
          "Mastering tech advanced technique 1.",
          "Integrating tech advanced technique 2.",
          "Evaluating outcomes for tech."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of tech, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      },
      {
        id: "tech-ch10",
        chapterNumber: 10,
        title: "Advanced Tech Concept 10",
        subtitle: "Deep dive into tech chapter 10",
        readingTimeMin: 5,
        summary: "Advanced exploration of tech methodologies and practical applications.",
        keyTakeaways: [
          "Mastering tech advanced technique 1.",
          "Integrating tech advanced technique 2.",
          "Evaluating outcomes for tech."
        ],
        content: `
<h3>1. Advanced Applications</h3>
<p>Continuing the exploration of tech, this chapter introduces advanced paradigms and implementation strategies.</p>
`
      }
    ]
  }
};
