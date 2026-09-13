import { getPainLogsFromDb, createAgendaItem } from '../db';
import { MEDICAL_GUARDRAIL } from './intent-router';
import { EXERCISE_DATABASE, ExerciseItem } from '../exercise-db';

export type YogaRoutine = ExerciseItem;

export const YOGA_ROUTINE_DB: YogaRoutine[] = EXERCISE_DATABASE;

export async function getSuggestedYogaRoutines(): Promise<YogaRoutine[]> {
  const logs = await getPainLogsFromDb();
  
  const recentLogs = logs.slice(0, 3);
  let painContext = "No recent pain logs found. Assuming baseline health.";
  
  if (recentLogs.length > 0) {
    painContext = recentLogs.map(l => {
      const locs = l.locations.map((loc: any) => `${loc.side && loc.side !== 'unspecified' ? loc.side + ' ' : ''}${loc.area} (${loc.percentage}%)`).join(', ');
      return `- Score: ${l.score}/10, Locations: ${locs}, Notes: ${l.notes || 'none'}`;
    }).join('\n');
  }

  const routineSummary = YOGA_ROUTINE_DB.map(r => ({
    id: r.id,
    title: r.title,
    category: r.category,
    duration_minutes: r.duration_minutes,
    focus_areas: r.focus_areas,
    contraindications: r.contraindications,
    description: r.description
  }));

  const systemPrompt = `You are the Rumble OS Yoga & Rehab Engine.
Your task is to select the 3 safest and most optimal routines (from Yoga, Pilates, Stretches, Rehab, or Hydrotherapy) for the user's morning agenda based on their recent pain logs.

${MEDICAL_GUARDRAIL}

=== RECENT PAIN LOGS ===
${painContext}

=== AVAILABLE ROUTINES ===
${JSON.stringify(routineSummary, null, 2)}

Select exactly 3 routines that avoid exacerbating the reported pain areas (contraindications) and target the areas of stiffness or pain.
Return a JSON array of the 3 selected routine IDs.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
      console.warn("[Yoga Engine] GEMINI_API_KEY not found. Falling back to default routines.");
      return YOGA_ROUTINE_DB.slice(0, 3);
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.7-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: "Select 3 routines based on my pain logs." }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        }
      }),
    });

    if (!res.ok) throw new Error("Gemini API error");
    
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const selectedIds = JSON.parse(text || "[]");
    
    const selectedRoutines = YOGA_ROUTINE_DB.filter(r => selectedIds.includes(r.id)).slice(0, 3);
    
    while(selectedRoutines.length < 3 && selectedRoutines.length < YOGA_ROUTINE_DB.length) {
        const nextRoutine = YOGA_ROUTINE_DB.find(r => !selectedRoutines.includes(r));
        if (nextRoutine) selectedRoutines.push(nextRoutine);
    }
    return selectedRoutines;
  } catch (err) {
    console.error("[Yoga Engine] Failed to synthesize routines:", err);
    return YOGA_ROUTINE_DB.slice(0, 3);
  }
}

export async function runMorningYogaEngine() {
  console.log("[Yoga Engine] Running morning synthesis...");
  const routines = await getSuggestedYogaRoutines();
  await injectRoutinesToAgenda(routines);
}

async function injectRoutinesToAgenda(routines: YogaRoutine[]) {
  // Schedule for today at 9:00 AM Melbourne time
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const scheduledTime = `${year}-${month}-${day}T09:00:00+10:00`;

  for (const r of routines) {
    await createAgendaItem({
      item_type: "task",
      title: `Yoga Option: ${r.title} (${r.duration_minutes}m)`,
      scheduled_time: scheduledTime,
      status: "pending",
    });
  }
  
  console.log(`[Yoga Engine] Successfully injected 3 adaptive yoga options to the agenda for 9:00 AM.`);
}
