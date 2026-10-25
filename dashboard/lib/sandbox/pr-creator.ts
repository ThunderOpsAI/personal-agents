/**
 * PR Creator Tool with Strict Procedural Safety Guardrails
 *
 * Invariants:
 * - Fine-scoped GitHub token in server env, never exposed to sandbox or client
 * - Branches MUST be named feat/rumble-<slug>, NEVER main
 * - Strict Path Denylist: refuses to modify AGENTS.md, CONTEXT.md, safety rules, auth, or env secrets
 * - Never auto-merges; opens PR for mobile review
 * - Two-turn write flow: parse -> preview -> confirm -> commit
 */

import { Octokit } from '@octokit/rest';

export interface PrFileChange {
  path: string;
  content: string;
}

export interface PrPreviewData {
  title: string;
  slug: string;
  branch: string;
  summary: string;
  files: PrFileChange[];
  diff: string;
}

export interface PrExecutionResult {
  status: 'created' | 'simulated';
  prNumber: number;
  prUrl: string;
  branch: string;
  title: string;
}

// Strict denylist of files and patterns forbidden from modification
export const FORBIDDEN_FILE_PATTERNS = [
  // 1. Source-of-truth documents (case-insensitive)
  /(^|\/)agents\.md$/i,
  /(^|\/)context\.md$/i,
  /(^|\/)agent\/[^\/]+\.md$/i,
  /(^|\/)\.?agents?\/skills(\/|$)/i,
  /(^|\/)agent\/tools(\/|$)/i,

  // 2. Authentication, credentials, and secrets
  /(^|\/)\.env/i,
  /credentials/i,
  /secret/i,
  /(^|\/)auth(\/|$|\.)/i,
  /(^|\/)lib\/auth/i,
  /(^|\/)api\/v1\/auth/i,
  /google-auth/i,

  // 3. Medical safety, clinical protocols, and rehab engines
  /medical/i,
  /rehab/i,
  /safety/i,

  // 4. Autonomous reports directory & directory traversal
  /(^|\/)agent_reports(\/|$)/i,
  /\.\./, // directory traversal
];

/**
 * Validates file paths against strict security denylist.
 */
export function validatePrFiles(files: PrFileChange[]): void {
  if (!files || files.length === 0) {
    throw new Error('At least one file change is required to create a PR.');
  }

  for (const file of files) {
    const normalized = file.path.trim().replace(/^\/+/, '');

    for (const pattern of FORBIDDEN_FILE_PATTERNS) {
      if (pattern.test(normalized)) {
        throw new Error(
          `Procedural Safety Violation: Modifying '${file.path}' is strictly forbidden by Rumble OS policy.`
        );
      }
    }
  }
}

/**
 * Formats and validates the branch name according to policy.
 */
export function validateBranchName(rawSlug: string): string {
  const cleanSlug = rawSlug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  if (!cleanSlug || cleanSlug === 'main' || cleanSlug === 'master') {
    throw new Error(`Invalid branch slug '${rawSlug}'. Branch must follow 'feat/rumble-<slug>'.`);
  }

  return `feat/rumble-${cleanSlug}`;
}

/**
 * Generates a unified git diff preview for chat display.
 */
export function generateDiffPreview(files: PrFileChange[]): string {
  return files
    .map((file) => {
      const lines = file.content.split('\n');
      const diffBody = lines.map((l) => `+ ${l}`).join('\n');
      return `--- a/${file.path}\n+++ b/${file.path}\n@@ -0,0 +1,${lines.length} @@\n${diffBody}`;
    })
    .join('\n\n');
}

/**
 * Turn 1: Prepares the PR creation preview without performing any GitHub writes.
 */
export function preparePrPreview(input: {
  title: string;
  slug: string;
  summary: string;
  files: PrFileChange[];
}): { requires_confirmation: true; preview: { type: 'create_pr'; data: PrPreviewData }; summary: string } {
  // Validate path denylist
  validatePrFiles(input.files);

  // Validate branch naming
  const branch = validateBranchName(input.slug);
  const diff = generateDiffPreview(input.files);

  const previewData: PrPreviewData = {
    title: input.title.trim(),
    slug: input.slug.trim(),
    branch,
    summary: input.summary.trim(),
    files: input.files,
    diff,
  };

  return {
    requires_confirmation: true,
    preview: {
      type: 'create_pr',
      data: previewData,
    },
    summary: `PR Preview: "${input.title}" on branch ${branch} (${input.files.length} file(s) changed). Requires confirmation before opening.`,
  };
}

/**
 * Turn 2: Opens the GitHub Pull Request using Octokit.
 * Never auto-merges; creates branch and PR for mobile review.
 */
export async function executeOpenPr(
  data: PrPreviewData,
  repoOwner: string = 'thunderopsai',
  repoName: string = 'personal-agents'
): Promise<PrExecutionResult> {
  // Re-verify security invariants on write
  validatePrFiles(data.files);
  const branch = validateBranchName(data.slug);

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

  // In test or non-production environment without GitHub token, simulate PR creation
  if (!token || token.startsWith('mock_') || process.env.VITEST) {
    return {
      status: 'simulated',
      prNumber: 999,
      prUrl: `https://github.com/${repoOwner}/${repoName}/pull/999`,
      branch,
      title: data.title,
    };
  }

  const octokit = new Octokit({ auth: token });

  // 1. Get default branch commit SHA
  const { data: refData } = await octokit.rest.git.getRef({
    owner: repoOwner,
    repo: repoName,
    ref: 'heads/main',
  });
  const baseSha = refData.object.sha;

  // 2. Create the new branch ref
  await octokit.rest.git.createRef({
    owner: repoOwner,
    repo: repoName,
    ref: `refs/heads/${branch}`,
    sha: baseSha,
  });

  // 3. Commit files to the new branch
  for (const file of data.files) {
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path: file.path,
      message: `feat(${data.slug}): ${data.title}`,
      content: Buffer.from(file.content).toString('base64'),
      branch,
    });
  }

  // 4. Create the Pull Request
  const prBody = `## Autonomous Rumble OS PR
**Summary:** ${data.summary}

### Changed Files
${data.files.map((f) => `- \`${f.path}\``).join('\n')}

> *Safety Invariant: Procedural safety rules verified. Never auto-merged. Ready for James's mobile review.*`;

  const { data: prData } = await octokit.rest.pulls.create({
    owner: repoOwner,
    repo: repoName,
    title: data.title,
    head: branch,
    base: 'main',
    body: prBody,
  });

  return {
    status: 'created',
    prNumber: prData.number,
    prUrl: prData.html_url,
    branch,
    title: data.title,
  };
}
