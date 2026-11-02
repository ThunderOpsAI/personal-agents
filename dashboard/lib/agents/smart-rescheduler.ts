import { getAgendaItems, rescheduleAgendaItem, createAgendaItem } from "../db";
import { selectWashingDays } from "../agenda-engine";

export interface RescheduleProposal {
  taskId: string;
  taskTitle: string;
  originalTime: string;
  suggestedTime: string;
  reason: string;
}

export interface FlareTriageProposal {
  painScore: number;
  isSevereFlare: boolean;
  recommendedMode: "Low-Spoon Mode" | "Standard Mode";
  deferredTasks: RescheduleProposal[];
  protectedProtocols: string[];
  adaptedYogaRoutine: string;
  agendaAlertText: string;
}

/**
 * Standard reschedule proposal for task conflicts.
 */
export async function proposeReschedule(tasks: any[], schedule: any[]): Promise<RescheduleProposal[]> {
  const proposals: RescheduleProposal[] = [];

  for (const task of tasks) {
    if (!task.scheduled_time) continue;
    const taskDate = new Date(task.scheduled_time);
    
    // Check if task falls inside any busy schedule block
    const conflict = schedule.find((slot: any) => {
      const slotStart = new Date(slot.start || slot.scheduled_time);
      const slotEnd = new Date(slot.end || new Date(slotStart.getTime() + 60 * 60 * 1000));
      return taskDate >= slotStart && taskDate < slotEnd;
    });

    if (conflict) {
      // Suggest 2 hours later
      const suggestedDate = new Date(taskDate.getTime() + 2 * 60 * 60 * 1000);
      proposals.push({
        taskId: task.id,
        taskTitle: task.title,
        originalTime: task.scheduled_time,
        suggestedTime: suggestedDate.toISOString(),
        reason: `Conflicts with scheduled event: ${conflict.title || conflict.summary || "Calendar Event"}`
      });
    }
  }

  return proposals;
}

/**
 * Analyzes active pain score and pending agenda items to generate a Low-Spoon Flare Triage proposal.
 * Deferrable tasks are postponed to non-washing days while preserving medical protocols.
 */
export async function proposeFlareTriage(
  painScore: number,
  painAreas: string[] = ["lumbar"],
  options?: { baseDate?: Date | string }
): Promise<FlareTriageProposal> {
  const isSevereFlare = painScore >= 7;
  const refDate = options?.baseDate ? new Date(options.baseDate) : new Date();
  const datePrefix = options?.baseDate
    ? (typeof options.baseDate === "string" && options.baseDate.includes("T")
        ? options.baseDate.split("T")[0]
        : new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(refDate))
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" }).format(refDate);

  if (!isSevereFlare) {
    return {
      painScore,
      isSevereFlare: false,
      recommendedMode: "Standard Mode",
      deferredTasks: [],
      protectedProtocols: ["Daily Mobility", "Routine Protocols"],
      adaptedYogaRoutine: "Standard Adaptive Flow",
      agendaAlertText: "Pain score within manageable baseline."
    };
  }

  // Fetch pending agenda items for today
  const items = await getAgendaItems().catch(() => []);
  const todayPending = items.filter((item: any) => {
    if (item.status !== "pending") return false;
    const itemDate = item.scheduled_time ? item.scheduled_time.split("T")[0] : "";
    return itemDate === datePrefix || !item.scheduled_time;
  });

  // Check Wangaratta washing days to protect optimal laundry days
  const washingForecast: any = await selectWashingDays().catch(() => ({ status: "unavailable", days: [] }));
  const washingDays = new Set((washingForecast.days || []).map((d: any) => d.date));

  // Determine safe deferral date (tomorrow or day after, avoiding clash with heavy washing if possible)
  const tomorrow = new Date(refDate.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const dayAfter = new Date(refDate.getTime() + 48 * 60 * 60 * 1000);
  const dayAfterStr = dayAfter.toISOString().split("T")[0];

  const targetDeferralDateStr = washingDays.has(tomorrowStr) ? dayAfterStr : tomorrowStr;

  const deferredTasks: RescheduleProposal[] = [];
  const protectedProtocols: string[] = [];

  for (const item of todayPending) {
    const titleLower = (item.title || "").toLowerCase();
    const type = (item.item_type || "").toLowerCase();

    // Critical protected health protocols: do NOT defer
    if (
      type === "hydrotherapy" ||
      type === "medication" ||
      titleLower.includes("hydrotherapy") ||
      titleLower.includes("medication") ||
      titleLower.includes("dr ") ||
      titleLower.includes("doctor") ||
      titleLower.includes("consult") ||
      titleLower.includes("court") ||
      titleLower.includes("solicitor")
    ) {
      protectedProtocols.push(item.title);
      continue;
    }

    // Deferrable tasks: administrative, shopping, quotes, tickets, general follow-ups
    const isDeferrable =
      type === "task" ||
      titleLower.includes("quote") ||
      titleLower.includes("ticket") ||
      titleLower.includes("stickeroo") ||
      titleLower.includes("studentconnect") ||
      titleLower.includes("verify") ||
      titleLower.includes("reply to") ||
      titleLower.includes("clean") ||
      titleLower.includes("organize") ||
      titleLower.includes("review");

    if (isDeferrable) {
      const origTime = item.scheduled_time || `${datePrefix}T14:00:00+11:00`;
      const timePart = origTime.includes("T") ? origTime.split("T")[1] : "14:00:00+11:00";
      const newScheduledTime = `${targetDeferralDateStr}T${timePart}`;

      deferredTasks.push({
        taskId: item.id,
        taskTitle: item.title,
        originalTime: origTime,
        suggestedTime: newScheduledTime,
        reason: `Low-Spoon Mode triage: acute pain flare (${painScore}/10). Deferring non-urgent task to protect recovery.`
      });
    } else {
      protectedProtocols.push(item.title);
    }
  }

  const alertText = `[Low-Spoon Flare Triage] Acute pain flare (${painScore}/10) active. Proposing deferral of ${deferredTasks.length} non-urgent task(s) to ${targetDeferralDateStr}. Yoga adapted to Supine Restorative Decompression.`;

  return {
    painScore,
    isSevereFlare: true,
    recommendedMode: "Low-Spoon Mode",
    deferredTasks,
    protectedProtocols,
    adaptedYogaRoutine: "Supported Child's Pose & Supine Restorative Decompression",
    agendaAlertText: alertText
  };
}

/**
 * Commits the Low-Spoon Flare Triage proposal:
 * Reschedules deferred tasks in the database and creates an Agenda Alert item.
 */
export async function executeFlareTriage(
  proposal: FlareTriageProposal
): Promise<{ success: boolean; rescheduledCount: number; alertId?: string }> {
  if (!proposal.isSevereFlare || proposal.deferredTasks.length === 0) {
    return { success: true, rescheduledCount: 0 };
  }

  let rescheduledCount = 0;
  for (const task of proposal.deferredTasks) {
    try {
      await rescheduleAgendaItem(task.taskId, task.suggestedTime, { title: task.taskTitle });
      rescheduledCount++;
    } catch (err) {
      console.error(`[Smart Rescheduler] Failed to reschedule task ${task.taskId}:`, err);
    }
  }

  // Create an explicit Alert card in today's agenda
  const alertId = `alert_flare_triage_${Date.now()}`;
  await createAgendaItem({
    id: alertId,
    item_type: "alert",
    title: proposal.agendaAlertText,
    scheduled_time: new Date().toISOString(),
    status: "pending",
    audit_trail: [
      {
        timestamp: new Date().toISOString(),
        new_status: "pending",
        note: `Autonomous Low-Spoon Triage executed for pain score ${proposal.painScore}/10 (${rescheduledCount} tasks deferred).`
      }
    ]
  }).catch(console.error);

  return {
    success: true,
    rescheduledCount,
    alertId
  };
}
