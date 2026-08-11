import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  const token = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN || process.env.GOOGLE_OAUTH_TOKEN;
  const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

  if (!token) {
    return NextResponse.json(
      { status: "auth_required", message: "Google Calendar authorization required" },
      { status: 401 }
    );
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { status: "auth_required", message: "Google Calendar authorization required" },
        { status: res.status }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { status: "error", message: `Google Calendar API error: ${res.statusText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      status: "success",
      events: data.items || [],
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Failed to connect to Google Calendar service" },
      { status: 500 }
    );
  }
}
