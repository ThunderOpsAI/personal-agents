/**
 * Autonomous subagent configuration contract.
 *
 * Defines scheduled background workers operating within specific cron triggers
 * and timezones, decoupling specialized workflows (e.g. morning briefings,
 * rehabilitation routine scheduling) from the primary interactive server loop.
 */
export interface SubagentConfig {
  id: string;
  name: string;
  schedule: string;
  timezone: string;
  instructions: string;
  handler: (context?: Record<string, unknown>) => Promise<Record<string, unknown>>;
}

export function defineAgent(config: SubagentConfig) {
  return config;
}
