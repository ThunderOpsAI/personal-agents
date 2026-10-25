import { describe, expect, it } from 'vitest';
import {
  executeSandboxedCode,
  sanitizeSandboxEnvironment,
} from '../lib/sandbox/runner';
import {
  validatePrFiles,
  validateBranchName,
  generateDiffPreview,
  preparePrPreview,
  executeOpenPr,
  FORBIDDEN_FILE_PATTERNS,
} from '../lib/sandbox/pr-creator';
import {
  sandboxExecuteSchema,
  prCreatorSchema,
  sandboxExecuteTool,
  prCreatorTool,
  createRumbleTools,
  executeConfirmedAction,
} from '../lib/agents/intent-router';

describe('Phase 4: Sandboxed Code Execution and PR Automation', () => {
  describe('Sandbox Credential Sanitization', () => {
    it('strips all sensitive credentials, database URLs, and API tokens from environment', () => {
      const contaminatedEnv = {
        NEON_DATABASE_URL: 'postgres://user:pass@ep-cool-123.us-east-2.aws.neon.tech/rumble',
        DATABASE_URL: 'postgres://localhost:5432/db',
        PGPASSWORD: 'supersecretpassword',
        GEMINI_API_KEY: 'AIzaSySecretGeminiKey123',
        GOOGLE_CLIENT_SECRET: 'GOCSPX-SecretGoogleKey',
        GITHUB_TOKEN: 'ghp_FineScopedGitHubToken123',
        GH_TOKEN: 'ghp_AlternateGitHubToken',
        E2B_API_KEY: 'e2b_5678secret',
        TWILIO_AUTH_TOKEN: 'twilio_secret_token_abc',
        SMS_WEBHOOK_SECRET: 'webhook_shared_secret',
        ADMIN_PASSWORD: 'admin_plain_pass',
        MY_SECRET_KEY: 'secret123',
        SAFE_VARIABLE: 'rumble-safe-value',
      };

      const sanitized = sanitizeSandboxEnvironment(contaminatedEnv);

      // Verify stripped variables
      expect(sanitized.NEON_DATABASE_URL).toBeUndefined();
      expect(sanitized.DATABASE_URL).toBeUndefined();
      expect(sanitized.PGPASSWORD).toBeUndefined();
      expect(sanitized.GEMINI_API_KEY).toBeUndefined();
      expect(sanitized.GOOGLE_CLIENT_SECRET).toBeUndefined();
      expect(sanitized.GITHUB_TOKEN).toBeUndefined();
      expect(sanitized.GH_TOKEN).toBeUndefined();
      expect(sanitized.E2B_API_KEY).toBeUndefined();
      expect(sanitized.TWILIO_AUTH_TOKEN).toBeUndefined();
      expect(sanitized.SMS_WEBHOOK_SECRET).toBeUndefined();
      expect(sanitized.ADMIN_PASSWORD).toBeUndefined();
      expect(sanitized.MY_SECRET_KEY).toBeUndefined();

      // Verify preserved safe variables
      expect(sanitized.SAFE_VARIABLE).toBe('rumble-safe-value');
      expect(sanitized.NODE_ENV).toBe('sandbox');
      expect(sanitized.PATH).toBeDefined();
    });
  });

  describe('Isolated Sandboxed Code Runner', () => {
    it('executes JavaScript ad-hoc calculation and returns stdout', async () => {
      const code = `
        const data = [10, 20, 30, 40];
        const sum = data.reduce((a, b) => a + b, 0);
        console.log(JSON.stringify({ total: sum, avg: sum / data.length }));
      `;

      const result = await executeSandboxedCode(code, { language: 'javascript' });

      expect(result.status).toBe('success');
      expect(result.isSandboxed).toBe(true);
      expect(result.executionTimeMs).toBeGreaterThan(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed.total).toBe(100);
      expect(parsed.avg).toBe(25);
    });

    it('executes Python ad-hoc data transformation and returns stdout', async () => {
      const code = `
items = [1, 2, 3, 4, 5]
squares = [x**2 for x in items]
print(sum(squares))
`;

      const result = await executeSandboxedCode(code, { language: 'python' });

      expect(result.status).toBe('success');
      expect(result.isSandboxed).toBe(true);
      expect(result.stdout.trim()).toBe('55');
    });

    it('captures runtime errors and non-zero exit codes gracefully', async () => {
      const badCode = `
        throw new Error("Intentional calculation failure");
      `;

      const result = await executeSandboxedCode(badCode, { language: 'javascript' });

      expect(result.status).toBe('error');
      expect(result.error).toBeDefined();
      expect(result.isSandboxed).toBe(true);
    });

    it('handles empty code input gracefully', async () => {
      const result = await executeSandboxedCode('');
      expect(result.status).toBe('error');
      expect(result.error).toContain('No code provided');
    });

    it('enforces execution timeout and terminates runaway processes', async () => {
      // Run an infinite loop with 1.2s timeout
      const infiniteLoopCode = `
        const start = Date.now();
        while (true) {
          // busy spin
        }
      `;

      const result = await executeSandboxedCode(infiniteLoopCode, {
        language: 'javascript',
        timeoutMs: 1200,
      });

      expect(result.status).toBe('timeout');
      expect(result.error).toContain('timed out');
    }, 10000);
  });

  describe('PR Creator Safety Guardrails and Path Denylist', () => {
    it('refuses to modify AGENTS.md (case-insensitive)', () => {
      expect(() => {
        validatePrFiles([{ path: 'AGENTS.md', content: '# modified' }]);
      }).toThrow(/Procedural Safety Violation/);

      expect(() => {
        validatePrFiles([{ path: 'agents.md', content: '# modified' }]);
      }).toThrow(/Procedural Safety Violation/);
    });

    it('refuses to modify CONTEXT.md (case-insensitive)', () => {
      expect(() => {
        validatePrFiles([{ path: 'CONTEXT.md', content: '# modified' }]);
      }).toThrow(/Procedural Safety Violation/);

      expect(() => {
        validatePrFiles([{ path: 'context.md', content: '# modified' }]);
      }).toThrow(/Procedural Safety Violation/);
    });

    it('refuses to modify environment files (.env, .env.local, .env.production)', () => {
      expect(() => {
        validatePrFiles([{ path: '.env', content: 'SECRET=val' }]);
      }).toThrow(/Procedural Safety Violation/);

      expect(() => {
        validatePrFiles([{ path: '.env.local', content: 'SECRET=val' }]);
      }).toThrow(/Procedural Safety Violation/);

      expect(() => {
        validatePrFiles([{ path: '.env.production', content: 'SECRET=val' }]);
      }).toThrow(/Procedural Safety Violation/);
    });

    it('refuses to modify auth or secret files', () => {
      expect(() => {
        validatePrFiles([{ path: 'dashboard/lib/google-auth.ts', content: 'hack' }]);
      }).toThrow(/Procedural Safety Violation/);

      expect(() => {
        validatePrFiles([{ path: 'config/secret_keys.json', content: '{}' }]);
      }).toThrow(/Procedural Safety Violation/);

      expect(() => {
        validatePrFiles([{ path: 'agent_reports/medical_protocol.md', content: 'unauthorized report' }]);
      }).toThrow(/Procedural Safety Violation/);
    });

    it('refuses directory traversal attempts', () => {
      expect(() => {
        validatePrFiles([{ path: '../../etc/passwd', content: 'root:x' }]);
      }).toThrow(/Procedural Safety Violation/);
    });

    it('allows valid safe application files', () => {
      expect(() => {
        validatePrFiles([
          { path: 'dashboard/lib/calculations/bmi.ts', content: 'export const calculate = () => 22;' },
          { path: 'dashboard/tests/calculations.test.ts', content: 'test("calc", () => {});' },
        ]);
      }).not.toThrow();
    });
  });

  describe('Branch Name Validation', () => {
    it('formats and enforces feat/rumble-<slug>', () => {
      expect(validateBranchName('data-transform')).toBe('feat/rumble-data-transform');
      expect(validateBranchName('Add Fast Analytics!')).toBe('feat/rumble-add-fast-analytics');
      expect(validateBranchName('---clean-slug---')).toBe('feat/rumble-clean-slug');
    });

    it('refuses main or master branch targets', () => {
      expect(() => validateBranchName('main')).toThrow(/Invalid branch slug/);
      expect(() => validateBranchName('master')).toThrow(/Invalid branch slug/);
      expect(() => validateBranchName('')).toThrow(/Invalid branch slug/);
    });
  });

  describe('Two-Turn Confirm-Before-Write Invariant for PRs', () => {
    const validChange = {
      title: 'Add water intake calculator helper',
      slug: 'water-calculator',
      summary: 'Adds pure helper function for daily hydrotherapy hydration guidance',
      files: [
        {
          path: 'dashboard/lib/water.ts',
          content: 'export function getTarget(kg: number): number { return kg * 35; }',
        },
      ],
    };

    it('Turn 1: preparePrPreview returns diff preview and requires confirmation without writing', () => {
      const previewResult = preparePrPreview(validChange);

      expect(previewResult.requires_confirmation).toBe(true);
      expect(previewResult.preview.type).toBe('create_pr');
      expect(previewResult.preview.data.branch).toBe('feat/rumble-water-calculator');
      expect(previewResult.preview.data.diff).toContain('--- a/dashboard/lib/water.ts');
      expect(previewResult.preview.data.diff).toContain('+++ b/dashboard/lib/water.ts');
      expect(previewResult.preview.data.diff).toContain('+ export function getTarget');
      expect(previewResult.summary).toContain('Requires confirmation before opening');
    });

    it('Turn 2: executeConfirmedAction commits the confirmed PR action', async () => {
      const previewResult = preparePrPreview(validChange);

      const commitResult = await executeConfirmedAction({
        type: 'create_pr',
        data: previewResult.preview.data,
      });

      expect(commitResult.success).toBe(true);
      expect(commitResult.message).toContain('Pull Request #');
      expect(commitResult.message).toContain('feat/rumble-water-calculator');
      expect(commitResult.result.branch).toBe('feat/rumble-water-calculator');
    });
  });

  describe('Vercel AI SDK Tool Schemas and Registration', () => {
    it('sandboxExecuteSchema validates code and options', () => {
      const parsed = sandboxExecuteSchema.safeParse({
        code: 'print("hello")',
        language: 'python',
        timeout_ms: 5000,
      });
      expect(parsed.success).toBe(true);
    });

    it('prCreatorSchema rejects PRs with empty files list', () => {
      const parsed = prCreatorSchema.safeParse({
        title: 'Valid PR Title',
        slug: 'valid-slug',
        summary: 'Detailed explanation of why this PR exists.',
        files: [],
      });
      expect(parsed.success).toBe(false);
    });

    it('createRumbleTools exposes runSandboxCode and createPullRequest', () => {
      const tools = createRumbleTools();
      expect(tools.runSandboxCode).toBeDefined();
      expect(tools.createPullRequest).toBeDefined();
    });

    it('sandboxExecuteTool executes directly and returns formatted summary', async () => {
      const res: any = await (sandboxExecuteTool as any).execute({
        code: 'console.log(123 + 456);',
        language: 'javascript',
        timeout_ms: 5000,
      });

      expect(res.status).toBe('success');
      expect(res.stdout).toBe('579');
      expect(res.summary).toContain('Sandbox execution completed');
    });

    it('prCreatorTool executes Turn 1 and returns preview requiring confirmation', async () => {
      const res: any = await (prCreatorTool as any).execute({
        title: 'Add Utility Helper',
        slug: 'utility-helper',
        summary: 'Utility helper addition for throwaway prototyping',
        files: [{ path: 'lib/util.ts', content: 'export const X = 1;' }],
      });

      expect(res.requires_confirmation).toBe(true);
      expect(res.preview.type).toBe('create_pr');
      expect(res.preview.data.branch).toBe('feat/rumble-utility-helper');
    });
  });
});
