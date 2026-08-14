import { NextResponse } from "next/server";
import { fetchLiveCalendarEvents, fetchLiveGmailMessages } from "../../../../../lib/google-auth";
import { scanRetrievalForAlerts } from "../../../../../lib/alert-scanner";
import { getMelbourneHour, isRetrievalWindow } from "../../../../../lib/retrieval-schedule";

export async function POST(request: Request) {
  try {
    let force = true;
    if (request && request.url) {
      const { searchParams } = new URL(request.url);
      const cronParam = searchParams.get("cron");
      const forceParam = searchParams.get("force");

      if (cronParam === "true" && forceParam !== "true") {
        const inWindow = isRetrievalWindow();
        if (!inWindow) {
          return NextResponse.json({
            status: "skipped",
            reason: "Current time is outside the 06:00 / 14:00 Australia/Melbourne retrieval window.",
            melbourne_hour: getMelbourneHour(),
            timezone: "Australia/Melbourne",
          });
        }
      }
    }

    const calendarRes = await fetchLiveCalendarEvents({});
    const calendarEvents = calendarRes.events || [];

    const gmailRes = await fetchLiveGmailMessages({ maxResults: 10 });
    const gmailMessages = gmailRes.messages || [];

    const injectedAlerts = await scanRetrievalForAlerts(gmailMessages, calendarEvents);

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      timezone: "Australia/Melbourne",
      melbourne_hour: getMelbourneHour(),
      scanned_gmail_count: gmailMessages.length,
      scanned_calendar_count: calendarEvents.length,
      injected_alerts: injectedAlerts,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: "Failed to execute retrieval scan" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}





