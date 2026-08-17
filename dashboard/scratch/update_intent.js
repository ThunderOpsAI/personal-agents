import fs from 'fs';
import path from 'path';

const file = '/Users/thunderopsai/Documents/Workspace/01_Projects/personal-agents/dashboard/lib/agents/intent-router.ts';
let code = fs.readFileSync(file, 'utf8');

// Update callGemini
code = code.replace(
  'async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {',
  'async function callGemini(systemPrompt: string, userMessage: string, responseSchema?: any): Promise<string> {'
);
code = code.replace(
  'contents: [{ role: "user", parts: [{ text: userMessage }] }],',
  'contents: [{ role: "user", parts: [{ text: userMessage }] }],\n        ...(responseSchema ? { generationConfig: { responseMimeType: "application/json", responseSchema } } : {})'
);

// Replace routeChatMessage entirely
const routeChatMessageRegex = /export async function routeChatMessage\(message: string\): Promise<IntentRouteResult> \{[\s\S]*?\n\}\n/m;

const newRouteChatMessage = `export async function routeChatMessage(message: string): Promise<IntentRouteResult> {
  const nowMel = new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
  
  let liveAgendaText = "No active agenda items.";
  try {
    const items = await getAgendaItems();
    const pending = items.filter(i => i.status === "pending");
    if (pending.length > 0) {
      liveAgendaText = pending
        .map(i => \`• \${i.title} (\${i.item_type}) at \${new Date(i.scheduled_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" })}\`)
        .join("\\n");
    }
  } catch {}

  let liveNotesText = "No recent notes.";
  try {
    const notes = (await getNotes()).slice(0, 5);
    if (notes.length > 0) {
      liveNotesText = notes.map(n => \`• [\${new Date(n.created_at).toLocaleDateString("en-AU")}] \${n.content}\`).join("\\n");
    }
  } catch {}

  let livePainText = "No recent pain logs recorded.";
  try {
    const painLogs = await getPainLogsFromDb();
    if (painLogs.length > 0) {
      const pl = painLogs[0];
      const locs = pl.locations.map((l: any) => \`\${l.side && l.side !== "unspecified" ? l.side + " " : ""}\${l.area} (\${l.percentage}%)\`).join(", ");
      livePainText = \`Latest score: \${pl.score}/10 in \${locs} (Mood: \${pl.mood || "N/A"}, Notes: \${pl.notes || "None"})\`;
    }
  } catch {}

  let calendarText = "No live Google Calendar events scheduled for the next 30 days.";
  try {
    const calRes = await fetchLiveCalendarEvents();
    if (calRes.status === "auth_required") {
      calendarText = "Google Calendar is NOT connected (OAuth authorization required at /api/v1/auth/google).";
    } else if (calRes.status === "success" && calRes.events && calRes.events.length > 0) {
      calendarText = calRes.events
        .map((e: any) => \`• \${e.summary || "Event"} (\${new Date(e.start?.dateTime || e.start?.date || e.start).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })})\`)
        .join("\\n");
    }
  } catch {}

  let emailText = "No unread urgent emails.";
  try {
    const emailRes = await fetchLiveGmailMessages({ maxResults: 5 });
    if (emailRes.status === "auth_required") {
      emailText = "Gmail is NOT connected (OAuth authorization required at /api/v1/auth/google).";
    } else if (emailRes.status === "success" && emailRes.messages && emailRes.messages.length > 0) {
      emailText = emailRes.messages
        .map((m: any) => \`• From: \${m.from || "Unknown"} | Subject: "\${m.subject || "No Subject"}" | Summary: \${m.snippet || ""}\`)
        .join("\\n");
    }
  } catch {}

  let weatherText = "Weather forecast currently unavailable.";
  try {
    const washRes = await selectWashingDays();
    if (washRes.status === "success") {
      weatherText = washRes.days.map((d: any) => \`• \${d.date}: \${d.precipitationProbability}% rain risk, max \${d.tempMax}°C\`).join("\\n");
    }
  } catch {}

  const systemPrompt = \`You are Rumble, the expert personal operations and rehabilitation AI assistant for Rumble OS.
Current Time in Australia/Melbourne: \${nowMel}.
Location: Wangaratta, Victoria, Australia.

=== LIVE USER DATA (SOURCE OF TRUTH) ===
[ACTIVE AGENDA ITEMS]
\${liveAgendaText}
[RECENT USER NOTES]
\${liveNotesText}
[LATEST HEALTH & PAIN LOG]
\${livePainText}
[LIVE GOOGLE CALENDAR]
\${calendarText}
[LIVE GMAIL INBOX]
\${emailText}
[WANGARATTA WEATHER & WASHING FORECAST]
\${weatherText}

=== CRITICAL BEHAVIORAL & SAFETY RULES ===
1. MEDICAL DISCLAIMER: "\${MEDICAL_GUARDRAIL}". Always include this on any medical/recovery discussion.
2. LIVE DATA ONLY: You MUST strictly use the real live events, emails, notes, and agenda items provided above. NEVER invent, hallucinate, mock, or guess doctor names, appointments, clinic locations, or emails.
3. Determine if the user's message is a conversational query (requiring only a reply) OR if it requires actions (e.g. adding a calendar event, adding a task, logging pain).
4. If actions are required, return them in the actions array. Writes MUST require confirmation.\`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      reply: { type: "STRING", description: "The conversational response to the user." },
      actions: {
        type: "ARRAY",
        description: "A list of actions to perform (e.g., writes). Leave empty if just answering a question.",
        items: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", description: "One of: 'task', 'pain_log', 'note', 'calendar_event'" },
            data: {
              type: "OBJECT",
              description: "The payload for the action. For calendar_event: { summary: string, start: { dateTime: string }, end: { dateTime: string } }. For task: { title: string, scheduled_time: string }. For pain_log: { score: number, locations: [{area: string, percentage: number}], mood?: string, notes?: string }."
            }
          }
        }
      }
    },
    required: ["reply", "actions"]
  };

  try {
    const replyStr = await callGemini(systemPrompt, message, responseSchema);
    const parsed = JSON.parse(replyStr);
    
    let finalReply = parsed.reply;
    if (finalReply.includes("pain") || finalReply.includes("doctor")) {
        finalReply = finalReply.includes(MEDICAL_GUARDRAIL) ? finalReply : \`\${finalReply}\\n\\n\${MEDICAL_GUARDRAIL}\`;
    }

    if (parsed.actions && parsed.actions.length > 0) {
      // If multiple actions, wrap them in multi_action so frontend can confirm all at once
      const preview = {
        type: "multi_action",
        data: { actions: parsed.actions }
      };
      
      const actionTypes = parsed.actions.map((a: any) => a.type).join(", ");
      
      return {
        reply: \`\${finalReply}\\n\\n⚠️ Confirmation required: Click Confirm to execute these actions: [\${actionTypes}].\`,
        intent: "GENERAL",
        requires_confirmation: true,
        preview,
        disclaimer: MEDICAL_GUARDRAIL,
      };
    }

    return {
      reply: finalReply,
      intent: "GENERAL",
      requires_confirmation: false,
      disclaimer: MEDICAL_GUARDRAIL,
    };
  } catch (err: any) {
    return {
      reply: \`Rumble: I am here to assist with your recovery and daily operations.\\n\\n\${MEDICAL_GUARDRAIL}\`,
      intent: "CONVERSATION",
      disclaimer: MEDICAL_GUARDRAIL,
    };
  }
}
`;

code = code.replace(routeChatMessageRegex, newRouteChatMessage);
fs.writeFileSync(file, code, 'utf8');
console.log('Done!');
