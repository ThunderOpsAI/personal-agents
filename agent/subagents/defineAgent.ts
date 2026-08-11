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
