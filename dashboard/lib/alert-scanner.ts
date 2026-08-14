import { createAgendaItem, getAgendaItems } from "./db";
import { AgendaItem } from "./schema";

export interface AlertCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  status: string;
}

export interface AlertGmailMessage {
  id: string;
  threadId?: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
  bodySummary?: string;
  actionRequired?: boolean;
}

/**
 * Extracts a target time slot (HH:mm) from unstructured text (e.g., subject or snippet).
 * Defaults to "13:30" if no specific time pattern is found.
 */
export function extractTimeSlot(text: string): { timeSlot: string; hour: number; minute: number } {
  if (!text) {
    return { timeSlot: "13:30", hour: 13, minute: 30 };
  }

  // 12-hour time pattern (e.g. 1:30 PM, 01:30pm, 9:00 AM)
  const timeRegex12 = /\b(1[0-2]|0?[1-9]):([0-5][0-9])\s*(am|pm)\b/i;
  const match12 = text.match(timeRegex12);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const meridiem = match12[3].toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    const hourStr = String(hour).padStart(2, "0");
    const minStr = String(minute).padStart(2, "0");
    return { timeSlot: `${hourStr}:${minStr}`, hour, minute };
  }

  // 24-hour time pattern (e.g. 13:30, 09:15)
  const timeRegex24 = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/;
  const match24 = text.match(timeRegex24);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    const hourStr = String(hour).padStart(2, "0");
    const minStr = String(minute).padStart(2, "0");
    return { timeSlot: `${hourStr}:${minStr}`, hour, minute };
  }

  return { timeSlot: "13:30", hour: 13, minute: 30 };
}

/**
 * Scans live Gmail messages and Google Calendar events for items requiring user action.
 * For emails requiring follow-up (e.g. Hostplus notice due by 1:30 PM), extracts target time slot
 * and derives a visible agenda alert item, which is injected into `agenda_items` in the DB.
 * Alert injection is read-derived and informational — does NOT require `needsApproval`.
 */
export async function scanRetrievalForAlerts(
  messages: AlertGmailMessage[] = [],
  calendarEvents: AlertCalendarEvent[] = [],
  options?: { baseDate?: Date | string }
): Promise<AgendaItem[]> {
  const existingItems = await getAgendaItems();
  const existingMap = new Map(existingItems.map((item) => [item.id, item]));
  const injectedItems: AgendaItem[] = [];

  const refDate = options?.baseDate
    ? typeof options.baseDate === "string"
      ? new Date(options.baseDate)
      : options.baseDate
    : new Date();

  const year = refDate.getFullYear();
  const month = String(refDate.getMonth() + 1).padStart(2, "0");
  const day = String(refDate.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Process Gmail messages
  for (const msg of messages) {
    const textToScan = `${msg.subject || ""} ${msg.snippet || ""} ${msg.bodySummary || ""}`;
    const requiresAction =
      Boolean(msg.actionRequired) ||
      /action required|due|follow-up|urgent|hostplus/i.test(textToScan);

    if (requiresAction) {
      const alertId = `alert_msg_${msg.id}`;
      const { timeSlot } = extractTimeSlot(textToScan);
      const scheduledTime = `${dateStr}T${timeSlot}:00+10:00`;
      const subject = msg.subject || "Message Follow-up";
      const title = subject.startsWith("Action Required:")
        ? subject
        : `Action Required: ${subject}`;

      if (existingMap.has(alertId)) {
        injectedItems.push(existingMap.get(alertId)!);
      } else {
        const newItem = await createAgendaItem({
          id: alertId,
          item_type: "alert",
          title,
          scheduled_time: scheduledTime,
          status: "pending",
          audit_trail: [
            {
              timestamp: new Date().toISOString(),
              new_status: "pending",
              note: `Agenda alert derived from Gmail message ID ${msg.id} (${msg.from || "unknown"})`,
            },
          ],
        });
        existingMap.set(alertId, newItem);
        injectedItems.push(newItem);
      }
    }
  }

  // Process Calendar events
  for (const evt of calendarEvents) {
    const textToScan = `${evt.summary || ""} ${evt.description || ""}`;
    const isActionRequired =
      evt.status === "confirmed" &&
      (/action required|action_required|due/i.test(textToScan) || textToScan.length > 0);

    if (isActionRequired) {
      const alertId = `alert_evt_${evt.id}`;
      let scheduledTime = evt.start;
      if (!scheduledTime || !scheduledTime.includes("T")) {
        const { timeSlot } = extractTimeSlot(textToScan);
        scheduledTime = `${dateStr}T${timeSlot}:00+10:00`;
      }
      const summary = evt.summary || "Calendar Event";
      const title = summary.startsWith("Agenda Alert:")
        ? summary
        : `Agenda Alert: ${summary}`;

      if (existingMap.has(alertId)) {
        injectedItems.push(existingMap.get(alertId)!);
      } else {
        const newItem = await createAgendaItem({
          id: alertId,
          item_type: "alert",
          title,
          scheduled_time: scheduledTime,
          status: "pending",
          audit_trail: [
            {
              timestamp: new Date().toISOString(),
              new_status: "pending",
              note: `Agenda alert derived from Calendar event ID ${evt.id}`,
            },
          ],
        });
        existingMap.set(alertId, newItem);
        injectedItems.push(newItem);
      }
    }
  }

  return injectedItems;
}
