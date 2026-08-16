import { NextResponse } from "next/server";

const TOPICS = [
  { category: "ARTIFICIAL INTELLIGENCE", title: "Large Language Models", summary: "LLMs are advanced neural networks trained on vast amounts of text data to understand and generate human-like language." },
  { category: "SYSTEMS", title: "Distributed Consensus", summary: "Algorithms like Paxos and Raft allow a cluster of machines to agree on a state even if some nodes fail." },
  { category: "MEDICINE", title: "Neuroplasticity", summary: "The brain's ability to reorganize itself by forming new neural connections throughout life, crucial for rehabilitation." }
];

let currentIndex = 0;

export async function GET() {
  return NextResponse.json({ topic: TOPICS[currentIndex] });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (payload && payload.topic) {
    return NextResponse.json({ topic: { category: "CUSTOM", title: payload.topic, summary: "Custom topic requested by user for further exploration." } });
  }
  return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
}
