import { callGemini } from "./intent-router";
import { createAgendaItem } from "../db";

const INSIGHT_SYSTEM_PROMPT = `You are the Rumble Insight Engine. Your job is to observe the user's activities (chats, protocol completions, pain logs) and deduce meaningful patterns, preferences, or correlations.
If you find a new, useful pattern that should be saved to the user's long-term memory (ChromaDB or SOUL.md), output an insight. If there is nothing new or noteworthy, output null.

Output strictly in JSON matching this schema:
{
  "has_insight": boolean,
  "insight_text": string // A clear, concise sentence proposing the insight, e.g., "I noticed you prefer Hydrotherapy on days with high lumbar pain. Save to memory?"
}
`;

export async function evaluateForInsights(trigger: 'chat' | 'protocol', data: any) {
  try {
    const userMessage = `Evaluate the following ${trigger} event for new insights:
${JSON.stringify(data, null, 2)}`;
    
    const schema = {
      type: "object",
      properties: {
        has_insight: { type: "boolean" },
        insight_text: { type: "string" }
      },
      required: ["has_insight", "insight_text"]
    };

    const responseStr = await callGemini(INSIGHT_SYSTEM_PROMPT, userMessage, schema);
    const result = JSON.parse(responseStr);

    if (result.has_insight && result.insight_text && result.insight_text.trim() !== "") {
      // Create an insight agenda item
      await createAgendaItem({
        item_type: 'insight',
        title: "[Rumble Insight] " + result.insight_text,
        scheduled_time: new Date().toISOString(),
        status: 'pending'
      });
      console.log("[Insight Engine] Generated new insight:", result.insight_text);
    }
  } catch (error) {
    console.error("[Insight Engine] Failed to evaluate insights:", error);
  }
}

export async function generateWeeklyInsights(weeklyInsightId: string) {
  try {
    const { getPainLogsFromDb } = await import("../db");
    const logs = await getPainLogsFromDb();
    
    // Only get logs from the last 7 days
    const now = Date.now();
    const last7DaysLogs = logs.filter((l: any) => now - new Date(l.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);

    if (last7DaysLogs.length === 0) return;

    const userMessage = `Evaluate the following pain logs from the last 7 days and generate 1 overarching weekly insight:
${JSON.stringify(last7DaysLogs, null, 2)}`;
    
    const schema = {
      type: "object",
      properties: {
        has_insight: { type: "boolean" },
        insight_text: { type: "string" }
      },
      required: ["has_insight", "insight_text"]
    };

    const responseStr = await callGemini(INSIGHT_SYSTEM_PROMPT, userMessage, schema);
    const result = JSON.parse(responseStr);

    if (result.has_insight && result.insight_text && result.insight_text.trim() !== "") {
      await createAgendaItem({
        id: weeklyInsightId,
        item_type: 'insight',
        title: "[Weekly Rumble Insight] " + result.insight_text,
        scheduled_time: new Date().toISOString(),
        status: 'pending'
      });
      console.log("[Insight Engine] Generated weekly insight:", result.insight_text);
    } else {
      // Create a dummy item so we don't keep evaluating it
      await createAgendaItem({
        id: weeklyInsightId,
        item_type: 'insight',
        title: "[Weekly Rumble Insight] No major new patterns detected this week.",
        scheduled_time: new Date().toISOString(),
        status: 'pending'
      });
    }
  } catch (error) {
    console.error("[Insight Engine] Failed to evaluate weekly insights:", error);
  }
}
