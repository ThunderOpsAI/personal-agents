import { NextResponse } from "next/server";

export const TOPICS = [
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

// Use global to maintain state across hot reloads in development
const globalForTopics = global as unknown as { currentTopicIndex: number; lastUpdateDay: number };
const todayDay = Math.floor(Date.now() / 86400000);

if (globalForTopics.currentTopicIndex === undefined || globalForTopics.lastUpdateDay !== todayDay) {
  globalForTopics.currentTopicIndex = todayDay % TOPICS.length;
  globalForTopics.lastUpdateDay = todayDay;
}

export async function GET() {
  return NextResponse.json({ topic: TOPICS[globalForTopics.currentTopicIndex] });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (payload && payload.topic) {
    return NextResponse.json({ 
      topic: { 
        category: "CUSTOM", 
        title: payload.topic, 
        summary: "Custom topic requested by user for further exploration.",
        details: "<ul><li><strong>Personalized Focus:</strong> Dive deep into areas that matter most to you.</li><li><strong>Targeted Learning:</strong> Content specifically curated based on your input.</li><li><strong>Actionable Insights:</strong> Extract meaningful takeaways to apply immediately.</li></ul>",
        data_points: [
          { label: "Topic Type", value: "User Generated" },
          { label: "Priority", value: "High" },
          { label: "Status", value: "Processing" }
        ]
      } 
    });
  }
  return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
}
