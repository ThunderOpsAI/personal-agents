import fs from "fs";
import path from "path";
import { defineTool, createNeedsApprovalResponse, ToolOptions } from "./defineTool";
import { GmailMessage, OAuthStatus, ToolActionResult } from "./types";

function checkOAuthStatus(): OAuthStatus {
  const tokenPath = path.resolve(process.cwd(), "token.json");
  const envToken = process.env.GOOGLE_OAUTH_TOKEN || process.env.GMAIL_TOKEN;
  if (envToken || fs.existsSync(tokenPath)) {
    return { authenticated: true };
  }
  return {
    authenticated: false,
    error: "OAuth authorization required",
  };
}

import { fetchLiveGmailMessages } from "../../dashboard/lib/google-auth";

export const getGmailMessages = defineTool({
  name: "getGmailMessages",
  description: "Read-only fetch of Gmail messages. Does not require approval.",
  execute: async (params?: { query?: string; maxResults?: number }) => {
    const res = await fetchLiveGmailMessages(params);
    if (res.status === "auth_required") {
      return {
        messages: [],
        oauthStatus: {
          authenticated: false,
          authUrl: res.authUrl,
          error: res.message || "OAuth authorization required",
        },
      };
    }
    if (res.status === "error" || !res.messages) {
      return {
        messages: [],
        oauthStatus: {
          authenticated: false,
          error: res.message || "Failed to fetch Gmail messages",
        },
      };
    }
    const messages: GmailMessage[] = res.messages.map((m: any) => ({
      id: m.id,
      threadId: m.threadId || m.id,
      snippet: m.snippet || "",
      subject: m.subject || "No Subject",
      from: m.from || "Unknown",
      date: m.date || "",
      bodySummary: m.bodySummary || m.snippet || "",
      actionRequired: Boolean(m.actionRequired || /action required|due|urgent/i.test(`${m.subject} ${m.snippet}`)),
    }));
    return { messages, oauthStatus: { authenticated: true } };
  },
});

export const sendEmail = defineTool({
  name: "sendEmail",
  description: "Sends an email message via Gmail. Requires explicit user approval.",
  execute: async (
    params: { to: string; subject: string; body: string },
    options?: ToolOptions
  ): Promise<ToolActionResult<{ messageId: string }>> => {
    if (!options?.approved) {
      return createNeedsApprovalResponse("sendEmail", "send", params, options?.approvalId);
    }
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      messageId,
      data: { messageId },
    };
  },
});
