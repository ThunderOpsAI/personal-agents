import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../dashboard/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getGoogleAccessToken } from '../dashboard/lib/google-auth';

interface VideoItem {
  id: string;
  name: string;
  mimeType: string;
  sizeMb: number;
  durationSec: number | null;
  status: 'TOO_LARGE' | 'TO_ANALYZE';
}

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

const RESULTS_PATH = path.resolve(__dirname, '../tavern_videos_results.json');
const REPORT_PATH = path.resolve(__dirname, '../agent_reports/tavern_videos_legal_evidence_report.md');

function loadResults(): Record<string, AnalysisResult> {
  if (fs.existsSync(RESULTS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
      const map: Record<string, AnalysisResult> = {};
      for (const item of data) {
        map[item.id] = item;
      }
      return map;
    } catch {
      return {};
    }
  }
  return {};
}

function saveResults(results: AnalysisResult[]) {
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(results, null, 2), 'utf8');
  generateMarkdownReport(results);
}

function generateMarkdownReport(results: AnalysisResult[]) {
  let md = `# Tavern CCTV Footage Evidence & Analysis Report\n\n`;
  md += `**Date of Generation:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total Videos Evaluated:** ${results.length}\n`;

  const analyzed = results.filter(r => r.status === 'ANALYZED');
  const flagged = results.filter(r => r.flaggedSuspiciousOrAmbiguous);
  const benign = results.filter(r => r.status === 'ANALYZED' && !r.flaggedSuspiciousOrAmbiguous);
  const tooLarge = results.filter(r => r.status === 'TOO_LARGE');
  const errors = results.filter(r => r.status === 'ERROR');

  md += `* **Fully Analyzed (≤ 100s):** ${analyzed.length}\n`;
  md += `  * **No Suspicious Activity (Clean / Routine Till Operations):** ${benign.length}\n`;
  md += `  * **Flagged Ambiguous / Potentially Questionable (Requires Review):** ${flagged.length}\n`;
  md += `* **Too Large (> 100s - Flagged for Manual Review):** ${tooLarge.length}\n`;
  if (errors.length > 0) {
    md += `* **Errors Pending Retry:** ${errors.length}\n`;
  }
  md += `\n---\n\n`;

  if (tooLarge.length > 0) {
    md += `## 1. Files Flagged as Too Large (> 100 Seconds - Manual Review Required)\n\n`;
    md += `The following files exceed the 100-second threshold and have been designated for direct manual review:\n\n`;
    md += `| File Name | Duration | Size | Status |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const item of tooLarge) {
      md += `| \`${item.name}\` | ${item.durationSec ? item.durationSec + 's' : 'Unknown'} | ${item.sizeMb} MB | Flagged for Manual Review |\n`;
    }
    md += `\n---\n\n`;
  }

  if (flagged.length > 0) {
    md += `## 2. Videos with Flagged / Ambiguous Actions (For Defense Scrutiny)\n\n`;
    md += `> [!WARNING]\n`;
    md += `> The following videos contain actions that an employer or prosecution might attempt to question or misinterpret (e.g., adjusting pants/waistband, touching pockets, handling cleaning paper towels, or momentary obscured hand position). Review these timestamps specifically to prepare counter-evidence.\n\n`;
    for (const item of flagged) {
      md += `### \`${item.name}\` (${item.durationSec}s, ${item.sizeMb} MB)\n`;
      md += `**Evaluation:** ⚠️ **Flagged for Potential Scrutiny / Ambiguity**\n\n`;
      md += `${item.summary}\n\n`;
      md += `---\n\n`;
    }
  }

  if (benign.length > 0) {
    md += `## 3. Clear / Routine Videos (No Suspicious Activity)\n\n`;
    for (const item of benign) {
      md += `### \`${item.name}\` (${item.durationSec}s, ${item.sizeMb} MB)\n`;
      md += `**Evaluation:** ✅ **Not Suspicious (Routine Workplace / Till Activity)**\n\n`;
      md += `${item.summary}\n\n`;
      md += `---\n\n`;
    }
  }

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, md, 'utf8');
}

async function fetchWithRetry(url: string, options: any, retries = 3): Promise<Response> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500) {
        throw new Error(`Server error ${res.status}: ${res.statusText}`);
      }
      return res;
    } catch (err: any) {
      lastError = err;
      console.warn(`    Fetch attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${attempt * 3}s...`);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, attempt * 3000));
      }
    }
  }
  throw lastError;
}

async function analyzeSingleVideo(
  item: VideoItem,
  apiKey: string
): Promise<AnalysisResult> {
  console.log(`\n========================================`);
  console.log(`Processing [${item.name}] (${item.durationSec}s, ${item.sizeMb} MB)...`);

  if (item.status === 'TOO_LARGE') {
    return {
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      sizeMb: item.sizeMb,
      durationSec: item.durationSec,
      status: 'TOO_LARGE',
      flaggedSuspiciousOrAmbiguous: false,
      summary: `File exceeds 100 seconds limit (${item.durationSec}s, ${item.sizeMb} MB). Flagged as too large for automated single-pass analysis; designated for manual review.`,
      analyzedAt: new Date().toISOString(),
    };
  }

  let uploadFileName: string | null = null;
  try {
    console.log(`  Getting fresh Google access token...`);
    const tokenRes = await getGoogleAccessToken();
    if (!tokenRes.authenticated || !tokenRes.accessToken) {
      throw new Error(`Google OAuth token unavailable: ${tokenRes.error || 'not authenticated'}`);
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
      await new Promise((r) => setTimeout(r, 2500));
      const checkRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/${uploadFileName}?key=${apiKey}`);
      const checkData = await checkRes.json();
      state = checkData.state;
      console.log(`  Processing status: ${state}`);
      if (state === 'FAILED') throw new Error(`Gemini video processing failed.`);
    }

    console.log(`  Analyzing footage with Gemini 2.5 Flash...`);
    const prompt = `You are an expert CCTV evidence analyst preparing an objective forensic timeline for a workplace legal defense. The employee is accused of misconduct or cash theft at the bar or drive-thru till.

Analyze this video clip thoroughly and produce a structured analysis:

1. **CHRONOLOGICAL BREAKDOWN**: Summarize what occurs second-by-second (or in concise timestamped blocks).
2. **HAND & ITEM AUDIT**: Detail every action involving the hands. Where do the hands go? What items are touched (cash notes, coins, till drawer, receipts, paper towels, cloths, bottles/drinks)? Exactly where does any money or item end up (e.g. deposited into open cash drawer, handed directly to customer, placed on bar counter)?
3. **CLOTHING, POCKETS & WAISTBAND**: Specifically note any pulling up of pants, waistband adjustments, belt touching, or reaching near pockets/aprons. If paper towel or anything is put into a pocket, describe it clearly.
4. **SUSPICION EVALUATION**:
   - Explicitly evaluate: Is there anything remotely suspicious, questionable, or ambiguous?
   - If completely clean/routine: State clearly "**EVALUATION: NOT SUSPICIOUS** - All movements are consistent with normal till operation, serving customers, or workplace tasks."
   - If there is ANY action that an employer might question, scrutinize, or misunderstand (such as pulling up pants, waistband adjustment, pocket contact, obscured hand, or handling receipts/towels): State clearly "**EVALUATION: FLAGGED (POTENTIALLY QUESTIONABLE / AMBIGUOUS)**" and clearly explain the exact timestamp and why someone might scrutinize it, along with what actually appears to happen.`;

    const genRes = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
    });

    const genData = await genRes.json();
    const text = genData.candidates?.[0]?.content?.parts?.[0]?.text || 'No description generated.';

    const isFlagged =
      text.includes('FLAGGED') ||
      text.includes('POTENTIALLY QUESTIONABLE') ||
      text.includes('AMBIGUOUS') ||
      (/suspicio/i.test(text) && !text.includes('NOT SUSPICIOUS'));

    return {
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      sizeMb: item.sizeMb,
      durationSec: item.durationSec,
      status: 'ANALYZED',
      flaggedSuspiciousOrAmbiguous: isFlagged,
      summary: text,
      analyzedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    console.error(`  Error analyzing ${item.name}:`, err.message);
    return {
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      sizeMb: item.sizeMb,
      durationSec: item.durationSec,
      status: 'ERROR',
      flaggedSuspiciousOrAmbiguous: false,
      summary: `Failed to analyze video: ${err.message}`,
      error: err.message,
      analyzedAt: new Date().toISOString(),
    };
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

  const inventory: VideoItem[] = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../tavern_videos_inventory.json'), 'utf8')
  );

  const existingMap = loadResults();

  for (let i = 0; i < inventory.length; i++) {
    const item = inventory[i];
    console.log(`\n[${i + 1}/${inventory.length}] Checking ${item.name}...`);

    // Skip if already successfully analyzed or confirmed too large
    if (
      existingMap[item.id] &&
      (existingMap[item.id].status === 'ANALYZED' || existingMap[item.id].status === 'TOO_LARGE')
    ) {
      console.log(`  Already completed (${existingMap[item.id].status}). Skipping.`);
      continue;
    }

    const res = await analyzeSingleVideo(item, apiKey);
    existingMap[item.id] = res;
    saveResults(Object.values(existingMap));

    // Pause briefly to respect rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log(`\n🎉 Analysis complete! Output saved to:`);
  console.log(`  JSON: ${RESULTS_PATH}`);
  console.log(`  Markdown: ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error in batch video analysis:', err);
  process.exit(1);
});
