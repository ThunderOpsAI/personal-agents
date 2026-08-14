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

export const getGmailMessages = defineTool({
  name: "getGmailMessages",
  description: "Read-only fetch of Gmail messages. Does not require approval.",
  execute: async (params?: { query?: string; maxResults?: number }) => {
    const oauthStatus = checkOAuthStatus();
    if (!oauthStatus.authenticated) {
      return { messages: [], oauthStatus };
    }
    const messages: GmailMessage[] = [];
    return { messages, oauthStatus };
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
