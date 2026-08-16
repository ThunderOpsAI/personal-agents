import { NextResponse } from "next/server";

const TOPICS = [
  { category: "ARTIFICIAL INTELLIGENCE", title: "Large Language Models", summary: "LLMs are advanced neural networks trained on vast amounts of text data to understand and generate human-like language." },
  { category: "SYSTEMS", title: "Distributed Consensus", summary: "Algorithms like Paxos and Raft allow a cluster of machines to agree on a state even if some nodes fail." },
  { category: "MEDICINE", title: "Neuroplasticity", summary: "The brain's ability to reorganize itself by forming new neural connections throughout life, crucial for rehabilitation." }
];

let currentIndex = 0;

export async function POST() {
  currentIndex = (currentIndex + 1) % TOPICS.length;
  return NextResponse.json({ topic: TOPICS[currentIndex] });
}
