import { NextResponse } from "next/server";
import { createAgendaItem, getAgendaItems, getDbStatus, updateAgendaItemStatus } from "../../../../lib/db";
import { AgendaItemStatus } from "../../../../lib/schema";
import { ensureStandingTasks, ensureDailyStandingProtocols } from "../../../../lib/agenda-engine";
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





    // 2. Fetch live Google Calendar events within the view window
    let timeMin: string | undefined;
    let timeMax: string | undefined;


    if (view === "daily") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      timeMin = startOfDay.toISOString();
      timeMax = endOfDay.toISOString();
    } else if (view === "weekly") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      timeMin = startOfWeek.toISOString();
      timeMax = endOfWeek.toISOString();
    } else if (view === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      timeMin = startOfMonth.toISOString();
      timeMax = endOfMonth.toISOString();
    }

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

    const weekly = calendarEvents.map((e: any) => {
      const d = parseEventDate(e);
      const dayStr = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
      return {
        date: d.toISOString().split("T")[0],
        day: dayStr,
        title: e.summary || e.title || "Calendar Event",
        type: "calendar",
      };
    });

    const monthly = calendarEvents.map((e: any) => {
      const d = parseEventDate(e);
      const dateStr = d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "Australia/Melbourne" });
      return {
        date: dateStr,
        title: e.summary || e.title || "Event",
        type: "calendar",
      };
    });


    return NextResponse.json({
      status: "success",
      view,
      items,
      daily,
      weekly,
      monthly,
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
