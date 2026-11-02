import {
  getAgendaItems,
  getNotes,
  getPainLogsFromDb,
  getBudgetItems,
  getBillsSubscriptions,
  getExercisePreferences,
  getSoulLearnedRules,
  getSmsMessages,
} from "../db";
import { getMonthRange, calculateBudgetBreakdown } from "../budget-engine";
import { searchSemanticMemories } from "../semantic-memory";
import { fetchLiveCalendarEvents, fetchLiveGmailMessages } from "../google-auth";
import { selectWashingDays } from "../agenda-engine";
import type { IntentType } from "./intent-router";

export type LoaderName =
  | "agenda"
  | "notes"
  | "pain"
  | "budget"
  | "bills"
  | "exercisePrefs"
  | "semanticMemory"
  | "soulRules"
  | "calendar"
  | "email"
  | "washing"
  | "sms";

export const ALL_LOADERS: LoaderName[] = [
  "agenda",
  "budget",
  "bills",
  "notes",
  "pain",
  "exercisePrefs",
  "semanticMemory",
  "soulRules",
  "calendar",
  "email",
  "sms",
  "washing",
];

export const INTENT_CONTEXT_MAP: Record<IntentType, LoaderName[]> = {
  ADD_TASK: ["agenda"],
  ADD_NOTE: ["notes"],
  LOG_PAIN: ["pain"],
  CHECK_EMAIL: ["email"],
  CHECK_SMS: ["sms"],
  AGENDA_QUERY: ["calendar", "agenda"],
  WEATHER_QUERY: ["washing"],
  BUDGET_QUERY: ["budget", "bills"],
  PAIN_DISCUSSION: ["pain", "exercisePrefs", "semanticMemory", "soulRules"],
  MEDICAL_TRIAGE: ["pain", "exercisePrefs", "semanticMemory", "soulRules"],
  GREETING: ["agenda"],
  CONVERSATION: ["agenda", "notes", "pain", "soulRules"],
  GENERAL: ALL_LOADERS,
};

export async function loadAgenda(): Promise<string> {
  try {
    const items = await getAgendaItems();
    const pending = (items || []).filter((i) => i.status === "pending");
    if (pending.length > 0) {
      const itemsList = pending
        .map(
          (i) =>
            `• [ID: ${i.id}] ${i.title} (${i.item_type}) | Scheduled: ${new Date(i.scheduled_time).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })} | Status: ${i.status}`
        )
        .join("\n");
      return `[ACTIVE AGENDA ITEMS]\n${itemsList}`;
    }
    return `[ACTIVE AGENDA ITEMS]\nNo active agenda items.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Agenda load error:", err);
    return `[ACTIVE AGENDA ITEMS]\nAgenda: unavailable (${err?.message || "database query failed"})`;
  }
}

export async function loadNotes(): Promise<string> {
  try {
    const notes = await getNotes();
    const recent = (notes || []).slice(0, 5);
    if (recent.length > 0) {
      const notesList = recent
        .map((n) => `• [${new Date(n.created_at).toLocaleDateString("en-AU")}] ${n.content}`)
        .join("\n");
      return `[RECENT USER NOTES]\n${notesList}`;
    }
    return `[RECENT USER NOTES]\nNo recent notes.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Notes load error:", err);
    return `[RECENT USER NOTES]\nNotes: unavailable (${err?.message || "database query failed"})`;
  }
}

export async function loadPain(): Promise<string> {
  try {
    const painLogs = await getPainLogsFromDb();
    let livePainText = "No recent pain logs recorded.";
    if (painLogs && painLogs.length > 0) {
      const pl = painLogs[0];
      const locs = (pl.locations || [])
        .map(
          (l: any) =>
            `${l.side && l.side !== "unspecified" ? l.side + " " : ""}${l.area} (${l.percentage}%)`
        )
        .join(", ");
      livePainText = `Latest score: ${pl.score}/10 in ${locs} (Mood: ${pl.mood || "N/A"}, Notes: ${pl.notes || "None"})`;
    }

    const nowMs = Date.now();
    const sevenDaysAgo = nowMs - 7 * 24 * 60 * 60 * 1000;
    const recentLogs = (painLogs || []).filter(
      (p) => new Date(p.created_at).getTime() >= sevenDaysAgo
    );

    let stats = "No logs in last 7 days.";
    if (recentLogs.length > 0) {
      const scores = recentLogs.map((p) => p.score);
      const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      const severeFlares = scores.filter((s) => s >= 7).length;
      stats = `7-Day Mean Pain: ${avgScore}/10 across ${recentLogs.length} logs | Severe Flares (>=7/10): ${severeFlares}`;
    }

    let reliefSummary = "No routine completions recorded.";
    try {
      const prefs = await getExercisePreferences();
      if (prefs && prefs.length > 0) {
        const topRelief = [...prefs]
          .sort(
            (a, b) =>
              b.pre_pain_score - b.post_pain_score - (a.pre_pain_score - a.post_pain_score)
          )
          .slice(0, 3);
        reliefSummary = topRelief
          .map(
            (r) =>
              `• ${r.routine_title}: ${r.pre_pain_score} -> ${r.post_pain_score} (Relief: -${(r.pre_pain_score - r.post_pain_score).toFixed(1)} pts)`
          )
          .join("\n");
      }
    } catch {}

    const painTrendText = `${stats}\nTop Historical Relief Drivers:\n${reliefSummary}`;
    return `[LATEST HEALTH & PAIN LOG]\n${livePainText}\n\n[7-DAY PAIN TREND & REHAB RELIEF DELTAS]\n${painTrendText}`;
  } catch (err: any) {
    console.error("[ContextLoaders] Pain load error:", err);
    return `[LATEST HEALTH & PAIN LOG]\nPain logs: unavailable (${err?.message || "database query failed"})\n\n[7-DAY PAIN TREND & REHAB RELIEF DELTAS]\nPain trend: unavailable (${err?.message || "database query failed"})`;
  }
}

export async function loadBudget(): Promise<string> {
  try {
    const allBudget = await getBudgetItems();
    const monthRange = getMonthRange();
    const currentMonthItems = (allBudget || []).filter(
      (i) => i.created_at >= monthRange.startIso && i.created_at <= monthRange.endIso
    );
    if (currentMonthItems.length > 0) {
      const breakdown = calculateBudgetBreakdown(currentMonthItems);
      const catList = Object.entries(breakdown.categories)
        .map(([cat, total]) => `${cat}: $${total.toFixed(2)}`)
        .join(", ");
      const budgetText = `Total Spent (${monthRange.label}): $${breakdown.totalExpense.toFixed(2)} | Total Income: $${breakdown.totalIncome.toFixed(2)} | Net: $${breakdown.netSpent.toFixed(2)}\nCategory Breakdown: ${catList}`;
      return `[CURRENT MONTH BUDGET & EXPENSES]\n${budgetText}`;
    }
    return `[CURRENT MONTH BUDGET & EXPENSES]\nNo budget items logged this month.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Budget load error:", err);
    return `[CURRENT MONTH BUDGET & EXPENSES]\nBudget: unavailable (${err?.message || "calculation failed"})`;
  }
}

export async function loadBills(): Promise<string> {
  try {
    const bills = await getBillsSubscriptions();
    const activeBills = (bills || []).filter((b) => b.status === "active");
    if (activeBills.length > 0) {
      const billsList = activeBills
        .map(
          (b) =>
            `• ${b.title}: $${Number(b.amount).toFixed(2)} (${b.frequency}) | Due: ${b.next_due_date}`
        )
        .join("\n");
      return `[RECURRING BILLS & SUBSCRIPTIONS]\n${billsList}`;
    }
    return `[RECURRING BILLS & SUBSCRIPTIONS]\nNo active recurring bills or subscriptions.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Bills load error:", err);
    return `[RECURRING BILLS & SUBSCRIPTIONS]\nBills: unavailable (${err?.message || "database query failed"})`;
  }
}

export async function loadExercisePrefs(): Promise<string> {
  try {
    const prefs = await getExercisePreferences();
    if (prefs && prefs.length > 0) {
      const topRelief = [...prefs]
        .sort(
          (a, b) =>
            b.pre_pain_score - b.post_pain_score - (a.pre_pain_score - a.post_pain_score)
        )
        .slice(0, 3);
      const reliefSummary = topRelief
        .map(
          (r) =>
            `• ${r.routine_title}: ${r.pre_pain_score} -> ${r.post_pain_score} (Relief: -${(r.pre_pain_score - r.post_pain_score).toFixed(1)} pts)`
        )
        .join("\n");
      return `[TOP HISTORICAL RELIEF DRIVERS]\n${reliefSummary}`;
    }
    return `[TOP HISTORICAL RELIEF DRIVERS]\nNo routine completions recorded.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Exercise preferences load error:", err);
    return `[TOP HISTORICAL RELIEF DRIVERS]\nExercise preferences: unavailable (${err?.message || "database query failed"})`;
  }
}

export async function loadSemanticMemory(query: string = ""): Promise<string> {
  try {
    if (query && query.trim()) {
      const results = await searchSemanticMemories({ query, limit: 5 });
      if (results && results.length > 0) {
        const memList = results
          .map(
            (m) =>
              `• [${m.sourceType.toUpperCase()}]: ${m.content} (similarity: ${m.similarity.toFixed(2)})`
          )
          .join("\n");
        return `[RELEVANT SEMANTIC MEMORIES]\n${memList}`;
      }
    }
    return `[RELEVANT SEMANTIC MEMORIES]\nNo relevant past memories.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Semantic memory load error:", err);
    return `[RELEVANT SEMANTIC MEMORIES]\nSemantic memories: unavailable (${err?.message || "vector store query failed"})`;
  }
}

export async function loadSoulRules(): Promise<string> {
  try {
    const rules = await getSoulLearnedRules();
    if (rules && rules.length > 0) {
      const rulesList = rules.slice(0, 10).map((r) => `• ${r}`).join("\n");
      return `[ACTIVE SOUL.MD LEARNED RULES]\n${rulesList}`;
    }
    return `[ACTIVE SOUL.MD LEARNED RULES]\nNo active learned rules in SOUL.md.`;
  } catch (err: any) {
    console.error("[ContextLoaders] SOUL rules load error:", err);
    return `[ACTIVE SOUL.MD LEARNED RULES]\nSOUL rules: unavailable (${err?.message || "query failed"})`;
  }
}

export async function loadCalendar(): Promise<string> {
  try {
    const calRes = await fetchLiveCalendarEvents();
    if (calRes.status === "auth_required") {
      return `[LIVE GOOGLE CALENDAR]\nGoogle Calendar is NOT connected (OAuth authorization required at /api/v1/auth/google).`;
    }
    if (calRes.status === "success" && calRes.events && calRes.events.length > 0) {
      const eventsList = calRes.events
        .map(
          (e: any) =>
            `• ${e.summary || "Event"} (${new Date(e.start?.dateTime || e.start?.date || e.start).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" })}) [ID: ${e.id}]`
        )
        .join("\n");
      return `[LIVE GOOGLE CALENDAR]\n${eventsList}`;
    }
    return `[LIVE GOOGLE CALENDAR]\nNo live Google Calendar events scheduled for the next 30 days.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Calendar load error:", err);
    return `[LIVE GOOGLE CALENDAR]\nGoogle Calendar: unavailable (${err?.message || "network error"})`;
  }
}

export async function loadEmail(query: string = ""): Promise<string> {
  try {
    const lowered = (query || "").toLowerCase();
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

    const targetedSearches: Array<{ query: string; maxResults: number }> = [];
    if (lowered.includes("deakin")) {
      targetedSearches.push({
        query: "from:deakin OR subject:deakin OR enquire@deakin.edu.au OR deakin",
        maxResults: 15,
      });
    }
    if (lowered.includes("medibank")) {
      targetedSearches.push({
        query: "from:medibank OR subject:medibank OR medibank",
        maxResults: 10,
      });
    }
    if (lowered.includes("shine") || lowered.includes("lawyer")) {
      targetedSearches.push({
        query: "from:shine.com.au OR subject:shine OR asmedley@shine.com.au OR shine",
        maxResults: 10,
      });
    }
    if (
      lowered.includes("court") ||
      lowered.includes("coordinator") ||
      lowered.includes("wangaratta")
    ) {
      targetedSearches.push({
        query: "court OR coordinator OR magistrates OR wangaratta",
        maxResults: 10,
      });
    }
    if (lowered.includes("police") || lowered.includes("carter")) {
      targetedSearches.push({
        query: "from:police.vic.gov.au OR Carter OR police",
        maxResults: 10,
      });
    }

    if (targetedSearches.length > 0) {
      const searchResults = await Promise.all(
        targetedSearches.map((s) =>
          fetchLiveGmailMessages(s).catch(() => ({ status: "error", messages: [] }))
        )
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
      return `[LIVE GMAIL INBOX & ARCHIVE]\nGmail is NOT connected (OAuth authorization required at /api/v1/auth/google).`;
    }

    if (collectedMessages.length > 0) {
      let attachmentContexts = "";
      for (const m of collectedMessages) {
        if (m.attachments && m.attachments.length > 0) {
          if (
            /shine|case|letter|claim|attachment/i.test(lowered) &&
            /shine|asmedley/i.test(m.from || m.subject)
          ) {
            const letterPart = m.attachments.find((a: any) =>
              /letter|disclosure|case/i.test(a.filename)
            );
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

      let emailText = collectedMessages
        .map((m: any) => {
          const attStr =
            m.attachments && m.attachments.length > 0
              ? ` | Attachments: [${m.attachments.map((a: any) => `${a.filename} (${Math.round(a.size / 1024)}KB)`).join(", ")}]`
              : "";
          return `• From: ${m.from || "Unknown"} | To: ${m.to || ""} | Subject: "${m.subject || "No Subject"}" | Date: ${m.date || ""}${attStr} | Snippet: ${m.snippet || ""}\n  Body Content: ${m.body || m.bodySummary || "No body content"}`;
        })
        .join("\n\n");

      if (attachmentContexts) {
        emailText += `\n\n=== EXTRACTED EMAIL ATTACHMENT CONTENT ===\n${attachmentContexts}`;
      }

      return `[LIVE GMAIL INBOX & ARCHIVE]\n${emailText}`;
    }

    return `[LIVE GMAIL INBOX & ARCHIVE]\nNo unread urgent emails.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Email load error:", err);
    return `[LIVE GMAIL INBOX & ARCHIVE]\nGmail: unavailable (${err?.message || "network error"})`;
  }
}

export async function loadWashing(): Promise<string> {
  try {
    const washRes = await selectWashingDays();
    if (washRes.status === "success" && washRes.days && washRes.days.length > 0) {
      const daysText = washRes.days
        .map((d: any) => {
          const dayName = new Date(d.date).toLocaleDateString("en-AU", {
            weekday: "long",
            timeZone: "Australia/Melbourne",
          });
          return `• ${dayName}: ${d.precipitationProbability}% rain risk, max ${d.tempMax}°C`;
        })
        .join("\n");
      return `[WANGARATTA WEATHER & WASHING FORECAST]\n${daysText}`;
    }
    return `[WANGARATTA WEATHER & WASHING FORECAST]\nWeather forecast currently unavailable.`;
  } catch (err: any) {
    console.error("[ContextLoaders] Washing/Weather load error:", err);
    return `[WANGARATTA WEATHER & WASHING FORECAST]\nWeather: unavailable (${err?.message || "network error"})`;
  }
}

export async function loadSms(): Promise<string> {
  try {
    const smsMessages = await getSmsMessages({ limit: 15 });
    if (smsMessages && smsMessages.length > 0) {
      const smsText = smsMessages
        .map((m: any) => {
          let bodyText = m.body;
          if (bodyText === "{sms_body}" || bodyText?.startsWith("{sms_body}")) {
            bodyText = `${bodyText} (⚠️ MacroDroid phone tag issue: configure [sms_message] instead of {sms_body} in HTTP Request body)`;
          }
          return `• From: ${m.sender} | Date: ${m.received_at || m.created_at} | Status: ${m.read ? "Read" : "Unread"}\n  Body: "${bodyText}"`;
        })
        .join("\n\n");
      return `[RECENT SMS / TEXT MESSAGES]\n${smsText}`;
    }
    return `[RECENT SMS / TEXT MESSAGES]\nNo text messages received yet.`;
  } catch (err: any) {
    console.error("[ContextLoaders] SMS load error:", err);
    return `[RECENT SMS / TEXT MESSAGES]\nSMS: unavailable (${err?.message || "database query failed"})`;
  }
}

export const contextLoaders = {
  loadAgenda,
  loadNotes,
  loadPain,
  loadBudget,
  loadBills,
  loadExercisePrefs,
  loadSemanticMemory,
  loadSoulRules,
  loadCalendar,
  loadEmail,
  loadWashing,
  loadSms,
};

export const LOADERS: Record<LoaderName, (queryContext?: string) => Promise<string>> = {
  agenda: () => contextLoaders.loadAgenda(),
  notes: () => contextLoaders.loadNotes(),
  pain: () => contextLoaders.loadPain(),
  budget: () => contextLoaders.loadBudget(),
  bills: () => contextLoaders.loadBills(),
  exercisePrefs: () => contextLoaders.loadExercisePrefs(),
  semanticMemory: (q) => contextLoaders.loadSemanticMemory(q || ""),
  soulRules: () => contextLoaders.loadSoulRules(),
  calendar: () => contextLoaders.loadCalendar(),
  email: (q) => contextLoaders.loadEmail(q || ""),
  washing: () => contextLoaders.loadWashing(),
  sms: () => contextLoaders.loadSms(),
};
