import { getCalendarEvents } from "./tools/calendar";
import { getGmailMessages } from "./tools/gmail";
import { CalendarEvent, GmailMessage } from "./tools/types";

export interface AgendaAlert {
  id: string;
  source: "gmail" | "calendar";
  sourceId: string;
  timeSlot: string; // e.g., "13:30"
  title: string;
  summary: string;
  actionRequired: boolean;
  requiresApprovalForAction: boolean;
}

export interface RetrievalScheduleConfig {
  schedule: string;
  timezone: string;
  runRetrieval: () => Promise<{
    timestamp: string;
    timezone: string;
    calendarEvents: CalendarEvent[];
    gmailMessages: GmailMessage[];
    injectedAlerts: AgendaAlert[];
  }>;
}

export const retrievalSchedule: RetrievalScheduleConfig = {
  schedule: "0 6,14 * * *",
  timezone: "Australia/Melbourne",
  runRetrieval: async () => {
    // 1. Read Calendar Events (read-only, no approval needed)
    const calendarRes = await getCalendarEvents.execute({});
    const calendarEvents = calendarRes.events || [];

    // 2. Read Gmail Messages (read-only, no approval needed)
    const gmailRes = await getGmailMessages.execute({});
    const gmailMessages = gmailRes.messages || [];

    // 3. Scan items for action items and derive daily agenda alerts
    const injectedAlerts: AgendaAlert[] = [];

    for (const msg of gmailMessages) {
      if (msg.actionRequired) {
        injectedAlerts.push({
          id: `alert_msg_${msg.id}`,
          source: "gmail",
          sourceId: msg.id,
          timeSlot: "13:30", // Tied to deadline or relevant time slot
          title: `Action Required: ${msg.subject}`,
          summary: msg.snippet,
          actionRequired: true,
          requiresApprovalForAction: true, // Any reply or event write requires needsApproval
        });
      }
    }

    for (const evt of calendarEvents) {
      if (evt.status === "confirmed" && evt.description?.toLowerCase().includes("action required")) {
        injectedAlerts.push({
          id: `alert_evt_${evt.id}`,
          source: "calendar",
          sourceId: evt.id,
          timeSlot: evt.start ? new Date(evt.start).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" }) : "09:00",
          title: `Agenda Alert: ${evt.summary}`,
          summary: evt.description || "",
          actionRequired: true,
          requiresApprovalForAction: true,
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      timezone: "Australia/Melbourne",
      calendarEvents,
      gmailMessages,
      injectedAlerts,
    };
  },
};

export default retrievalSchedule;
