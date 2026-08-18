import { NextResponse } from "next/server";
import {
  fetchLiveCalendarEvents,
  createLiveCalendarEvent,
  updateLiveCalendarEvent,
  deleteLiveCalendarEvent,
  getGoogleAuthUrl
} from "../../../../../lib/google-auth";
import { createAgendaItem, updateAgendaItemStatus } from "../../../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get("timeMin") || undefined;
  const timeMax = searchParams.get("timeMax") || undefined;

  const result = await fetchLiveCalendarEvents({ timeMin, timeMax });

  if (result.status === "auth_required") {
    return NextResponse.json(
      {
        status: "auth_required",
        message: result.message || "Google Calendar authorization required",
        authUrl: result.authUrl || getGoogleAuthUrl(),
      },
      { status: 401 }
    );
  }

  if (result.status === "error") {
    return NextResponse.json(
      { status: "error", message: result.message || "Failed to connect to Google Calendar service" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: "success",
    events: result.events || [],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { summary, description, start, end, location } = body;

    if (!summary || !start || !end) {
      return NextResponse.json(
        { status: "error", message: "summary, start, and end time are required." },
        { status: 400 }
      );
    }

    // Attempt live Google Calendar creation
    const liveResult = await createLiveCalendarEvent({
      summary,
      description,
      start,
      end,
      location,
    });

    // Also persist as an agenda item in DB for seamless sync
    const eventId = liveResult.event?.id || `cal_evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await createAgendaItem({
      id: eventId,
      item_type: "calendar_event",
      title: summary,
      scheduled_time: start.includes("T") ? start : `${start}T09:00:00+10:00`,
      status: "pending",
    }).catch(() => {});

    return NextResponse.json({
      status: "success",
      eventId,
      event: liveResult.event || {
        id: eventId,
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        location,
      },
      source: liveResult.status === "success" ? "google_calendar" : "local_calendar",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to create event" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { eventId, summary, description, start, end, location } = body;

    if (!eventId) {
      return NextResponse.json(
        { status: "error", message: "eventId is required for updating." },
        { status: 400 }
      );
    }

    const liveResult = await updateLiveCalendarEvent({
      eventId,
      summary,
      description,
      start,
      end,
      location,
    });

    return NextResponse.json({
      status: "success",
      eventId,
      event: liveResult.event || {
        id: eventId,
        summary,
        description,
        start: start ? { dateTime: start } : undefined,
        end: end ? { dateTime: end } : undefined,
        location,
      },
      source: liveResult.status === "success" ? "google_calendar" : "local_calendar",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let eventId = searchParams.get("eventId");

    if (!eventId) {
      const body = await request.json().catch(() => ({}));
      eventId = body.eventId;
    }

    if (!eventId) {
      return NextResponse.json(
        { status: "error", message: "eventId is required for deletion." },
        { status: 400 }
      );
    }

    await deleteLiveCalendarEvent(eventId).catch(() => {});
    await updateAgendaItemStatus(eventId, "dismissed").catch(() => {});

    return NextResponse.json({
      status: "success",
      eventId,
      message: "Event deleted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "error", message: err.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}

