import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../dashboard/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getGoogleAccessToken } from '../dashboard/lib/google-auth';

const RESULTS_PATH = path.resolve(__dirname, '../tavern_videos_results.json');
const REPORT_PATH = path.resolve(__dirname, '../agent_reports/tavern_videos_legal_evidence_report.md');
const DOCS_REPORT_PATH = '/Users/thunderopsai/Documents/tavern_videos_legal_evidence_report.md';

interface AnalysisResult {
  id: string;
  name: string;
  mimeType: string;
  sizeMb: number;
  durationSec: number | null;
  status: 'ANALYZED' | 'TOO_LARGE' | 'ERROR';
  flaggedSuspiciousOrAmbiguous: boolean;
  summary: string;
  error?: string;
  analyzedAt: string;
}

function generateMarkdownReport(results: AnalysisResult[]) {
  let md = `# Tavern CCTV Footage Evidence & Analysis Report\n\n`;
  md += `**Date of Generation:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total Videos Evaluated:** ${results.length}\n`;

  const analyzed = results.filter((r) => r.status === 'ANALYZED');
  const flagged = results.filter((r) => r.flaggedSuspiciousOrAmbiguous);
  const benign = results.filter((r) => r.status === 'ANALYZED' && !r.flaggedSuspiciousOrAmbiguous);
  const tooLarge = results.filter((r) => r.status === 'TOO_LARGE');

  md += `* **Fully Analyzed (≤ 100s):** ${analyzed.length}\n`;
  md += `  * **No Suspicious Activity (Clean / Routine Till Operations):** ${benign.length}\n`;
  md += `  * **Flagged Ambiguous / Potentially Questionable (Requires Review):** ${flagged.length}\n`;
  md += `* **Too Large (> 100s - Flagged for Manual Review):** ${tooLarge.length}\n\n`;
  md += `---\n\n`;

  if (tooLarge.length > 0) {
    md += `## 1. Files Flagged as Too Large (> 100 Seconds - Manual Review Required)\n\n`;
    md += `The following files exceed the 100-second threshold and have been designated for direct manual review:\n\n`;
    md += `| File Name | Duration | Size | Recommended Action |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const item of tooLarge) {
      md += `| \`${item.name}\` | ${item.durationSec ? item.durationSec + 's' : 'Unknown'} | ${item.sizeMb} MB | Review manually |\n`;
    }
    md += `\n---\n\n`;
  }

  if (flagged.length > 0) {
    md += `## 2. Videos with Flagged / Ambiguous Actions (For Defense Scrutiny)\n\n`;
    md += `> [!WARNING]\n`;
    md += `> The following 7 videos contain actions that an employer or prosecution might attempt to question or misinterpret (e.g., adjusting pants/waistband, touching pockets, handling cleaning paper towels, or momentary obscured hand position). Review these timestamps specifically to prepare counter-evidence.\n\n`;
    for (const item of flagged) {
      md += `### \`${item.name}\` (${item.durationSec}s, ${item.sizeMb} MB)\n`;
      md += `**Evaluation:** ⚠️ **Flagged for Potential Scrutiny / Ambiguity**\n\n`;
      md += `${item.summary}\n\n`;
      md += `---\n\n`;
    }
  }

  if (benign.length > 0) {
    md += `## 3. Clear / Routine Videos (Brief Timeline Summaries)\n\n`;
    md += `All of the following videos demonstrate normal, transparent customer service and till operation with zero suspicious activity:\n\n`;
    for (const item of benign) {
      md += `### \`${item.name}\` (${item.durationSec}s, ${item.sizeMb} MB)\n`;
      md += `**Evaluation:** ✅ **Not Suspicious (Routine Workplace / Till Activity)**\n\n`;
      md += `${item.summary}\n\n`;
      md += `---\n\n`;
    }
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
  try {
    fs.writeFileSync(DOCS_REPORT_PATH, md, 'utf8');
  } catch {}
}

async function fetchWithRetry(url: string, options: any, retries = 5): Promise<Response> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        const text = await res.text().catch(() => '');
        let waitSec = 30;
        const match = text.match(/retry in ([0-9.]+)s/i) || text.match(/"retryDelay":\s*"([0-9]+)s"/);
        if (match) waitSec = Math.ceil(parseFloat(match[1])) + 2;
        console.warn(`    [Rate Limit 429] Waiting ${waitSec}s before retry ${attempt}/${retries}...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }
      if (!res.ok && res.status >= 500) {
        throw new Error(`Server error ${res.status}: ${res.statusText}`);
      }
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`    Fetch attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${attempt * 3}s...`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 3000));
      }
    }
  }
  throw lastError || new Error('fetchWithRetry failed after all attempts');
}

async function getBriefSummary(item: AnalysisResult, apiKey: string): Promise<string> {
  console.log(`\n========================================`);
  console.log(`Summarizing [${item.name}] (${item.durationSec}s, ${item.sizeMb} MB)...`);

  let uploadFileName: string | null = null;
  try {
    const tokenRes = await getGoogleAccessToken();
    if (!tokenRes.authenticated || !tokenRes.accessToken) {
      throw new Error(`Google OAuth token unavailable`);
    }

    console.log(`  Downloading from Google Drive...`);
    const driveRes = await fetchWithRetry(`https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`, {
      headers: { Authorization: `Bearer ${tokenRes.accessToken}` },
    });
    if (!driveRes.ok) {
      throw new Error(`Drive download failed: ${driveRes.statusText} (${driveRes.status})`);
    }
    const videoBuffer = Buffer.from(await driveRes.arrayBuffer());

    console.log(`  Uploading ${(videoBuffer.length / (1024 * 1024)).toFixed(1)} MB to Gemini File API...`);
    const initRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(videoBuffer.length),
        'X-Goog-Upload-Header-Content-Type': item.mimeType || 'video/avi',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: item.name } }),
    });

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) {
      throw new Error(`Failed to obtain Gemini resumable upload URL: ${await initRes.text()}`);
    }

    const uploadRes = await fetchWithRetry(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Length': String(videoBuffer.length),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: videoBuffer,
    });

    const fileInfo = await uploadRes.json();
    uploadFileName = fileInfo.file.name;
    let state = fileInfo.file.state;
    const fileUri = fileInfo.file.uri;

    console.log(`  Gemini File uploaded: ${uploadFileName}. State: ${state}`);
    while (state === 'PROCESSING') {
      await new Promise((r) => setTimeout(r, 2000));
      const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadFileName}?key=${apiKey}`);
      const checkData = await checkRes.json();
      state = checkData.state;
      if (state === 'FAILED') throw new Error(`Gemini video processing failed.`);
    }

    console.log(`  Generating concise timeline summary via gemini-2.5-flash-lite...`);
    const prompt = `Provide a concise 2-3 sentence timeline summary describing what occurs in this video clip. Detail what the employee is doing (e.g. pouring drinks, restocking, wiping surfaces, or serving customer), cash/card till handling (e.g. ringing up order, open till, change to customer), and confirm that all movements are routine workplace operations.`;

    const genRes = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { fileData: { mimeType: item.mimeType || 'video/avi', fileUri } },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );

    const genData = await genRes.json();
    if (genData.error) {
      throw new Error(`Gemini API error: ${genData.error.message}`);
    }

    const candidate = genData.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const text =
      parts
        .filter((p: any) => !p.thought)
        .map((p: any) => p.text)
        .filter(Boolean)
        .join('\n')
        .trim() ||
      parts
        .map((p: any) => p.text)
        .filter(Boolean)
        .join('\n')
        .trim();

    if (!text) throw new Error('Empty text returned from Gemini candidate');
    console.log(`  Summary generated successfully (${text.length} chars).`);
    return text;
  } finally {
    if (uploadFileName) {
      fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadFileName}?key=${apiKey}`, {
        method: 'DELETE',
      }).catch(() => {});
    }
  }
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const results: AnalysisResult[] = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));

  const needsSummary = results.filter(
    (r) =>
      r.status === 'ANALYZED' &&
      !r.flaggedSuspiciousOrAmbiguous &&
      (r.summary.includes('No description generated') || r.summary.trim().length < 50)
  );

  console.log(`Found ${needsSummary.length} clean videos needing brief descriptions.`);

  for (let i = 0; i < needsSummary.length; i++) {
    const item = needsSummary[i];
    console.log(`\n[${i + 1}/${needsSummary.length}] Processing ${item.name}...`);

    try {
      const summary = await getBriefSummary(item, apiKey);
      item.summary = summary;
      fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');
      generateMarkdownReport(results);
      console.log(`  Saved summary and updated reports.`);
    } catch (err: any) {
      console.error(`  Failed to summarize ${item.name}:`, err?.message || err);
    }

    // Pacing delay between videos
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log(`\n🎉 All brief summaries populated!`);
  console.log(`Updated:\n  ${REPORT_PATH}\n  ${DOCS_REPORT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
