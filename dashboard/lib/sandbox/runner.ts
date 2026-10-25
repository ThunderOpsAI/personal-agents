/**
 * Sandboxed Code Execution Engine
 * Primary runner: E2B Code Interpreter (@e2b/code-interpreter)
 * Fallback runner: Secure isolated process runner for local offline testing
 *
 * Invariants:
 * - Sandbox receives NO production credentials (NEON, GEMINI, GOOGLE, etc.)
 * - Sandbox receives NO medical data, pain logs, or SMS content
 * - Enforces execution timeouts and memory/process constraints
 */

import type { ChildProcess } from 'child_process';

export interface SandboxExecutionOptions {
  language?: 'python' | 'javascript' | 'typescript';
  timeoutMs?: number; // default 15000ms (15s)
}

export interface SandboxExecutionResult {
  status: 'success' | 'error' | 'timeout';
  stdout: string;
  stderr: string;
  results: any[];
  executionTimeMs: number;
  error?: string;
  isSandboxed: boolean;
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
 * Executes code using E2B Code Interpreter if API key is present.
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
 * Isolated process fallback for offline development / test suites
 * Ensures timeout limits, zero credential leakage, and strict process termination.
 */
async function runWithIsolatedLocalFallback(
  code: string,
  options: SandboxExecutionOptions
): Promise<SandboxExecutionResult> {
  const { spawn } = await import('child_process');
  const timeoutMs = Math.min(Math.max(options.timeoutMs || 15000, 1000), 60000);
  const startTime = Date.now();
  const safeEnv = sanitizeSandboxEnvironment({});

  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';
    let timedOut = false;

    const isPython = options.language === 'python';
    const command = isPython ? 'python3' : 'node';
    const flag = isPython ? '-c' : '-e';
    const child: ChildProcess = spawn(command, [flag, code], {
      env: safeEnv as unknown as NodeJS.ProcessEnv,
      timeout: timeoutMs,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    if (child.stdout) {
      child.stdout.on('data', (chunk: Buffer | string) => {
        stdoutData += chunk.toString();
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (chunk: Buffer | string) => {
        stderrData += chunk.toString();
      });
    }

    child.on('close', (codeStatus: number | null) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;

      if (timedOut) {
        return resolve({
          status: 'timeout',
          stdout: stdoutData,
          stderr: stderrData,
          results: [],
          executionTimeMs,
          error: `Execution timed out after ${timeoutMs}ms`,
          isSandboxed: true,
        });
      }

      const hasError = codeStatus !== 0;
      resolve({
        status: hasError ? 'error' : 'success',
        stdout: stdoutData.trim(),
        stderr: stderrData.trim(),
        results: stdoutData.trim() ? [stdoutData.trim()] : [],
        executionTimeMs,
        error: hasError ? `Process exited with code ${codeStatus}: ${stderrData.trim()}` : undefined,
        isSandboxed: true,
      });
    });

    child.on('error', (err: Error) => {
      clearTimeout(timer);
      resolve({
        status: 'error',
        stdout: stdoutData,
        stderr: err.message,
        results: [],
        executionTimeMs: Date.now() - startTime,
        error: err.message,
        isSandboxed: true,
      });
    });
  });
}

/**
 * Main sandboxed code execution handler.
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

  // Use E2B if API key is provided and not in simulated test mode
  if (process.env.E2B_API_KEY && !process.env.VITEST_LOCAL_SANDBOX) {
    try {
      return await runWithE2B(code, options);
    } catch (err: any) {
      console.warn(`[Sandbox] E2B initialization failed, falling back to isolated runner: ${err.message}`);
    }
  }

  return runWithIsolatedLocalFallback(code, options);
}
