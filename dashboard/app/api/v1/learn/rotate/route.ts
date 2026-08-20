import { NextResponse } from "next/server";
import { TOPICS } from "../../../../../lib/topics";

const globalForTopics = global as unknown as { currentTopicIndex: number; lastUpdateDay: number };

export async function POST() {
  if (globalForTopics.currentTopicIndex === undefined) {
    globalForTopics.currentTopicIndex = 0;
  }
  
  globalForTopics.currentTopicIndex = (globalForTopics.currentTopicIndex + 1) % TOPICS.length;
  globalForTopics.lastUpdateDay = Math.floor(Date.now() / 86400000);
  
  return NextResponse.json({ status: "success", topic: TOPICS[globalForTopics.currentTopicIndex] });
}
