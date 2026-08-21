/**
 * Serverless Google OAuth Token Manager and REST Helper.
 * Handles access token resolution via environment variables & refresh token flow,
 * eliminating flat-file filesystem dependencies in serverless edge runtimes.
 */

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
];

export interface GoogleAuthStatus {
  authenticated: boolean;
  accessToken?: string;
  authUrl?: string;
  error?: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export function getGoogleAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/v1/auth/callback";
  const scope = encodeURIComponent(GOOGLE_SCOPES.join(" "));

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    clientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
}

export async function getGoogleAccessToken(): Promise<GoogleAuthStatus> {
  // 1. Direct environment variable token override
  const directToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN || process.env.GOOGLE_OAUTH_TOKEN || process.env.GMAIL_TOKEN;
  if (directToken) {
    return { authenticated: true, accessToken: directToken };
  }

  // 2. Check cached token in memory
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) {
    return { authenticated: true, accessToken: cachedAccessToken.token };
  }

  // 3. Refresh token flow via Google OAuth Token endpoint
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return {
      authenticated: false,
      authUrl: getGoogleAuthUrl(),
      error: "Google Calendar authorization required",
    };
  }


  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        authenticated: false,
        authUrl: getGoogleAuthUrl(),
        error: errorData.error_description || `OAuth token refresh failed with status ${response.status}`,
      };
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;

    if (accessToken) {
      cachedAccessToken = {
        token: accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      return { authenticated: true, accessToken };
    }

    return {
      authenticated: false,
      authUrl: getGoogleAuthUrl(),
      error: "No access token returned in OAuth token refresh response.",
    };
  } catch (err: any) {
    return {
      authenticated: false,
      authUrl: getGoogleAuthUrl(),
      error: err.message || "Failed to execute OAuth token refresh network request.",
    };
  }
}

/**
 * Fetch Google Calendar events using fresh serverless OAuth token.
 */
export async function fetchLiveCalendarEvents(options?: {
  timeMin?: string;
  timeMax?: string;
  calendarId?: string;
}): Promise<{
  status: "success" | "auth_required" | "error";
  events?: any[];
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

  const calendarId = options?.calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
  const params = new URLSearchParams();
  if (options?.timeMin) params.set("timeMin", options.timeMin);
  if (options?.timeMax) params.set("timeMax", options.timeMax);
  params.set("singleEvents", "true");
  params.set("orderBy", "startTime");

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events${queryStr}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
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
      events: data.items || [],
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message || "Failed to connect to Google Calendar service",
    };
  }
}

/**
 * Create a live Google Calendar event.
 */
export async function createLiveCalendarEvent(eventData: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  calendarId?: string;
}): Promise<{
  status: "success" | "auth_required" | "error";
  event?: any;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      message: auth.error || "Google Calendar authorization required",
    };
  }

  const calendarId = eventData.calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  const body = {
    summary: eventData.summary,
    description: eventData.description || "",
    location: eventData.location || "",
    start: {
      dateTime: eventData.start.includes("T") ? eventData.start : `${eventData.start}T09:00:00+10:00`,
      timeZone: "Australia/Melbourne",
    },
    end: {
      dateTime: eventData.end.includes("T") ? eventData.end : `${eventData.end}T10:00:00+10:00`,
      timeZone: "Australia/Melbourne",
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { status: "error", message: `Google Calendar API error: ${res.statusText}` };
    }

    const created = await res.json();
    return { status: "success", event: created };
  } catch (err: any) {
    return { status: "error", message: err.message || "Failed to create Google Calendar event" };
  }
}

/**
 * Update an existing live Google Calendar event.
 */
export async function updateLiveCalendarEvent(eventData: {
  eventId: string;
  summary?: string;
  description?: string;
  start?: string;
  end?: string;
  location?: string;
  calendarId?: string;
}): Promise<{
  status: "success" | "auth_required" | "error";
  event?: any;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      message: auth.error || "Google Calendar authorization required",
    };
  }

  const calendarId = eventData.calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventData.eventId)}`;

  const body: any = {};
  if (eventData.summary !== undefined) body.summary = eventData.summary;
  if (eventData.description !== undefined) body.description = eventData.description;
  if (eventData.location !== undefined) body.location = eventData.location;
  if (eventData.start) {
    body.start = {
      dateTime: eventData.start.includes("T") ? eventData.start : `${eventData.start}T09:00:00+10:00`,
      timeZone: "Australia/Melbourne",
    };
  }
  if (eventData.end) {
    body.end = {
      dateTime: eventData.end.includes("T") ? eventData.end : `${eventData.end}T10:00:00+10:00`,
      timeZone: "Australia/Melbourne",
    };
  }

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { status: "error", message: `Google Calendar API error: ${res.statusText}` };
    }

    const updated = await res.json();
    return { status: "success", event: updated };
  } catch (err: any) {
    return { status: "error", message: err.message || "Failed to update Google Calendar event" };
  }
}

/**
 * Delete a live Google Calendar event.
 */
export async function deleteLiveCalendarEvent(eventId: string, calendarId?: string): Promise<{
  status: "success" | "auth_required" | "error";
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      message: auth.error || "Google Calendar authorization required",
    };
  }

  const calId = calendarId || process.env.GOOGLE_CALENDAR_ID || "primary";
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events/${encodeURIComponent(eventId)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (!res.ok && res.status !== 204) {
      return { status: "error", message: `Google Calendar API error: ${res.statusText}` };
    }

    return { status: "success" };
  } catch (err: any) {
    return { status: "error", message: err.message || "Failed to delete Google Calendar event" };
  }
}


/**
 * Fetch Gmail messages using fresh serverless OAuth token.
 */
export async function fetchLiveGmailMessages(options?: {
  query?: string;
  maxResults?: number;
}): Promise<{
  status: "success" | "auth_required" | "error";
  messages?: any[];
  authUrl?: string;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Gmail authorization required",
    };
  }

  const maxResults = options?.maxResults || 10;
  const params = new URLSearchParams({ maxResults: String(maxResults) });
  if (options?.query) params.set("q", options.query);

  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        status: "auth_required",
        authUrl: getGoogleAuthUrl(),
        message: "Gmail access token expired or invalid",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        message: `Gmail API error: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      status: "success",
      messages: data.messages || [],
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message || "Failed to connect to Gmail service",
    };
  }
}

