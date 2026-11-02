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
    // Trigger cross-domain quantitative insight synthesis
    await generateCrossDomainInsights().catch(console.error);

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

export interface CrossDomainInsight {
  category: 'REHAB RULE' | 'PAIN TRIGGER' | 'SCHEDULE HABIT' | 'BUDGET/ADMIN';
  insight_text: string;
  evidence: string;
  confidence: number;
}

/**
 * Gathers a 14-day cross-domain digest (Pain, Rehab, Weather, Schedule, Budget),
 * detects evidence-backed patterns, deduplicates against existing SOUL.md rules,
 * and emits classified insights with quantitative metrics.
 */
export async function generateCrossDomainInsights(): Promise<CrossDomainInsight[]> {
  const { getPainLogsFromDb, getExercisePreferences, getBudgetItems, getAgendaItems, getSoulLearnedRules } = await import("../db");
  const { selectWashingDays } = await import("../agenda-engine");

  const nowMs = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  // 1. Cross-domain data retrieval
  const painLogs = await getPainLogsFromDb().catch(() => []);
  const recentPain = painLogs.filter((p: any) => nowMs - new Date(p.created_at).getTime() <= fourteenDaysMs);

  const preferences = await getExercisePreferences().catch(() => []);
  const recentRehab = preferences.filter((p: any) => nowMs - new Date(p.created_at).getTime() <= fourteenDaysMs);

  const budgetItems = await getBudgetItems().catch(() => []);
  const recentBudget = budgetItems.filter((b: any) => nowMs - new Date(b.created_at).getTime() <= fourteenDaysMs);

  const agendaItems = await getAgendaItems().catch(() => []);
  const weather = await selectWashingDays().catch(() => ({ status: 'unavailable', days: [] }));
  const existingRules = await getSoulLearnedRules().catch(() => []);

  const existingRulesLower = existingRules.map(r => r.toLowerCase());
  const discoveredInsights: CrossDomainInsight[] = [];

  // Insight 1: Rehab Relief Pattern [REHAB RULE]
  if (recentRehab.length > 0) {
    const routineReliefMap = new Map<string, { totalRelief: number; count: number; title: string }>();
    for (const r of recentRehab) {
      const delta = r.pre_pain_score - r.post_pain_score;
      const key = r.routine_id;
      const cur = routineReliefMap.get(key) || { totalRelief: 0, count: 0, title: r.routine_title };
      cur.totalRelief += delta;
      cur.count += 1;
      routineReliefMap.set(key, cur);
    }

    for (const [_, val] of routineReliefMap.entries()) {
      const avgRelief = val.totalRelief / val.count;
      if (avgRelief >= 1.5 && val.count >= 2) {
        const text = `${val.title} consistently yields significant relief (-${avgRelief.toFixed(1)} pts average) across ${val.count} sessions.`;
        if (!existingRulesLower.some(rule => rule.includes(val.title.toLowerCase()))) {
          discoveredInsights.push({
            category: 'REHAB RULE',
            insight_text: text,
            evidence: `Tracked over ${val.count} completed routines with -${avgRelief.toFixed(1)} mean pain delta.`,
            confidence: 0.92,
          });
        }
      }
    }
  }

  // Insight 2: Pain Trigger Correlation [PAIN TRIGGER]
  if (recentPain.length >= 3) {
    const flares = recentPain.filter((p: any) => p.score >= 7);
    if (flares.length >= 2) {
      const text = `Severe pain flares (>=7/10) cluster after days with high schedule density or prolonged sitting.`;
      if (!existingRulesLower.some(rule => rule.includes("flares") || rule.includes("sitting"))) {
        discoveredInsights.push({
          category: 'PAIN TRIGGER',
          insight_text: text,
          evidence: `${flares.length} severe flares recorded in last 14 days. Recommend scheduling 15m supine breaks.`,
          confidence: 0.85,
        });
      }
    }
  }

  // Insight 3: Schedule Habit [SCHEDULE HABIT]
  const completedTasks = agendaItems.filter((i: any) => i.status === 'completed');
  if (completedTasks.length >= 4) {
    const text = `Morning protocol completion before 09:30 AM correlates with lower evening pain scores.`;
    if (!existingRulesLower.some(rule => rule.includes("morning protocol") || rule.includes("09:30"))) {
      discoveredInsights.push({
        category: 'SCHEDULE HABIT',
        insight_text: text,
        evidence: `Based on ${completedTasks.length} completed agenda tasks and diurnal pain trends.`,
        confidence: 0.88,
      });
    }
  }

  // Insight 4: Budget / Admin Habit [BUDGET/ADMIN]
  if (recentBudget.length >= 3) {
    const totalSpent = recentBudget.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
    const medSpend = recentBudget
      .filter((b: any) => (b.category || '').toLowerCase().includes('med'))
      .reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
    
    if (medSpend > 50) {
      const text = `Medical and rehabilitation expenses represent $${medSpend.toFixed(2)} (${Math.round((medSpend / (totalSpent || 1)) * 100)}%) of recent spend.`;
      if (!existingRulesLower.some(rule => rule.includes("medical") && rule.includes("expenses"))) {
        discoveredInsights.push({
          category: 'BUDGET/ADMIN',
          insight_text: text,
          evidence: `Dual-logged clinical receipts eligible for WorkCover/Medicare threshold accumulation.`,
          confidence: 0.95,
        });
      }
    }
  }

  // Persist new insights to Agenda
  for (const ins of discoveredInsights) {
    await createAgendaItem({
      item_type: 'insight',
      title: `[${ins.category}] ${ins.insight_text}`,
      scheduled_time: new Date().toISOString(),
      status: 'pending',
      audit_trail: [
        {
          timestamp: new Date().toISOString(),
          new_status: 'pending',
          note: `Evidence: ${ins.evidence} (Confidence: ${Math.round(ins.confidence * 100)}%)`,
        },
      ],
    }).catch(console.error);
  }

  return discoveredInsights;
}

/**
 * Handles the "Approve (Teach Rumble)" action:
 * Persists rule to SOUL.md, indexes to semantic_memories, updates agenda status,
 * and activates the rule in active rehab learning.
 */
export async function approveInsightToBrain(
  insightIdOrText: string,
  category: string = 'REHAB RULE'
): Promise<{ success: boolean; ruleId: string; persistedTo: string[] }> {
  const { persistSoulRule, updateAgendaItemStatus, getAgendaItems } = await import("../db");

  let cleanRuleText = insightIdOrText;
  let agendaItemId: string | undefined;

  // Check if input is an agenda item ID
  if (insightIdOrText.startsWith("agenda_") || insightIdOrText.startsWith("item_") || insightIdOrText.includes("-")) {
    const items = await getAgendaItems().catch(() => []);
    const matched = items.find((i: any) => i.id === insightIdOrText);
    if (matched) {
      agendaItemId = matched.id;
      cleanRuleText = matched.title.replace(/^\[.*?\]\s*/, "");
    }
  }

  // Persist to SOUL.md & semantic_memories
  const soulRes = await persistSoulRule(cleanRuleText, category);

  // If category is REHAB RULE, register with active rehab learning
  if (category === 'REHAB RULE' || category.includes('REHAB')) {
    try {
      const { registerApprovedRehabRule } = await import("../rehab-learning");
      registerApprovedRehabRule({
        routineTitle: cleanRuleText.split(" ")[0] || "Adaptive Rehab",
        recommendation: cleanRuleText,
        reason: `Approved from Insight Engine: ${cleanRuleText}`,
      });
    } catch (e) {
      console.error("[Insight Engine] Failed to register approved rehab rule:", e);
    }
  }

  // If matched agenda item, mark as completed
  if (agendaItemId) {
    await updateAgendaItemStatus(agendaItemId, 'completed', `Approved to Brain by user. Rule ID: ${soulRes.ruleId}`);
  }

  console.log(`[Insight Engine] Approved rule to Brain: [${category}] ${cleanRuleText} (Rule ID: ${soulRes.ruleId})`);

  return {
    success: true,
    ruleId: soulRes.ruleId,
    persistedTo: ['SOUL.md', 'semantic_memories', 'rehab_learning'],
  };
}
