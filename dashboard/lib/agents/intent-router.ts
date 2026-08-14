import { getAgendaItems, createAgendaItem, createNote, createPainLog, getNotes, getPainLogsFromDb } from '../db';
import { logPain, PainLocationWeight, validatePainLog } from '../rehab-learning';
import { selectWashingDays, WashingDay } from '../agenda-engine';
import { fetchLiveGmailMessages } from '../google-auth';



export const MEDICAL_GUARDRAIL =
  "Medical output is decision support, not diagnosis. Preserve clinician restrictions; recommend clinician review for worsening or concerning symptoms.";

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
  type: "pain_log" | "note" | "task";
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
async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `Rumble: I received your message: "${userMessage}". Let me know if you would like to log pain, create a note, or check your agenda.`;
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
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
export async function routeChatMessage(message: string): Promise<IntentRouteResult> {
  const intent = classifyIntent(message);

  // 1. LOG_PAIN Intent — Confirm-Before-Write Pattern
  if (intent === "LOG_PAIN") {
    const parseResult = parsePainLogDirective(message);

    if (parseResult.errors.length > 0 || !parseResult.parsed) {
      return {
        reply: `Rumble: I noticed you want to log pain, but need clarification:\n- ${parseResult.errors.join("\n- ")}\n\nPlease provide a 1–10 score and anatomical locations whose percentage weights total exactly 100% (e.g. "Log pain 6/10 in lumbar 80% and neck 20%").`,
        intent: "LOG_PAIN",
        requires_confirmation: false,
        disclaimer: MEDICAL_GUARDRAIL,
      };
    }

    const { score, locations, mood, notes } = parseResult.parsed;
    const locSummary = locations
      .map(l => `${l.side && l.side !== "unspecified" ? l.side + " " : ""}${l.area} (${l.percentage}%)`)
      .join(", ");

    const preview: ActionPreview = {
      type: "pain_log",
      data: { score, locations, mood, notes },
    };

    return {
      reply: `Rumble: [Preview] Pain Log Entry:\n• Score: ${score}/10\n• Locations: ${locSummary}\n• Mood: ${mood || "Not specified"}\n• Notes: ${notes || "None"}\n\n⚠️ Confirmation required: Reply or click Confirm to commit this record to your health log.`,
      intent: "LOG_PAIN",
      requires_confirmation: true,
      preview,
      disclaimer: MEDICAL_GUARDRAIL,
      data: preview.data,
    };
  }

  // 2. ADD_NOTE Intent — Confirm-Before-Write Pattern
  if (intent === "ADD_NOTE") {
    const content = parseNoteDirective(message);
    if (!content) {
      return {
        reply: "Rumble: Please provide the content for the note you would like to save.",
        intent: "ADD_NOTE",
        requires_confirmation: false,
      };
    }

    const preview: ActionPreview = {
      type: "note",
      data: { content },
    };

    return {
      reply: `Rumble: [Preview] Note Entry:\n• Content: "${content}"\n\n⚠️ Confirmation required: Reply or click Confirm to save this note to your notebook.`,
      intent: "ADD_NOTE",
      requires_confirmation: true,
      preview,
      data: preview.data,
    };
  }

  // 3. ADD_TASK Intent — Confirm-Before-Write Pattern
  if (intent === "ADD_TASK") {
    const parsedTask = parseTaskDirective(message);
    if (!parsedTask) {
      return {
        reply: "Rumble: Please specify the task or reminder you would like to add to your agenda.",
        intent: "ADD_TASK",
        requires_confirmation: false,
      };
    }

    const preview: ActionPreview = {
      type: "task",
      data: parsedTask,
    };

    return {
      reply: `Rumble: [Preview] Agenda Task:\n• Title: "${parsedTask.title}"\n• Scheduled: Tomorrow 09:00 AM\n\n⚠️ Confirmation required: Reply or click Confirm to add this task to your live agenda.`,
      intent: "ADD_TASK",
      requires_confirmation: true,
      preview,
      data: preview.data,
    };
  }

  // 4. CHECK_EMAIL Intent — Live Read (No confirmation needed)
  if (intent === "CHECK_EMAIL") {
    try {
      const emailRes = await fetchLiveGmailMessages({ maxResults: 5 });

      if (emailRes.status === "auth_required") {
        return {
          reply: "Rumble: Google Gmail authorization is required to read your live emails. Please authenticate via the Settings panel.",
          intent: "CHECK_EMAIL",
          requires_confirmation: false,
        };
      }

      if (emailRes.status === "error") {
        return {
          reply: "Rumble: Unable to retrieve Gmail messages at this time. Please ensure Google OAuth credentials are valid.",
          intent: "CHECK_EMAIL",
          requires_confirmation: false,
        };
      }

      const messages = emailRes.messages || [];
      if (messages.length === 0) {
        return {
          reply: "Rumble: Checked your Gmail inbox. You have no unread urgent messages requiring follow-up.",
          intent: "CHECK_EMAIL",
          requires_confirmation: false,
        };
      }

      const emailList = messages
        .map((m: any) => `• From: ${m.from || m.id}\n  Subject: ${m.subject || "No Subject"}\n  Summary: ${m.snippet || ""}`)
        .join("\n\n");

      return {
        reply: `Rumble: Here are your latest messages from Gmail:\n\n${emailList}`,
        intent: "CHECK_EMAIL",
        requires_confirmation: false,
        data: { messages },
      };
    } catch {
      return {
        reply: "Rumble: Unable to retrieve Gmail messages at this time. Please ensure Google OAuth credentials are valid.",
        intent: "CHECK_EMAIL",
        requires_confirmation: false,
      };
    }
  }


  // 5. AGENDA_QUERY Intent — Live Read (No confirmation needed)
  if (intent === "AGENDA_QUERY") {
    try {
      const items = await getAgendaItems();
      const activeItems = items.filter(i => i.status === "pending");

      if (activeItems.length === 0) {
        return {
          reply: "Rumble: Your agenda has no pending items scheduled for today.",
          intent: "AGENDA_QUERY",
          requires_confirmation: false,
        };
      }

      const formatted = activeItems
        .map(i => `• ${i.title} (${i.item_type}) - Scheduled: ${new Date(i.scheduled_time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" })}`)
        .join("\n");

      return {
        reply: `Rumble: Here are your active agenda items:\n\n${formatted}`,
        intent: "AGENDA_QUERY",
        requires_confirmation: false,
        data: { items: activeItems },
      };
    } catch {
      return {
        reply: "Rumble: Unable to retrieve agenda items right now.",
        intent: "AGENDA_QUERY",
        requires_confirmation: false,
      };
    }
  }

  // 6. WEATHER_QUERY Intent — Live Read (No confirmation needed)
  if (intent === "WEATHER_QUERY") {
    try {
      const washing = await selectWashingDays();
      if (washing.status === "unavailable") {
        return {
          reply: "Rumble: Live weather for Wangaratta, Victoria is currently unavailable from Open-Meteo.",
          intent: "WEATHER_QUERY",
          requires_confirmation: false,
        };
      }

      const daysSummary = washing.days
        .map((d: WashingDay) => `• ${d.date}: ${d.precipitationProbability}% precipitation probability (High: ${d.tempMax ?? "N/A"}°C)`)
        .join("\n");


      return {
        reply: `Rumble: Current 7-day weather forecast for Wangaratta, Victoria:\nRecommended washing days (lowest precipitation risk):\n${daysSummary}`,
        intent: "WEATHER_QUERY",
        requires_confirmation: false,
        data: { washingDays: washing.days },
      };
    } catch {
      return {
        reply: "Rumble: Weather data service is currently unavailable.",
        intent: "WEATHER_QUERY",
        requires_confirmation: false,
      };
    }
  }

  // 7. MEDICAL_TRIAGE & PAIN_DISCUSSION & GREETING & GENERAL
  // Ground with live system context and call Gemini
  const nowMel = new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
  let liveAgendaSnippet = "None";
  try {
    const items = await getAgendaItems();
    const pending = items.filter(i => i.status === "pending").map(i => i.title);
    if (pending.length > 0) liveAgendaSnippet = pending.join(", ");
  } catch {}

  const systemPrompt = `You are Rumble, an expert personal operations and rehabilitation AI assistant for Rumble OS.
Current Time in Australia/Melbourne: ${nowMel}.
Location: Wangaratta, Victoria, Australia.
Active Agenda Items: ${liveAgendaSnippet}.

Rules:
1. Always preserve the medical disclaimer: "${MEDICAL_GUARDRAIL}".
2. Never recommend pushing through worsening pain or ignoring surgery/clinician restrictions.
3. Be professional, concise, empathetic, and direct. Do NOT use decorative emojis.
4. If discussing symptoms without an explicit write request, provide decision support and remind the user they can explicitly say "Log pain" to record an entry.`;

  try {
    let reply = await callGemini(systemPrompt, message);
    const replyWithGuardrail = reply.includes(MEDICAL_GUARDRAIL) ? reply : `${reply}\n\n${MEDICAL_GUARDRAIL}`;

    return {
      reply: replyWithGuardrail,
      intent: intent === "PAIN_DISCUSSION" || intent === "MEDICAL_TRIAGE" ? intent : "CONVERSATION",
      disclaimer: MEDICAL_GUARDRAIL,
    };
  } catch (err: any) {
    const fallbackReply = intent === "GREETING"
      ? `Rumble: Hello! How can I assist you with your recovery or agenda today?\n\n${MEDICAL_GUARDRAIL}`
      : `Rumble: I am here to assist with your recovery and daily operations.\n\n${MEDICAL_GUARDRAIL}`;

    return {
      reply: fallbackReply,
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

    return {
      success: true,
      message: `Rumble: Confirmed and saved pain log (${score}/10) successfully.`,
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

  throw new Error(`Unknown action type: ${(action as any).type}`);
}
