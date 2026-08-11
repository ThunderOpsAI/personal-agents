/**
 * Locked Tool Function Signatures for Rumble OS Eve Tools.
 * Shared between Subagent A (Agent, Tools, Skills) and Subagent B (API Routes).
 */

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  status: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  bodySummary: string;
  actionRequired: boolean;
}

export interface OAuthStatus {
  authenticated: boolean;
  authUrl?: string;
  error?: string;
}

export interface NeedsApprovalRequest<T = unknown> {
  toolName: string;
  action: string;
  params: T;
  approvalId: string;
  status: "pending_approval" | "approved" | "rejected";
}

export interface ToolActionResult<T = unknown> {
  success: boolean;
  eventId?: string;
  messageId?: string;
  data?: T;
  needsApproval?: NeedsApprovalRequest<T>;
  error?: string;
}

// Tool Signatures
export type GetCalendarEventsTool = (params?: { timeMin?: string; timeMax?: string }) => Promise<{ events: CalendarEvent[]; oauthStatus: OAuthStatus }>;
export type CreateCalendarEventTool = (params: { summary: string; start: string; end: string; description?: string }) => Promise<ToolActionResult<{ eventId: string }>>;
export type SendEmailTool = (params: { to: string; subject: string; body: string }) => Promise<ToolActionResult<{ messageId: string }>>;
export type GetGmailMessagesTool = (params?: { query?: string; maxResults?: number }) => Promise<{ messages: GmailMessage[]; oauthStatus: OAuthStatus }>;
export type QueryChromaPreferencesTool = (params: { painScore: number; locations: string[] }) => Promise<unknown>;
export type RecordChromaFeedbackTool = (params: { exerciseId: string; prePainScore: number; postPainScore: number; feedback?: string }) => Promise<unknown>;
