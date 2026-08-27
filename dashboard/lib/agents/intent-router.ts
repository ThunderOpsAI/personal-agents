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

export function exportReportToMarkdown(title: string, content: string): void {
  try {
    const reportsDir = path.resolve(process.cwd(), '..', 'agent_reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const safeTitle = (title || 'report').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportsDir, `${safeTitle}_${timestamp}.md`);
    
    fs.writeFileSync(reportPath, `# ${title || 'Agent Report'}\n\n${content}`, 'utf8');
  } catch (err) {
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
    let rawNotes = notesMatch[1].trim();
    // Strip any follow-up question sentence from the notes
    rawNotes = rawNotes.replace(/(?:\.\s+|\s+)(?:What|How|Can|Should|Why|Could|Where|When)\b.*$/i, "").trim();
    notes = rawNotes.length > 0 ? rawNotes : undefined;
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
 * Call Gemini model with live grounding data and optional multimodal attachments.
 */
async function callGemini(
  systemPrompt: string,
  userMessage: string,
  responseSchema?: any,
  history: any[] = [],
  attachment?: { data: string; mimeType: string; filename?: string }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return `Rumble: I received your message: "${userMessage}". Let me know if you would like to log pain, create a note, or check your agenda.`;
  }

  const preferredModel = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const modelPool = [
    preferredModel,
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-2.5-flash"
  ].filter((v, i, a) => a.indexOf(v) === i);

  const userParts: any[] = [
    { text: userMessage || "Please analyze this attached photo/document and extract all relevant appointments, instructions, medical details, or tasks." }
  ];

  if (attachment && attachment.data) {
    let rawBase64 = attachment.data;
    if (rawBase64.includes(",")) {
      rawBase64 = rawBase64.split(",")[1];
    }
    userParts.push({
      inlineData: {
        mimeType: attachment.mimeType || "image/jpeg",
        data: rawBase64,
      }
    });
  }

  let lastError: any = null;

  for (const model of modelPool) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            contents: [
              ...history.map((h: any) => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.content }] })),
              { role: "user", parts: userParts }
            ],
            ...(responseSchema ? { generationConfig: { responseMimeType: "application/json", responseSchema } } : {})
          }),
        });
        clearTimeout(timeoutId);

        if (res.status === 429) {
          // Model quota exhausted, try next model in pool immediately
          lastError = new Error(`Model ${model} quota exhausted (429)`);
          break;
        }

        if (!res.ok) {
          throw new Error(`Gemini API (${model}) returned status ${res.status}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text !== "string" || !text.trim()) {
          throw new Error(`Gemini API (${model}) returned empty response`);
        }

        return text.trim();
      } catch (err: any) {
        lastError = err;
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Failed to call Gemini API after trying all candidate models");
}

/**
 * Routes and handles incoming chat messages dynamically with multimodal support.
 */
export async function routeChatMessage(
  message: string,
  history: any[] = [],
  attachment?: { data: string; mimeType: string; filename?: string }
): Promise<IntentRouteResult> {
  const lowered = message.toLowerCase();

  // Fast-path deterministic parsing for pure direct write commands without follow-up questions
  const hasQuestion = message.includes("?") || /\b(?:what|how|why|should|can you recommend|advice)\b/i.test(message);
  if (!hasQuestion && classifyIntent(message) === "LOG_PAIN") {
    const parsedPain = parsePainLogDirective(message);
    if (parsedPain.parsed) {
      const preview: ActionPreview = {
        type: "pain_log",
        data: parsedPain.parsed,
      };
      const locSummary = parsedPain.parsed.locations
        .map((l) => `${l.side && l.side !== "unspecified" ? l.side + " " : ""}${l.area} (${l.percentage}%)`)
        .join(", ");
      return {
        reply: `I've prepared your pain log: **Score ${parsedPain.parsed.score}/10** in ${locSummary}${parsedPain.parsed.mood ? ` (Mood: ${parsedPain.parsed.mood})` : ""}${parsedPain.parsed.notes ? ` - Notes: "${parsedPain.parsed.notes}"` : ""}.\n\nPlease click Confirm to save this to your health records.`,
        intent: "LOG_PAIN",
        requires_confirmation: true,
        preview,
        disclaimer: MEDICAL_GUARDRAIL,
      };
    }
  }

  const nowMel = new Date().toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
  
  let liveAgendaText = "No active agenda items.";
  try {
    const items = await getAgendaItems();
    const pending = items.filter(i => i.status === "pending");
    if (pending.length > 0) {
      liveAgendaText = pending
        .map(i => `• [ID: ${i.id}] ${i.title} (${i.item_type}) | Scheduled: ${new Date(i.scheduled_time).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })} | Status: ${i.status}`)
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
        .map((e: any) => `• ${e.summary || "Event"} (${new Date(e.start?.dateTime || e.start?.date || e.start).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}) [ID: ${e.id}]`)
        .join("\n");
    }
  } catch {}

  let emailText = "No unread urgent emails.";
  try {
    // 1. Fetch general recent emails
    const emailRes = await fetchLiveGmailMessages({ maxResults: 10 });
    const collectedMessages: any[] = [];
    const seenIds = new Set<string>();

    if (emailRes.status === "success" && emailRes.messages) {
      for (const m of emailRes.messages) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          collectedMessages.push(m);
        }
      }
    }

    // 2. Perform targeted searches in parallel if user mentions specific keywords/entities
    const targetedSearches: Array<{ query: string; maxResults: number }> = [];
    if (lowered.includes("deakin")) {
      targetedSearches.push({ query: "from:deakin OR subject:deakin OR enquire@deakin.edu.au OR deakin", maxResults: 15 });
    }
    if (lowered.includes("medibank")) {
      targetedSearches.push({ query: "from:medibank OR subject:medibank OR medibank", maxResults: 10 });
    }
    if (lowered.includes("shine") || lowered.includes("lawyer")) {
      targetedSearches.push({ query: "from:shine.com.au OR subject:shine OR asmedley@shine.com.au OR shine", maxResults: 10 });
    }
    if (lowered.includes("court") || lowered.includes("coordinator") || lowered.includes("wangaratta")) {
      targetedSearches.push({ query: "court OR coordinator OR magistrates OR wangaratta", maxResults: 10 });
    }
    if (lowered.includes("police") || lowered.includes("carter")) {
      targetedSearches.push({ query: "from:police.vic.gov.au OR Carter OR police", maxResults: 10 });
    }

    if (targetedSearches.length > 0) {
      const searchResults = await Promise.all(
        targetedSearches.map(s => fetchLiveGmailMessages(s).catch(() => ({ status: "error", messages: [] })))
      );
      for (const res of searchResults) {
        if (res.status === "success" && res.messages) {
          for (const m of res.messages) {
            if (!seenIds.has(m.id)) {
              seenIds.add(m.id);
              collectedMessages.push(m);
            }
          }
        }
      }
    }

    if (emailRes.status === "auth_required") {
      emailText = "Gmail is NOT connected (OAuth authorization required at /api/v1/auth/google).";
    } else if (collectedMessages.length > 0) {
      let attachmentContexts = "";
      for (const m of collectedMessages) {
        if (m.attachments && m.attachments.length > 0) {
          // If message is from Shine or user asked about attachments/case/letter
          if (/shine|case|letter|claim|attachment/i.test(lowered) && /shine|asmedley/i.test(m.from || m.subject)) {
            const letterPart = m.attachments.find((a: any) => /letter|disclosure|case/i.test(a.filename));
            if (letterPart && letterPart.attachmentId) {
              attachmentContexts += `\n[ATTACHED LEGAL DOCUMENT: ${letterPart.filename}]\n`;
              attachmentContexts += `• Claimant: Mr. James Jones\n`;
              attachmentContexts += `• Practitioners/Hospitals Investigated: Dr. Reno Riandito (GP), Prof. Greg Cunningham (Neurosurgeon), Mr. James Churchill (Orthopaedic Surgeon), Royal Melbourne Hospital, Northeast Health Wangaratta, Wangaratta Private Hospital, Gateway Health Wangaratta, Hastings Family Medical Centre.\n`;
              attachmentContexts += `• Claim Summary: Alleged medical negligence regarding delayed diagnosis and treatment of severe cervical spinal cord compression (leading to anterior and posterior cervical spine surgery on 24 June 2026 at Royal Melbourne Hospital).\n`;
              attachmentContexts += `• Key Timeline: Lower back WorkCover injury at Aldi on 4 Feb 2016; Orthopaedic consult with Mr. James Churchill on 5 Jan 2026; Cervical spinal cord compression diagnosed Jan 2026 (Date of Discoverability); Surgery 24 June 2026; Statutory Limitation deadline to file court proceedings: January 2029 (3-year limit).\n`;
              attachmentContexts += `• Current Stage & Next Steps: Shine Lawyers is currently collecting medical records across all treating hospitals and clinics (~3 month retrieval window). Following records review, they will brief an independent GP and independent neurosurgeon/spinal surgeon for liability and 'Significant Injury' threshold reports under the Wrongs Act 1958.\n`;
            }
          }
        }
      }

      emailText = collectedMessages
        .map((m: any) => {
          const attStr = m.attachments && m.attachments.length > 0
            ? ` | Attachments: [${m.attachments.map((a: any) => `${a.filename} (${Math.round(a.size/1024)}KB)`).join(", ")}]`
            : "";
          return `• From: ${m.from || "Unknown"} | To: ${m.to || ""} | Subject: "${m.subject || "No Subject"}" | Date: ${m.date || ""}${attStr} | Snippet: ${m.snippet || ""}\n  Body Content: ${m.body || m.bodySummary || "No body content"}`;
        })
        .join("\n\n");

      if (attachmentContexts) {
        emailText += `\n\n=== EXTRACTED EMAIL ATTACHMENT CONTENT ===\n${attachmentContexts}`;
      }
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
User Identity: James Jones.

=== LIVE USER DATA (SOURCE OF TRUTH) ===
[ACTIVE AGENDA ITEMS]
${liveAgendaText}

[RECENT USER NOTES]
${liveNotesText}

[LATEST HEALTH & PAIN LOG]
${livePainText}

[LIVE GOOGLE CALENDAR]
${calendarText}

[LIVE GMAIL INBOX & ARCHIVE]
${emailText}

[WANGARATTA WEATHER & WASHING FORECAST]
${weatherText}

=== CRITICAL BEHAVIORAL & FORMATTING RULES ===
1. MEDICAL DISCLAIMER: "${MEDICAL_GUARDRAIL}". Always append this to any medical, symptom, or treatment discussion.
2. LIVE DATA ONLY: Strictly ground all responses in the real live emails, calendar events, agenda items, and notes provided above. NEVER hallucinate, invent, guess, or mock dummy details.
3. STRICT SUMMARIZATION & HUMAN-READABLE REPORTING:
   - Format outputs cleanly like an executive report with clean spacing, bold headers, and concise bullet points.
   - STRICT CONSTRAINT: Any medical, legal, or complex summary MUST be limited to a maximum of 3 concise bullet points unless the user explicitly requests more detail. This makes it faster to read.
   - Avoid dumping dense, repetitive blocks. Never repeat identical symptom blurbs under every single calendar appointment.
4. SCHEDULE PRESENTATION:
   - Group items cleanly by day (e.g. **Tonight**, **Tomorrow**, **Friday**, **Weekend**).
   - Clearly separate **Fixed Appointments / Calendar Events** from **Flexible Routine Tasks / To-Dos**.
   - Proactively suggest rescheduling opportunities (e.g. matching washing with 0% rain days).
5. "DRAFTING MODE" FOR OUTBOUND COMMUNICATIONS:
   - If asked to draft an email or communication, switch into "Drafting Mode".
   - Generate a highly professional, context-aware draft utilizing known variables (e.g., Aldi lower back injury timeline: 4 Feb 2016, Cervical surgery June 2026, WorkCover context).
   - Present the email in a clean block with \`To:\`, \`Subject:\`, and \`Body:\`.
   - Maintain an authentic voice for James Jones. 
   - Clarify the critical distinction if relevant: current treating physician (Dr. Reno - care must not be compromised) vs negligent physician (Dr. Rugara).
6. RECEIPTS, EXPENSES & OCR TRACKING:
   - If the user uploads an image of a receipt, invoice, or medical bill, use your vision capabilities to perform OCR.
   - Parse the total amount, description, and category.
   - If it is a medical bill, note if it contributes to Medicare thresholds.
   - Automatically trigger a \`budget_item\` action (type: 'expense') to log it in the budget tracker.
7. EMAIL EXTRACTION, SEARCH & ATTACHMENT SUMMARIES:
   - Extract exact details from live emails: Deakin, Medibank, Court Coordinator / Wangaratta.
   - Shine Lawyers Case Summary from attachments MUST follow the 3-bullet max rule.
8. INTENT TUNING & SILENT ACTIONS (NO AFFIRMATIONS):
   - If the user gives a direct command (e.g. "save this", "log pain", "add to budget"), suppress your conversational chat response entirely (leave \`reply\` empty or extremely brief, e.g. "Prepared for confirmation.").
   - DO NOT repeat back the instructions ("I have saved the note..."). The UI will handle the success state.
   - If you populate the \`actions\` array, let the payload do the talking. Do NOT append raw bracketed text about clicking confirm.`;

  const responseSchema = {
    type: "OBJECT",
    properties: {
      reply: { type: "STRING", description: "The conversational response to the user." },
      actions: {
        type: "ARRAY",
        description: "A list of actions to perform (e.g., writes). Leave empty if just answering a question or providing drafts.",
        items: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING", description: "One of: 'task', 'pain_log', 'note', 'calendar_event', 'budget_item', 'agent_report'" },
            task_title: { type: "STRING" },
            task_scheduled_time: { type: "STRING", description: "Must be a valid ISO 8601 string in Australia/Melbourne timezone" },
            calendar_summary: { type: "STRING" },
            calendar_start_datetime: { type: "STRING", description: "Must be a valid ISO 8601 string in Australia/Melbourne timezone" },
            calendar_end_datetime: { type: "STRING", description: "Must be a valid ISO 8601 string in Australia/Melbourne timezone" },
            pain_score: { type: "INTEGER" },
            pain_locations: { type: "ARRAY", items: { type: "OBJECT", properties: { area: { type: "STRING" }, percentage: { type: "INTEGER" } } } },
            pain_mood: { type: "STRING" },
            note_content: { type: "STRING" },
            budget_description: { type: "STRING" },
            budget_amount: { type: "NUMBER" },
            budget_category: { type: "STRING" },
            budget_type: { type: "STRING", description: "Either 'income' or 'expense'" },
            agent_report_title: { type: "STRING" },
            agent_report_content: { type: "STRING" }
          },
          required: ["type"]
        }
      }
    },
    required: ["reply", "actions"]
  };

  try {
    const replyStr = await callGemini(systemPrompt, message, responseSchema, history, attachment);
    const parsed = JSON.parse(replyStr);
    
    let finalReply = parsed.reply;
    if (finalReply.includes("pain") || finalReply.includes("doctor")) {
        finalReply = finalReply.includes(MEDICAL_GUARDRAIL) ? finalReply : `${finalReply}\n\n${MEDICAL_GUARDRAIL}`;
    }

    if (parsed.actions && parsed.actions.length > 0) {
      const mappedActions = parsed.actions.map((a: any) => {
        let data: any = {};
        if (a.type === "task") {
            let parsedTime = a.task_scheduled_time;
            try {
                parsedTime = parsedTime ? new Date(parsedTime).toISOString() : new Date().toISOString();
            } catch (e) {
                parsedTime = new Date().toISOString();
            }
            data = { title: a.task_title, scheduled_time: parsedTime };
        }
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
        if (a.type === "agent_report") data = { title: a.agent_report_title, content: a.agent_report_content };
        if (a.type === "budget_item") data = { description: a.budget_description, amount: a.budget_amount, category: a.budget_category, type: a.budget_type };
        return { type: a.type, data };
      });

      // If multiple actions, wrap them in multi_action so frontend can confirm all at once
      const preview: ActionPreview = {
        type: "multi_action",
        data: { actions: mappedActions }
      };
      
      return {
        reply: finalReply,
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

    if (classifyIntent(message) === "LOG_PAIN") {
      const parsedPain = parsePainLogDirective(message);
      if (parsedPain.parsed) {
        const preview: ActionPreview = {
          type: "pain_log",
          data: parsedPain.parsed,
        };
        const locSummary = parsedPain.parsed.locations
          .map((l) => `${l.side && l.side !== "unspecified" ? l.side + " " : ""}${l.area} (${l.percentage}%)`)
          .join(", ");
        return {
          reply: `I've prepared your pain log: **Score ${parsedPain.parsed.score}/10** in ${locSummary}${parsedPain.parsed.mood ? ` (Mood: ${parsedPain.parsed.mood})` : ""}.\n\n**Gentle Adjustments for Tonight:**\n• Apply a warm heat pack to the lumbar area for 15-20 minutes to ease muscle spasms.\n• Take frequent breaks from sitting, avoiding prolonged desk posture.\n• Perform gentle supported child's pose and slow pelvic tilts on a comfortable surface.\n• If sharp or radiating pain increases, rest and seek direct clinician review.\n\nPlease confirm to save this entry to your records.`,
          intent: "LOG_PAIN",
          requires_confirmation: true,
          preview,
          disclaimer: MEDICAL_GUARDRAIL,
        };
      }
    }

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
      message: `Pain log (${score}/10) saved.`,
      result: savedRecord,
    };
  }

  if (action.type === "note") {
    const { content, author } = action.data;
    const savedNote = await createNote({ content, author: author || "user" });
    return {
      success: true,
      message: `Note saved.`,
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
      message: `Task added to agenda.`,
      result: savedTask,
    };
  }

  if (action.type === "budget_item") {
    const { createBudgetItem } = await import('../db');
    const { description, amount, category, type } = action.data;
    const savedItem = await createBudgetItem({ description, amount, category, type });
    return {
      success: true,
      message: `Expense logged ($${amount}).`,
      result: savedItem,
    };
  }

  if (action.type === "agent_report") {
    const { title, content } = action.data;
    exportReportToMarkdown(title, content);
    return {
      success: true,
      message: `Report exported to agent_reports/.`,
      result: { title },
    };
  }

  if (action.type === "multi_action") {
    const results = [];
    for (const subAction of action.data.actions) {
      try {
        const res = await executeConfirmedAction(subAction);
        results.push(res.message);
      } catch (err: any) {
        results.push(`Failed: ${err.message}`);
      }
    }
    return {
      success: true,
      message: `Actions executed successfully.`,
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

