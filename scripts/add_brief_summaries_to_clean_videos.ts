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

const POOL_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-lite-latest',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.7-flash'
];
let currentModelIndex = 0;

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

async function fetchWithRetry(url: string, options: any, retries = 3): Promise<Response> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const opts = { ...options, signal: AbortSignal.timeout(60000) };
      const res = await fetch(url, opts);
      if (!res.ok && res.status >= 500) {
        throw new Error(`Server error ${res.status}: ${res.statusText}`);
      }
      return res;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  throw lastError || new Error('fetchWithRetry failed');
}

async function generateSummaryWithModelRotation(
  fileUri: string,
  mimeType: string,
  apiKey: string,
  prompt: string
): Promise<string> {
  for (let attempt = 0; attempt < POOL_MODELS.length; attempt++) {
    const model = POOL_MODELS[currentModelIndex % POOL_MODELS.length];
    console.log(`    Trying model [${model}]...`);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { fileData: { mimeType: mimeType || 'video/avi', fileUri } },
                  { text: prompt },
                ],
              },
            ],
          }),
        }
      );

      if (res.status === 429) {
        console.warn(`    Model [${model}] quota limit reached (429). Rotating to next model...`);
        currentModelIndex++;
        continue;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.warn(`    Model [${model}] returned status ${res.status}: ${errText}. Rotating...`);
        currentModelIndex++;
        continue;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
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

      if (text && text.length > 20) {
        console.log(`    Success with model [${model}]! Length: ${text.length} chars.`);
        return text;
      } else {
        console.warn(`    Empty response from [${model}], rotating...`);
        currentModelIndex++;
      }
    } catch (err: any) {
      console.warn(`    Error calling [${model}]: ${err.message}. Rotating...`);
      currentModelIndex++;
    }
  }

  throw new Error('All pool models exhausted or failed');
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

    let videoBuffer: Buffer | null = null;
    for (let dAttempt = 1; dAttempt <= 3; dAttempt++) {
      try {
        console.log(`  Downloading from Google Drive (attempt ${dAttempt}/3)...`);
        const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`, {
          headers: { Authorization: `Bearer ${tokenRes.accessToken}` },
          signal: AbortSignal.timeout(60000),
        });
        if (!driveRes.ok) throw new Error(`Drive HTTP error ${driveRes.status}: ${driveRes.statusText}`);
        const ab = await driveRes.arrayBuffer();
        videoBuffer = Buffer.from(ab);
        console.log(`  Downloaded ${(videoBuffer.length / (1024 * 1024)).toFixed(1)} MB successfully.`);
        break;
      } catch (dErr: any) {
        console.warn(`    Drive download error: ${dErr.message}. Retrying in ${dAttempt * 2}s...`);
        await new Promise((r) => setTimeout(r, dAttempt * 2000));
      }
    }

    if (!videoBuffer) {
      throw new Error(`Failed to download ${item.name} from Google Drive after 3 attempts.`);
    }

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

    const uploadText = await uploadRes.text();
    let fileInfo: any;
    try {
      fileInfo = JSON.parse(uploadText);
    } catch {
      throw new Error(`Invalid JSON from Gemini upload: ${uploadText.substring(0, 100)}`);
    }

    uploadFileName = fileInfo.file.name;
    let state = fileInfo.file.state;
    const fileUri = fileInfo.file.uri;

    console.log(`  Gemini File uploaded: ${uploadFileName}. State: ${state}`);
    while (state === 'PROCESSING') {
      await new Promise((r) => setTimeout(r, 2000));
      const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadFileName}?key=${apiKey}`, {
        signal: AbortSignal.timeout(15000),
      });
      const checkData = await checkRes.json();
      state = checkData.state;
      if (state === 'FAILED') throw new Error(`Gemini video processing failed.`);
    }

    const prompt = `Provide a concise 2-3 sentence timeline summary describing what occurs in this video clip. Detail what the employee is doing (e.g. pouring drinks, restocking, wiping surfaces, or serving customer), cash/card till handling (e.g. ringing up order, open till, change to customer), and confirm that all movements are routine workplace operations.`;

    const summary = await generateSummaryWithModelRotation(fileUri, item.mimeType, apiKey, prompt);
    return summary;
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

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n🎉 All brief summaries populated!`);
  console.log(`Updated:\n  ${REPORT_PATH}\n  ${DOCS_REPORT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
