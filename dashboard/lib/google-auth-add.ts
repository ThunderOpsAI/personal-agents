import { getGoogleAccessToken, getGoogleAuthUrl } from "./google-auth";

export async function addLiveCalendarEvent(eventData: {
  summary: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  calendarId?: string;
}): Promise<{
  status: "success" | "auth_required" | "error";
  event?: any;
  authUrl?: string;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Google Calendar authorization required",
    };
  }

  const calendarId = eventData.calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: eventData.summary,
        start: {
          dateTime: eventData.start.dateTime,
          timeZone: eventData.start.timeZone || "Australia/Melbourne",
        },
        end: {
          dateTime: eventData.end.dateTime,
          timeZone: eventData.end.timeZone || "Australia/Melbourne",
        }
      }),
    });

    if (res.status === 401 || res.status === 403) {
      return {
        status: "auth_required",
        authUrl: getGoogleAuthUrl(),
        message: "Google Calendar access token expired or invalid",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        message: `Google Calendar API error: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      status: "success",
      event: data,
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message || "Failed to connect to Google Calendar service",
    };
  }
}
