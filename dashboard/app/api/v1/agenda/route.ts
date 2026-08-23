import { NextResponse } from "next/server";
import { createAgendaItem, getAgendaItems, getDbStatus, updateAgendaItemStatus, rescheduleAgendaItem } from "../../../../lib/db";
import { AgendaItemStatus } from "../../../../lib/schema";
import {
  ensureStandingTasks,
  ensureDailyStandingProtocols,
  calculateHydrotherapySessions,
  selectWashingDays
} from "../../../../lib/agenda-engine";
import { fetchLiveCalendarEvents, getGoogleAuthUrl } from "../../../../lib/google-auth";

export async function GET(request: Request) {
  try {
    const url = request && request.url ? new URL(request.url) : null;
    const view = url?.searchParams.get("view") || "daily";

    // 1. Fetch persistent agenda items from Neon / SQLite
    const rawItems = await getAgendaItems();
    const now = new Date();
    const items = rawItems;
    const dbStatus = getDbStatus();





    // 2. Fetch live Google Calendar events spanning the current and next month
    const startOfWindow = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfWindow.setHours(0, 0, 0, 0);
    const endOfWindow = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    endOfWindow.setHours(23, 59, 59, 999);
    const timeMin = startOfWindow.toISOString();
    const timeMax = endOfWindow.toISOString();

    let calendarStatus: "connected" | "auth_required" | "error" = "connected";
    let calendarEvents: any[] = [];
    let authUrl: string | undefined;

    try {
      const calendarResult = await fetchLiveCalendarEvents({ timeMin, timeMax });
      if (calendarResult.status === "auth_required") {
        calendarStatus = "auth_required";
        authUrl = calendarResult.authUrl || getGoogleAuthUrl();
      } else if (calendarResult.status === "success") {
        calendarEvents = calendarResult.events || [];
      } else {
        calendarStatus = "error";
      }
    } catch {
      calendarStatus = "auth_required";
      authUrl = getGoogleAuthUrl();
    }

    const standingProcessed = ensureStandingTasks(ensureDailyStandingProtocols(rawItems, now), now);
    standingProcessed.sort((a, b) => {
      const timeA = new Date(a.scheduled_time).getTime();
      const timeB = new Date(b.scheduled_time).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });

    const daily = standingProcessed.map((item) => {
      const d = new Date(item.scheduled_time);
      const timeStr = isNaN(d.getTime())
        ? "09:00 AM"
        : d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" });
      let choices: string[] | undefined;
      if (item.item_type === "yoga") choices = ["Hip Flow", "Lumbar Core", "Shoulder Rehab"];
      if (item.item_type === "learning") choices = ["Neuroplasticity", "Myofascial Release", "Breathing Mechanics"];
      return {
        id: item.id,
        title: item.title,
        time: timeStr,
        item_type: item.item_type,
        status: item.status,
        choices,
      };
    });

    const parseEventDate = (e: any): Date => {
      const raw = typeof e.start === "string" ? e.start : e.start?.dateTime || e.start?.date || e.scheduled_time;
      if (!raw) return now;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? now : d;
    };

    // Calculate Hydrotherapy sessions for the week (targets 3 sessions)
    const hydroSessions = calculateHydrotherapySessions(0, now);
    const hydroItems = hydroSessions.map((s) => {
      const d = new Date(s.date);
      const dayStr = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
      return {
        id: `hydro_${s.date}`,
        date: s.date,
        day: dayStr,
        title: "Hydrotherapy Pool Rehabilitation (Target: 3/week)",
        type: "hydrotherapy",
        time: "10:30 AM",
        source: "rumble_schedule",
        location: "Wangaratta Hydro Pool",
        description: "Target 3 hydrotherapy sessions per week. Rumble-selected optimal recovery session."
      };
    });

    // Calculate optimal Washing Days from live Wangaratta weather
    let washingItems: any[] = [];
    try {
      const washingResult = await selectWashingDays();
      if (washingResult && Array.isArray(washingResult)) {
        washingItems = washingResult.slice(0, 2).map((w) => {
          const d = new Date(w.date);
          const dayStr = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
          return {
            id: `wash_${w.date}`,
            date: w.date,
            day: dayStr,
            title: `Weather-Optimized Washing (${w.precipitationProbability}% precip)`,
            type: "washing",
            time: "01:00 PM",
            source: "open_meteo",
            description: `Optimal drying window selected from live Wangaratta forecast with ${w.precipitationProbability}% precipitation probability.`
          };
        });
      }
    } catch {}

    // Map DB calendar events and appointments
    const dbCalEvents = rawItems
      .filter((i) => (i.item_type === "calendar_event" || i.item_type === "appointment") && i.status !== "dismissed")
      .map((i) => {
        const d = parseEventDate(i);
        const dayStr = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
        const timeStr = d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" });
        return {
          id: i.id,
          date: d.toISOString().split("T")[0],
          day: dayStr,
          title: i.title,
          type: "calendar",
          time: timeStr,
          source: "local_calendar",
          description: "Scheduled calendar event."
        };
      });

    const googleWeekly = calendarEvents.map((e: any) => {
      const d = parseEventDate(e);
      const dayStr = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
      const timeStr = d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", timeZone: "Australia/Melbourne" });
      return {
        id: e.id,
        date: d.toISOString().split("T")[0],
        day: dayStr,
        title: e.summary || e.title || "Calendar Event",
        type: "calendar",
        time: timeStr,
        location: e.location || "",
        description: e.description || "",
        source: "google_calendar",
      };
    });

    const weekly = [...googleWeekly, ...dbCalEvents, ...hydroItems, ...washingItems];
    weekly.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const googleMonthly = calendarEvents.map((e: any) => {
      const d = parseEventDate(e);
      const dateStr = d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
      return {
        id: e.id,
        date: dateStr,
        title: e.summary || e.title || "Event",
        type: "calendar",
        location: e.location || "",
        description: e.description || "",
        source: "google_calendar",
      };
    });

    const monthlyStanding = [
      {
        id: "monthly_spec_rev",
        date: `${now.getDate()} ${now.toLocaleDateString("en-AU", { month: "short" })}`,
        title: "Physiotherapy & Rehab Milestone Review",
        type: "medical",
        source: "rumble_schedule",
        description: "Monthly review of functional mobility, pain logs, and rehabilitation trajectory."
      },
      {
        id: "monthly_soul_syn",
        date: `${Math.min(now.getDate() + 7, 28)} ${now.toLocaleDateString("en-AU", { month: "short" })}`,
        title: "SOUL Synthesis: Monthly Rehabilitation Learnings",
        type: "learning",
        source: "rumble_schedule",
        description: "Synthesized monthly rehabilitation insights and adaptive preference updates."
      }
    ];

    const monthly = [...googleMonthly, ...monthlyStanding, ...weekly.map(w => ({
      id: w.id,
      date: new Date(w.date).toLocaleDateString("en-AU", { day: "numeric", month: "short" }),
      title: w.title,
      type: w.type,
      location: w.location || "",
      description: w.description || "",
      source: w.source
    }))];
    // De-duplicate monthly items by id
    const monthlyMap = new Map();
    monthly.forEach(m => { if (!monthlyMap.has(m.id)) monthlyMap.set(m.id, m); });
    const uniqueMonthly = Array.from(monthlyMap.values());

    return NextResponse.json({
      status: "success",
      view,
      items,
      daily,
      weekly,
      monthly: uniqueMonthly,
      calendar_status: calendarStatus,
      calendar_events: calendarEvents,
      ...(authUrl ? { authUrl } : {}),
      db_status: dbStatus,
    });
  } catch (error: any) {
    console.error("[AGENDA API ERROR]", error);
    return NextResponse.json(
      { status: "error", error: error?.message || "Failed to retrieve agenda items" },
      { status: 500 }
    );
  }
}




export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ status: "error", error: "Payload must be an object" }, { status: 400 });
  }


  if (body.action === "reschedule" && body.id && body.new_date) {
    try {
      const updated = await rescheduleAgendaItem(body.id, body.new_date);
      if (!updated) {
        return NextResponse.json({ status: "error", error: "Agenda item not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", item: updated });
    } catch (error) {
      return NextResponse.json({ status: "error", error: "Failed to reschedule item" }, { status: 500 });
    }
  }

  if (body.action === "update_status" || (body.id && body.status && !body.title)) {
    const { id, status, note } = body;
    if (!id || !status) {
      return NextResponse.json(
        { status: "error", error: "id and status are required for status update" },
        { status: 400 }
      );
    }

    try {
      const updated = await updateAgendaItemStatus(id, status as AgendaItemStatus, note);
      if (!updated) {
        return NextResponse.json({ status: "error", error: "Agenda item not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", item: updated });
    } catch (error) {
      return NextResponse.json({ status: "error", error: "Failed to update agenda item status" }, { status: 500 });
    }
  }

  const { title, item_type, scheduled_time, status, audit_trail, id } = body;
  if (!title || !item_type || !scheduled_time) {
    return NextResponse.json(
      { status: "error", error: "title, item_type, and scheduled_time are required" },
      { status: 400 }
    );
  }

  try {
    const created = await createAgendaItem({
      id,
      title,
      item_type,
      scheduled_time,
      status,
      audit_trail,
    });
    return NextResponse.json({ status: "success", item: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to create agenda item" }, { status: 500 });
  }
}
