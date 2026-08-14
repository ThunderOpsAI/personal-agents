import { NextResponse } from "next/server";
import { fetchLiveCalendarEvents, getGoogleAuthUrl } from "../../../../../lib/google-auth";

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

