import { NextResponse } from "next/server";
import { getCalendarEvents } from "../../../../../../agent/tools/calendar";
import { getGmailMessages } from "../../../../../../agent/tools/gmail";
import { scanRetrievalForAlerts } from "../../../../../../agent/alert_scanner";

export async function POST() {
  try {
    const calendarRes = await getCalendarEvents.execute({});
    const calendarEvents = calendarRes.events || [];

    const gmailRes = await getGmailMessages.execute({});
    const gmailMessages = gmailRes.messages || [];

    const injectedAlerts = await scanRetrievalForAlerts(gmailMessages, calendarEvents);

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      timezone: "Australia/Melbourne",
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

export async function GET() {
  return POST();
}
