import { NextResponse } from "next/server";
import { TOPICS } from "../../../../../lib/topics";

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
