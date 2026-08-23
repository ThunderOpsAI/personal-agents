import fs from 'fs';
import path from 'path';
import { getAgendaItems, createAgendaItem, createNote, createPainLog, getNotes, getPainLogsFromDb } from '../db';
import { logPain, PainLocationWeight, validatePainLog } from '../rehab-learning';
import { selectWashingDays, WashingDay } from '../agenda-engine';
import { fetchLiveGmailMessages, fetchLiveCalendarEvents } from '../google-auth';

export const MEDICAL_GUARDRAIL =
  "Medical output is decision support, not diagnosis. Preserve clinician restrictions; recommend clinician review for worsening or concerning symptoms.";

export function exportPainReportToMarkdown(entry: {
  score: number;
  locations: Array<{ area: string; side?: string; percentage?: number; weight?: number }>;
  mood?: string;
  notes?: string;
  timestamp?: string;
}): void {
  try {
    const reportsDir = path.resolve(process.cwd(), '..', 'agent_reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const reportPath = path.join(reportsDir, 'medical_symptom_report.md');
    const nowMel = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' });
    const primaryLoc = entry.locations[0] || { area: 'unspecified', percentage: 100 };
    const locSummary = entry.locations
      .map(l => `${l.side && l.side !== 'unspecified' ? l.side + ' ' : ''}${l.area} (${l.percentage ?? l.weight ?? 0}%)`)
      .join(', ');
    const newRow = `| ${nowMel.split(',')[0]} | ${nowMel.split(',')[1]?.trim() || 'manual_log'} | **${entry.score}/10** | ${primaryLoc.side && primaryLoc.side !== 'unspecified' ? primaryLoc.side + ' ' : ''}${primaryLoc.area} | ${primaryLoc.percentage ?? primaryLoc.weight ?? 100}% | ${locSummary} | Notes: ${entry.notes || 'None'}. Mood: ${entry.mood || 'Not specified'}. |\n`;

    if (!fs.existsSync(reportPath)) {
      const header = `# Clinical Symptom & Anatomical Pain Tracking Report\n> **Generated Date**: ${nowMel}\n> **Patient ID**: Self-Tracked Rumble OS Log\n\n## Scheduled 3-Hour Pain Tracking Logs (9 AM, 12 PM, 3 PM, 9 PM)\n\n| Date | Time Slot | Overall Pain (1-10) | Primary Generator | Generator Weight | Active Anatomical Symptoms | Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
      fs.writeFileSync(reportPath, header + newRow, 'utf8');
    } else {
      fs.appendFileSync(reportPath, newRow, 'utf8');
    }
  } catch (err) {
    // Non-blocking in serverless environments if filesystem is read-only
    console.warn('[Report Export Warning] Could not write to agent_reports:', err);
  }
}


export type IntentType =
  | "GREETING"
  | "LOG_PAIN"
  | "PAIN_DISCUSSION"
  | "ADD_NOTE"
  | "ADD_TASK"
  | "CHECK_EMAIL"
  | "AGENDA_QUERY"
  | "WEATHER_QUERY"
  | "MEDICAL_TRIAGE"
  | "CONVERSATION"
  | "GENERAL";

export interface ParsedPainLog {
  score: number;
  locations: Array<{
    area: string;
    side?: "left" | "right" | "unspecified";
    percentage: number;
  }>;
  mood?: string;
  notes?: string;
}

export interface ActionPreview {
  type: "pain_log" | "note" | "task" | "multi_action" | "calendar_event";
  data: Record<string, any>;
}

export interface IntentRouteResult {
  reply: string;
  intent: IntentType;
  requires_confirmation?: boolean;
  preview?: ActionPreview;
  disclaimer?: string;
  data?: Record<string, any>;
}

const BODY_AREAS = [
  "lumbar",
  "cervical",
  "knee",
  "shoulder",
  "neck",
  "lower back",
  "back",
  "thoracic",
  "ankle",
  "elbow",
  "hip",
  "wrist",
  "spine",
];

const PAIN_WORDS = ["pain", "hurts", "ache", "sore", "stiffness", "spasm"];

export function classifyIntent(message: string): IntentType {
  const lowered = message.toLowerCase().trim();

  // 1. Explicit Greet
  if (/^(?:hello|hi|hey|good morning|good afternoon|good evening|g'day)(?:\s+rumble)?[\s!\.]*$/i.test(lowered)) {
    return "GREETING";
  }

  // 2. Explicit Pain Logging Directive (Write)
  if (/\b(?:log|record|track)\b/i.test(lowered) && (PAIN_WORDS.some(w => lowered.includes(w)) || BODY_AREAS.some(a => lowered.includes(a)))) {
    return "LOG_PAIN";
  }

  // 3. Notes Directive (Write)
  if (/\b(?:add\s+(?:this\s+)?to\s+notes?|add\s+note|take\s+a?\s*note|note:)\b/i.test(lowered)) {
    return "ADD_NOTE";
  }

  // 4. Task / Reminder / Agenda Add Directive (Write)
  if (/\b(?:add\s+(?:a\s+)?(?:task|reminder|to-do|todo)|create\s+(?:a\s+)?task|remind\s+me|add\s+to\s+agenda)\b/i.test(lowered)) {
    return "ADD_TASK";
  }

  // 5. Emails Query (Read)
  if (/\b(?:check\s+(?:my\s+)?(?:emails?|inbox|gmail)|any\s+(?:new\s+)?emails?|urgent\s+emails?)\b/i.test(lowered)) {
    return "CHECK_EMAIL";
  }

  // 6. Agenda / Schedule Query (Read)
  if (/\b(?:what(?:'s|\s+is)\s+on\s+(?:my\s+)?(?:agenda|schedule)|show\s+(?:my\s+)?(?:agenda|schedule)|check\s+(?:my\s+)?agenda|my\s+schedule)\b/i.test(lowered)) {
    return "AGENDA_QUERY";
  }

  // 7. Weather / Washing Query (Read)
  if (/\b(?:weather|rain|temperature|forecast|washing\s+days?|wangaratta)\b/i.test(lowered)) {
    return "WEATHER_QUERY";
  }

  // 8. Medical Triage & Questions
  if (/\b(?:what\s+should\s+i\s+do|doctor|specialist|who\s+should\s+i\s+see|diagnosis|treatment)\b/i.test(lowered)) {
    return "MEDICAL_TRIAGE";
  }

  // 9. Conversational Symptom / Pain discussion (Read / Decision support only)
  if (PAIN_WORDS.some(w => lowered.includes(w)) || BODY_AREAS.some(a => lowered.includes(a))) {
    return "PAIN_DISCUSSION";
  }

  return "GENERAL";
}

/**
 * Parses structured directives like:
 * "Log pain score 6/10 in lumbar (80%) and neck (20%), mood 7, notes felt stiff after sitting."
 * "Log pain 6/10 in lumbar 100%, mood 8"
 */
export function parsePainLogDirective(message: string): {
  parsed?: ParsedPainLog;
  errors: string[];
} {
  const errors: string[] = [];
  const lowered = message.toLowerCase();

  // Score extraction (e.g. 6/10, score 6, pain 6)
  let score: number | undefined;
  const scoreMatch = lowered.match(/\b(\d{1,2})\s*(?:\/\s*10|out\s*of\s*10)\b/) ||
                     lowered.match(/\b(?:score|level|pain)\s*[:=]?\s*(\d{1,2})\b/);
  if (scoreMatch) {
    const s = parseInt(scoreMatch[1], 10);
    if (s >= 1 && s <= 10) {
      score = s;
    } else {
      errors.push(`Pain score ${s} is invalid. It must be between 1 and 10.`);
    }
  } else {
    // Attempt fallback match for single digit 1-10 in text
    const digitMatch = lowered.match(/\b([1-9]|10)\b/);
    if (digitMatch) {
      score = parseInt(digitMatch[1], 10);
    } else {
      errors.push("A valid pain score between 1 and 10 is required.");
    }
  }

  // Extract locations with explicit or implicit percentages
  const locations: Array<{ area: string; side?: "left" | "right" | "unspecified"; percentage: number }> = [];

  // Match pattern: area + optional percentage e.g. "lumbar (80%)" or "lumbar 80%" or "lumbar"
  for (const area of BODY_AREAS) {
    if (lowered.includes(area)) {
      let side: "left" | "right" | "unspecified" = "unspecified";
      if (new RegExp(`left\\s+${area}|${area}\\s+left`, "i").test(lowered)) side = "left";
      if (new RegExp(`right\\s+${area}|${area}\\s+right`, "i").test(lowered)) side = "right";

      // Look for percentage near the area name: e.g. lumbar (80%), lumbar 80%, 80% lumbar
      const pctRegex = new RegExp(`(?:${area}[^\\d]{0,10}(\\d{1,3})%|(\\d{1,3})%[^\\w]{0,10}${area})`, "i");
      const pctMatch = lowered.match(pctRegex);
      let percentage = 0;
      if (pctMatch) {
        percentage = parseInt(pctMatch[1] || pctMatch[2], 10);
      }
      locations.push({ area, side, percentage });
    }
  }

  // If multiple locations found and percentages are not specified, distribute or check
  if (locations.length === 1 && locations[0].percentage === 0) {
    locations[0].percentage = 100;
  }

  if (locations.length === 0) {
    errors.push("At least one anatomical body location must be specified (e.g. lumbar, neck, shoulder).");
  } else {
    const totalPercentage = locations.reduce((sum, loc) => sum + loc.percentage, 0);
    if (totalPercentage !== 100) {
      errors.push(`Location percentage weights must sum to exactly 100%. (Current sum: ${totalPercentage}%)`);
    }
  }

  // Extract mood if present
  let mood: string | undefined;
  const moodMatch = lowered.match(/\bmood\s*[:=]?\s*([a-z0-9_\-]+)/i);
  if (moodMatch) {
    mood = moodMatch[1].trim();
  }

  // Extract notes if present
  let notes: string | undefined;
  const notesMatch = message.match(/\bnotes?\s*[:=]?\s*(.+)$/i);
  if (notesMatch) {
    notes = notesMatch[1].trim();
  }

  if (errors.length > 0 || !score) {
    return { errors };
  }

  return {
    parsed: {
      score,
      locations,
      mood,
      notes,
    },
    errors: [],
  };
}

/**
 * Parses note addition directive e.g. "Add this to notes: buy ergonomic lumbar roll"
 */
export function parseNoteDirective(message: string): string | null {
  const cleaned = message
    .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:add\s+(?:this\s+)?to\s+notes?|add\s+note|take\s+a?\s*note|note)\s*[:=]?\s*/i, "")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Parses task creation directive e.g. "Add task: Call Dr. Anderson" or "Remind me to do hydrotherapy tomorrow"
 */
export function parseTaskDirective(message: string): { title: string; scheduled_time?: string } | null {
  let title = message
    .replace(/^(?:can\s+you\s+)?(?:please\s+)?(?:add\s+(?:a\s+)?(?:task|reminder|to-do|todo)|create\s+(?:a\s+)?task|remind\s+me\s+to|add\s+to\s+agenda)\s*[:=]?\s*/i, "")
    .trim();

  if (!title) return null;

  // Capitalize first letter
  if (title.length > 1) {
    title = title[0].toUpperCase() + title.slice(1);
  }

  // Default to today + 1 day at 09:00 AM Melbourne
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const scheduled_time = `${year}-${month}-${day}T09:00:00+10:00`;

  return { title, scheduled_time };
}

/**
 * Call Gemini model with live grounding data.
 */
async function callGemini(systemPrompt: string, userMessage: string, responseSchema?: any, history: any[] = []): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `Rumble: I received your message: "${userMessage}". Let me know if you would like to log pain, create a note, or check your agenda.`;
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.7-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        ...history.map((h: any) => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.content }] })),
        { role: "user", parts: [{ text: userMessage }] }
      ],
        ...(responseSchema ? { generationConfig: { responseMimeType: "application/json", responseSchema } } : {})
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API returned status ${res.status}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini API returned empty response");
  }

  return text.trim();
}

/**
 * Routes and handles incoming chat messages dynamically.
 */
export async function routeChatMessage(message: string, history: any[] = []): Promise<IntentRouteResult> {
  const nowMel = new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
  
  let liveAgendaText = "No active agenda items.";
  try {
    const items = await getAgendaItems();
    const pending = items.filter(i => i.status === "pending");
    if (pending.length > 0) {
      liveAgendaText = pending
        .map(i => `• ${i.title} (${i.item_type}) at ${new Date(i.scheduled_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" })}`)
        .join("\n");
    }
  } catch {}

  let liveNotesText = "No recent notes.";
  try {
    const notes = (await getNotes()).slice(0, 5);
    if (notes.length > 0) {
      liveNotesText = notes.map(n => `• [${new Date(n.created_at).toLocaleDateString("en-AU")}] ${n.content}`).join("\n");
    }
  } catch {}

  let livePainText = "No recent pain logs recorded.";
  try {
    const painLogs = await getPainLogsFromDb();
    if (painLogs.length > 0) {
      const pl = painLogs[0];
      const locs = pl.locations.map((l: any) => `${l.side && l.side !== "unspecified" ? l.side + " " : ""}${l.area} (${l.percentage}%)`).join(", ");
      livePainText = `Latest score: ${pl.score}/10 in ${locs} (Mood: ${pl.mood || "N/A"}, Notes: ${pl.notes || "None"})`;
    }
  } catch {}

  let calendarText = "No live Google Calendar events scheduled for the next 30 days.";
  try {
    const calRes = await fetchLiveCalendarEvents();
    if (calRes.status === "auth_required") {
      calendarText = "Google Calendar is NOT connected (OAuth authorization required at /api/v1/auth/google).";
    } else if (calRes.status === "success" && calRes.events && calRes.events.length > 0) {
      calendarText = calRes.events
        .map((e: any) => `• ${e.summary || "Event"} (${new Date(e.start?.dateTime || e.start?.date || e.start).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })})`)
        .join("\n");
    }
  } catch {}

  let emailText = "No unread urgent emails.";
  try {
    const emailRes = await fetchLiveGmailMessages({ maxResults: 5 });
    if (emailRes.status === "auth_required") {
      emailText = "Gmail is NOT connected (OAuth authorization required at /api/v1/auth/google).";
    } else if (emailRes.status === "success" && emailRes.messages && emailRes.messages.length > 0) {
      emailText = emailRes.messages
        .map((m: any) => `• From: ${m.from || "Unknown"} | Subject: "${m.subject || "No Subject"}" | Summary: ${m.snippet || ""}`)
        .join("\n");
    }
  } catch {}

  let weatherText = "Weather forecast currently unavailable.";
  try {
    const washRes = await selectWashingDays();
    if (washRes.status === "success") {
      weatherText = washRes.days.map((d: any) => `• ${d.date}: ${d.precipitationProbability}% rain risk, max ${d.tempMax}°C`).join("\n");
    }
  } catch {}

  const systemPrompt = `You are Rumble, the expert personal operations and rehabilitation AI assistant for Rumble OS.
Current Time in Australia/Melbourne: ${nowMel}.
Location: Wangaratta, Victoria, Australia.

=== LIVE USER DATA (SOURCE OF TRUTH) ===
[ACTIVE AGENDA ITEMS]
${liveAgendaText}
[RECENT USER NOTES]
${liveNotesText}
[LATEST HEALTH & PAIN LOG]
${livePainText}
[LIVE GOOGLE CALENDAR]
${calendarText}
[LIVE GMAIL INBOX]
${emailText}
[WANGARATTA WEATHER & WASHING FORECAST]
${weatherText}

=== CRITICAL BEHAVIORAL & SAFETY RULES ===
1. MEDICAL DISCLAIMER: "${MEDICAL_GUARDRAIL}". Always include this on any medical/recovery discussion.
2. LIVE DATA ONLY: You MUST strictly use the real live events, emails, notes, and agenda items provided above. NEVER invent, hallucinate, mock, or guess doctor names, appointments, clinic locations, or emails.
3. Determine if the user's message is a conversational query (requiring only a reply) OR if it requires actions (e.g. adding a calendar event, adding a task, logging pain).
4. If actions are required, return them in the actions array. Writes MUST require confirmation.`;

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
            type: { type: "STRING", description: "One of: 'task', 'pain_log', 'note', 'calendar_event', 'budget_item'" },
            task_title: { type: "STRING" },
            task_scheduled_time: { type: "STRING" },
            calendar_summary: { type: "STRING" },
            calendar_start_datetime: { type: "STRING" },
            calendar_end_datetime: { type: "STRING" },
            pain_score: { type: "INTEGER" },
            pain_locations: { type: "ARRAY", items: { type: "OBJECT", properties: { area: { type: "STRING" }, percentage: { type: "INTEGER" } } } },
            pain_mood: { type: "STRING" },
            note_content: { type: "STRING" },
            budget_description: { type: "STRING" },
            budget_amount: { type: "NUMBER" },
            budget_category: { type: "STRING" },
            budget_type: { type: "STRING", description: "Either 'income' or 'expense'" }
          },
          required: ["type"]
        }
      }
    },
    required: ["reply", "actions"]
  };

  try {
    const replyStr = await callGemini(systemPrompt, message, responseSchema, history);
    const parsed = JSON.parse(replyStr);
    
    let finalReply = parsed.reply;
    if (finalReply.includes("pain") || finalReply.includes("doctor")) {
        finalReply = finalReply.includes(MEDICAL_GUARDRAIL) ? finalReply : `${finalReply}\n\n${MEDICAL_GUARDRAIL}`;
    }

    if (parsed.actions && parsed.actions.length > 0) {
      const mappedActions = parsed.actions.map((a: any) => {
        let data: any = {};
        if (a.type === "task") data = { title: a.task_title, scheduled_time: a.task_scheduled_time };
        if (a.type === "calendar_event") {
            let startStr = a.calendar_start_datetime;
            try {
                startStr = startStr ? new Date(startStr).toISOString() : new Date().toISOString();
            } catch (e) {
                startStr = new Date().toISOString();
            }
            let endStr = a.calendar_end_datetime;
            try {
                endStr = endStr ? new Date(endStr).toISOString() : "";
            } catch (e) {
                endStr = "";
            }
            if (!endStr) {
                const endDt = new Date(startStr);
                endDt.setHours(endDt.getHours() + 1);
                endStr = endDt.toISOString();
            }
            data = { summary: a.calendar_summary, start: { dateTime: startStr }, end: { dateTime: endStr } };
        }
        if (a.type === "pain_log") data = { score: a.pain_score, locations: a.pain_locations, mood: a.pain_mood };
        if (a.type === "note") data = { content: a.note_content, author: 'rumble' };
        if (a.type === "budget_item") data = { description: a.budget_description, amount: a.budget_amount, category: a.budget_category, type: a.budget_type };
        return { type: a.type, data };
      });

      // If multiple actions, wrap them in multi_action so frontend can confirm all at once
      const preview: ActionPreview = {
        type: "multi_action",
        data: { actions: mappedActions }
      };
      
      const actionTypes = mappedActions.map((a: any) => a.type).join(", ");
      
      return {
        reply: `${finalReply}\n\n⚠️ Confirmation required: Click Confirm to execute these actions: [${actionTypes}].`,
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
    console.error("[RouteChatMessage Error]:", err);
    return {
      reply: `Rumble: I am here to assist with your recovery and daily operations.\n\n${MEDICAL_GUARDRAIL}`,
      intent: "CONVERSATION",
      disclaimer: MEDICAL_GUARDRAIL,
    };
  }
}

/**
 * Commits a confirmed action directly to the persistent store.
 */
export async function executeConfirmedAction(action: ActionPreview | { type: string; data: any }): Promise<{
  success: boolean;
  message: string;
  result?: any;
}> {
  if (action.type === "pain_log") {
    const { score, locations, mood, notes } = action.data;
    const logResult = logPain({ score, locations, mood, notes });
    if (!logResult.success || !logResult.entry) {
      throw new Error(`Pain log validation failed: ${logResult.errors?.join(", ")}`);
    }

    const savedRecord = await createPainLog({
      id: logResult.entry.id,
      score: logResult.entry.score,
      locations: logResult.entry.locations.map(l => ({
        area: l.area,
        side: l.side,
        percentage: l.weight,
      })),
      mood: logResult.entry.mood,
      notes: logResult.entry.notes,
    });

    // Automatically export to clean Markdown report in agent_reports/
    exportPainReportToMarkdown(logResult.entry);

    return {
      success: true,
      message: `Rumble: Confirmed and saved pain log (${score}/10) successfully. Exported to medical symptom report.`,
      result: savedRecord,
    };
  }

  if (action.type === "note") {
    const { content, author } = action.data;
    const savedNote = await createNote({ content, author: author || "user" });
    return {
      success: true,
      message: `Rumble: Confirmed and saved note: "${content}".`,
      result: savedNote,
    };
  }

  if (action.type === "task") {
    const { title, scheduled_time } = action.data;
    const savedTask = await createAgendaItem({
      item_type: "task",
      title,
      scheduled_time: scheduled_time || new Date().toISOString(),
      status: "pending",
    });
    return {
      success: true,
      message: `Rumble: Confirmed and added agenda task: "${title}".`,
      result: savedTask,
    };
  }

  if (action.type === "budget_item") {
    const { createBudgetItem } = await import('../db');
    const { description, amount, category, type } = action.data;
    const savedItem = await createBudgetItem({ description, amount, category, type });
    return {
      success: true,
      message: `Rumble: Confirmed and saved budget item: "${description}" for $${amount}.`,
      result: savedItem,
    };
  }

  if (action.type === "multi_action") {
    const results = [];
    for (const subAction of action.data.actions) {
      try {
        const res = await executeConfirmedAction(subAction);
        results.push(res.message);
      } catch (err: any) {
        results.push(`Failed to execute ${subAction.type}: ${err.message}`);
      }
    }
    return {
      success: true,
      message: `Rumble: Executed actions:\n${results.map(r => `• ${r.replace('Rumble: ', '')}`).join('\n')}`,
      result: results,
    };
  }

  if (action.type === "calendar_event") {
    let savedAgendaItem = null;
    try {
      savedAgendaItem = await createAgendaItem({
        item_type: "appointment",
        title: action.data.summary,
        scheduled_time: action.data.start?.dateTime || new Date().toISOString(),
        status: "pending",
      });
    } catch (dbErr) {
      console.warn("Could not write appointment to agenda_items table:", dbErr);
    }

    try {
      const { addLiveCalendarEvent } = await import('../google-auth-add');
      const res = await addLiveCalendarEvent(action.data);
      if (res.status === "success") {
        return {
          success: true,
          message: `Rumble: Confirmed and added to agenda & Google Calendar: "${action.data.summary}".`,
          result: res.event,
        };
      }
    } catch (gcalErr) {
      // Graceful fallback to agenda item
    }

    return {
      success: true,
      message: `Rumble: Confirmed and added to agenda: "${action.data.summary}".`,
      result: savedAgendaItem,
    };
  }

  throw new Error(`Unknown action type: ${(action as any).type}`);
}

