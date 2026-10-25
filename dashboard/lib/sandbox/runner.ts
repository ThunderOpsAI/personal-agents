/**
 * Sandboxed Code Execution Engine
 * Primary runner: E2B Code Interpreter (@e2b/code-interpreter)
 *
 * Invariants:
 * - Fail-Closed Invariant: ZERO local or subprocess fallback on host.
 *   If E2B_API_KEY is missing or E2B is unreachable, execution fails closed.
 * - Sandbox receives NO production credentials (NEON, GEMINI, GOOGLE, etc.)
 * - Sandbox receives NO medical data, pain logs, or SMS content.
 * - Enforces execution timeouts and memory/process constraints.
 * - For tests: dependency injection of a mock runner is supported so no host
 *   processes are spawned.
 */

export interface SandboxExecutionResult {
  status: 'success' | 'error' | 'timeout';
  stdout: string;
  stderr: string;
  results: any[];
  executionTimeMs: number;
  error?: string;
  isSandboxed: boolean;
}

export type SandboxRunnerFn = (
  code: string,
  options: SandboxExecutionOptions
) => Promise<SandboxExecutionResult>;

export interface SandboxExecutionOptions {
  language?: 'python' | 'javascript' | 'typescript';
  timeoutMs?: number; // default 15000ms (15s)
  mockRunner?: SandboxRunnerFn; // Dependency injection for test isolation without host execution
}

// Credentials and sensitive keys that must NEVER be passed to sandbox
const CREDENTIAL_DENYLIST_PREFIXES = [
  'NEON_',
  'DATABASE_',
  'PG',
  'GEMINI_',
  'GOOGLE_',
  'E2B_',
  'GITHUB_',
  'GH_',
  'TWILIO_',
  'SMS_',
  'VERCEL_',
  'SECRET',
  'TOKEN',
  'KEY',
  'PASSWORD',
  'AUTH',
];

/**
 * Global test mock runner registry (for test suites where mock runner injection is global).
 */
let globalTestRunner: SandboxRunnerFn | null = null;

export function setSandboxTestRunner(runner: SandboxRunnerFn | null): void {
  globalTestRunner = runner;
}

export function getSandboxTestRunner(): SandboxRunnerFn | null {
  return globalTestRunner;
}

/**
 * Sanitizes an environment object ensuring ZERO production credentials leak.
 */
export function sanitizeSandboxEnvironment(env: Record<string, string | undefined>): Record<string, string> {
  const safeEnv: Record<string, string> = {
    NODE_ENV: 'sandbox',
    PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
  };

  for (const [key, val] of Object.entries(env)) {
    if (!val) continue;
    const upper = key.toUpperCase();
    const isDenied = CREDENTIAL_DENYLIST_PREFIXES.some(prefix => upper.includes(prefix));
    if (!isDenied) {
      safeEnv[key] = val;
    }
  }

  return safeEnv;
}

/**
 * Executes code using E2B Code Interpreter microVM.
 */
async function runWithE2B(
  code: string,
  options: SandboxExecutionOptions
): Promise<SandboxExecutionResult> {
  const { Sandbox } = await import('@e2b/code-interpreter');
  const apiKey = process.env.E2B_API_KEY;
  const timeoutMs = Math.min(Math.max(options.timeoutMs || 15000, 1000), 60000);
  const startTime = Date.now();

  const sandbox = await Sandbox.create({
    apiKey,
    timeoutMs,
  });

  try {
    const execution = await sandbox.runCode(code, {
      language: options.language === 'javascript' || options.language === 'typescript' ? 'js' : 'python',
    });

    const executionTimeMs = Date.now() - startTime;
    const stdout = execution.logs.stdout.join('\n');
    const stderr = execution.logs.stderr.join('\n');
    const hasError = execution.error !== null && execution.error !== undefined;

    return {
      status: hasError ? 'error' : 'success',
      stdout,
      stderr,
      results: execution.results ? execution.results.map((r: any) => r.text || r) : [],
      executionTimeMs,
      error: hasError ? `${execution.error?.name}: ${execution.error?.value}` : undefined,
      isSandboxed: true,
    };
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

/**
 * Main sandboxed code execution handler.
 * Strict fail-closed invariant: ZERO local or subprocess fallback on host.
 */
export async function executeSandboxedCode(
  code: string,
  options: SandboxExecutionOptions = {}
): Promise<SandboxExecutionResult> {
  if (!code || !code.trim()) {
    return {
      status: 'error',
      stdout: '',
      stderr: '',
      results: [],
      executionTimeMs: 0,
      error: 'No code provided for execution',
      isSandboxed: true,
    };
  }

  // 1. Check for explicit mock runner (per-call dependency injection or global test runner)
  const activeRunner = options.mockRunner || globalTestRunner;
  if (activeRunner) {
    return activeRunner(code, options);
  }

  // 2. Strict Fail-Closed Check: E2B_API_KEY must be configured
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    return {
      status: 'error',
      stdout: '',
      stderr: '',
      results: [],
      executionTimeMs: 0,
      error: 'E2B_API_KEY is not configured. Sandboxed code execution failed closed.',
      isSandboxed: false,
    };
  }

  // 3. Execute via E2B Cloud MicroVM; fail closed if unreachable
  const startTime = Date.now();
  try {
    return await runWithE2B(code, options);
  } catch (err: any) {
    return {
      status: 'error',
      stdout: '',
      stderr: err.message || '',
      results: [],
      executionTimeMs: Date.now() - startTime,
      error: `E2B runner unreachable: ${err.message}`,
      isSandboxed: false,
    };
  }
}
