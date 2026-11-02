/**
 * Tool definition and human-in-the-loop approval protocol.
 *
 * Provides typed schemas for agent capabilities and safety gates. Mutating operations
 * (e.g. sending emails, modifying calendar events, or altering financial records)
 * yield a `needsApproval` envelope requiring explicit user confirmation before execution.
 */
import { NeedsApprovalRequest } from "./types";

export interface ToolOptions {
  approved?: boolean;
  approvalId?: string;
}

export interface ToolConfig<TParams = any, TResult = any> {
  name: string;
  description: string;
  execute: (params: TParams, options?: ToolOptions) => Promise<TResult>;
}

export function defineTool<TParams = any, TResult = any>(config: ToolConfig<TParams, TResult>) {
  return config;
}

export function createNeedsApprovalResponse<T>(
  toolName: string,
  action: string,
  params: T,
  approvalId?: string
) {
  const req: NeedsApprovalRequest<T> = {
    toolName,
    action,
    params,
    approvalId: approvalId || `appr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    status: "pending_approval",
  };
  return {
    success: false,
    needsApproval: req,
  };
}
