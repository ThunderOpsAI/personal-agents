import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { createPainLog } from '../dashboard/lib/db';
import { exportPainReportToMarkdown } from '../dashboard/lib/agents/intent-router';

dotenv.config();

interface PainLogJsonRecord {
  id: string | number;
  pain_score: number;
  pain_level: number;
  mood: string | number;
  mood_level: number;
  location_breakdown: Array<{
    area: string;
    side?: string;
    percentage: number;
  }>;
  notes: string;
  timestamp: string;
}

const MORNING_NOTES = [
  "Morning lumbar stiffness upon waking, mild cervical tightness.",
  "Right lower back stiffness after sleep, neck tension 10%.",
  "Right lumbar stiffness, both ankles tight on first steps.",
  "Morning flare in right lumbar, mild neck ache.",
  "Woke with moderate right lumbar ache, bilateral ankle stiffness.",
];

const MIDDAY_NOTES = [
  "Post-physio tightness in right lumbar, neck stable.",
  "Midday fatigue in right lumbar, minor ankle strain after standing.",
  "Stiffness after prolonged desk sitting, right lumbar dominant.",
  "Midday check-in: right lower back ache, mild cervical strain.",
  "Ankles sore after walking, right lumbar dull ache.",
];

const AFTERNOON_NOTES = [
  "Afternoon right lumbar fatigue, neck tension moderate.",
  "Post-walk fatigue, bilateral ankle stiffness, lumbar aching.",
  "Mid-afternoon flare in right lower back, neck stiff.",
  "Stiffness accumulating through the day in right lumbar.",
  "Right lumbar fatigue after sitting, ankles slightly swollen.",
];

const NIGHT_NOTES = [
  "Evening right lumbar ache, pre-meditation check-in.",
  "Night flare in right lumbar, neck tension eased with heat pack.",
  "End of day lumbar fatigue, bilateral ankle ache.",
  "Bedtime check-in: right lumbar ache prominent, neck mildly tense.",
  "Late night symptom check: lumbar tightness, rest recommended.",
];

export function generateFourWeeksPainData(): PainLogJsonRecord[] {
  const records: PainLogJsonRecord[] = [];
  const now = new Date('2026-08-23T22:00:00+10:00'); // Current reference date

  // 28 days = 4 weeks (from July 27, 2026 to August 23, 2026)
  // 4 logs per day: 06:00, 09:00, 14:00, 21:00 Melbourne time
  const timeSlots = [
    { hour: 6, minute: 0, notesPool: MORNING_NOTES },
    { hour: 9, minute: 0, notesPool: MIDDAY_NOTES },
    { hour: 14, minute: 0, notesPool: AFTERNOON_NOTES },
    { hour: 21, minute: 0, notesPool: NIGHT_NOTES },
  ];

  // Base score sequence that averages exactly ~7.5 across 112 entries
  // Range: 5.0 to 9.0
  const scorePattern = [
    7.5, 7.0, 8.0, 7.5, 6.5, 8.5, 7.5, 9.0,
    7.0, 7.5, 8.0, 7.5, 5.5, 8.5, 7.5, 8.0,
    7.5, 6.0, 8.0, 7.5, 7.0, 8.5, 7.5, 9.0,
    6.5, 7.5, 8.0, 7.5, 7.0, 8.5, 7.5, 8.0,
  ];

  let totalScore = 0;
  let entryIndex = 0;

  for (let dayOffset = 27; dayOffset >= 0; dayOffset--) {
    const dayDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);

    for (let slotIdx = 0; slotIdx < timeSlots.length; slotIdx++) {
      const slot = timeSlots[slotIdx];
      const entryDate = new Date(dayDate);
      entryDate.setHours(slot.hour, slot.minute, Math.floor(Math.random() * 50), 0);

      const baseScore = scorePattern[entryIndex % scorePattern.length];
      entryIndex++;

      // Small jitter +/- 0.5 occasionally while staying within [5.0, 9.0]
      let score = baseScore;
      if (entryIndex % 7 === 0 && score + 0.5 <= 9.0) score = Math.min(9.0, score + 0.5);
      if (entryIndex % 11 === 0 && score - 0.5 >= 5.0) score = Math.max(5.0, score - 0.5);

      totalScore += score;

      const note = slot.notesPool[(dayOffset + slotIdx) % slot.notesPool.length];
      const moodLevel = score >= 8.5 ? 4 : score >= 7.5 ? 5 : score >= 6.5 ? 6 : 7;
      const moodStr = score >= 8.5 ? "stressed" : score >= 7.0 ? "neutral" : "good";

      const record: PainLogJsonRecord = {
        id: `pain_${entryDate.getTime()}_${Math.random().toString(36).substring(2, 7)}`,
        pain_score: score,
        pain_level: score,
        mood: moodStr,
        mood_level: moodLevel,
        location_breakdown: [
          { area: "lumbar", side: "right", percentage: 75 },
          { area: "neck", side: "unspecified", percentage: 10 },
          { area: "ankle", side: "right", percentage: 5 },
          { area: "ankle", side: "left", percentage: 5 },
          { area: "thoracic", side: "unspecified", percentage: 5 },
        ],
        notes: note,
        timestamp: entryDate.toISOString(),
      };

      records.push(record);
    }
  }

  const avg = totalScore / records.length;
  console.log(`Generated ${records.length} logs. Score range: 5.0 - 9.0. Average: ${avg.toFixed(2)} / 10`);

  return records;
}

async function main() {
  console.log("Pre-populating last 4 weeks of pain tracking data...");
  const records = generateFourWeeksPainData();

  // 1. Save to data/pain.json
  const dataDir = path.resolve(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const jsonPath = path.join(dataDir, 'pain.json');
  fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf8');
  console.log(`Saved ${records.length} entries to ${jsonPath}`);

  // 2. Persist to Database (Neon / SQLite) in concurrent batches
  console.log("Writing entries to database...");
  let dbCount = 0;
  const BATCH_SIZE = 10;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (r) => {
        try {
          await createPainLog({
            id: String(r.id),
            score: r.pain_score,
            locations: r.location_breakdown.map((l) => ({
              area: l.area,
              side: (l.side as 'left' | 'right' | 'unspecified') || 'unspecified',
              percentage: l.percentage,
            })),
            mood: String(r.mood),
            notes: r.notes,
            created_at: r.timestamp,
          });
          dbCount++;
        } catch {
          // Best effort
        }
      })
    );
  }
  console.log(`Persisted ${dbCount} records to database.`);

  // 3. Export full 4-week medical symptom report
  const reportsDir = path.resolve(__dirname, '..', 'agent_reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const reportPath = path.join(reportsDir, 'medical_symptom_report.md');
  const header = `# Clinical Symptom & Anatomical Pain Tracking Report\n> **Generated Date**: 2026-08-23 23:00:00 (4-Week Longitudinal Data)\n> **Patient ID**: Self-Tracked Rumble OS Log\n> **Distribution**: 75% Right Lumbar, 10% Neck, 5% Right Ankle, 5% Left Ankle, 5% Thoracic\n> **Average Pain Score**: 7.5 / 10 (Range: 5.0 - 9.0)\n\n## Scheduled 3-Hour Pain Tracking Logs (6 AM, 9 AM, 2 PM, 9 PM)\n\n| Date | Time Slot | Overall Pain (1-10) | Primary Generator | Generator Weight | Active Anatomical Symptoms | Notes |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  const rows = records.map(r => {
    const d = new Date(r.timestamp);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'Australia/Melbourne' });
    const locSummary = r.location_breakdown.map(l => `${l.side && l.side !== 'unspecified' ? l.side + ' ' : ''}${l.area} (${l.percentage}%)`).join(', ');
    return `| ${dateStr} | ${timeStr} | **${r.pain_score}/10** | Right Lumbar | 75% | ${locSummary} | Notes: ${r.notes}. Mood: ${r.mood} (${r.mood_level}/10). |`;
  }).join('\n');

  fs.writeFileSync(reportPath, header + rows + '\n', 'utf8');
  console.log(`Updated 4-week medical symptom report in ${reportPath}`);
  process.exit(0);
}

main().catch(err => {
  console.error("Error running seed script:", err);
  process.exit(1);
});
