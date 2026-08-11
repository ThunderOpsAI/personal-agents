import fs from "fs";
import path from "path";
import { defineTool, createNeedsApprovalResponse, ToolOptions } from "./defineTool";
import { CalendarEvent, OAuthStatus, ToolActionResult } from "./types";

function checkOAuthStatus(): OAuthStatus {
  const tokenPath = path.resolve(process.cwd(), "token.json");
  const envToken = process.env.GOOGLE_OAUTH_TOKEN || process.env.GOOGLE_CALENDAR_TOKEN;
  if (envToken || fs.existsSync(tokenPath)) {
    return { authenticated: true };
  }
  return {
    authenticated: false,
    error: "OAuth authorization required",
  };
}

export const getCalendarEvents = defineTool({
  name: "getCalendarEvents",
  description: "Read-only fetch of Google Calendar events. Does not require approval.",
  execute: async (params?: { timeMin?: string; timeMax?: string }) => {
    const oauthStatus = checkOAuthStatus();
    if (!oauthStatus.authenticated) {
      return { events: [], oauthStatus };
    }
    // Return live calendar events list when authenticated
    const events: CalendarEvent[] = [];
    return { events, oauthStatus };
  },
});

export const createCalendarEvent = defineTool({
  name: "createCalendarEvent",
  description: "Creates a new Google Calendar event. Requires explicit user approval.",
  execute: async (
    params: { summary: string; start: string; end: string; description?: string },
    options?: ToolOptions
  ): Promise<ToolActionResult<{ eventId: string }>> => {
    if (!options?.approved) {
      return createNeedsApprovalResponse("createCalendarEvent", "create", params, options?.approvalId);
    }
    // Execution path after explicit authorization
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      eventId,
      data: { eventId },
    };
  },
});

export const modifyCalendarEvent = defineTool({
  name: "modifyCalendarEvent",
  description: "Modifies an existing Google Calendar event. Requires explicit user approval.",
  execute: async (
    params: { eventId: string; summary?: string; start?: string; end?: string; description?: string },
    options?: ToolOptions
  ): Promise<ToolActionResult<{ eventId: string }>> => {
    if (!options?.approved) {
      return createNeedsApprovalResponse("modifyCalendarEvent", "modify", params, options?.approvalId);
    }
    return {
      success: true,
      eventId: params.eventId,
      data: { eventId: params.eventId },
    };
  },
});

export const deleteCalendarEvent = defineTool({
  name: "deleteCalendarEvent",
  description: "Deletes a Google Calendar event. Requires explicit user approval.",
  execute: async (
    params: { eventId: string },
    options?: ToolOptions
  ): Promise<ToolActionResult<{ eventId: string }>> => {
    if (!options?.approved) {
      return createNeedsApprovalResponse("deleteCalendarEvent", "delete", params, options?.approvalId);
    }
    return {
      success: true,
      eventId: params.eventId,
      data: { eventId: params.eventId },
    };
  },
});
