import { createPainLog, initDb, ensureTableExists } from './lib/db';
import { CreatePainLogInput } from './lib/schema';
import dotenv from 'dotenv';
dotenv.config();

const locations = [
  { area: 'Lumbar', side: 'unspecified', weight: 78 },
  { area: 'Knee', side: 'left', weight: 2 },
  { area: 'Ankle', side: 'right', weight: 2 },
  { area: 'Thoracic', side: 'unspecified', weight: 2 },
  { area: 'Cervical', side: 'unspecified', weight: 2 },
  { area: 'Sciatica', side: 'unspecified', weight: 8 },
  { area: 'Neck', side: 'unspecified', weight: 3 },
  { area: 'Shoulder', side: 'right', weight: 3 },
];

async function seed() {
  initDb();
  await ensureTableExists();

  const scores = [9, 9, 9, 9, 5, 5, 5, 4];

  // Base date: today at 9:00 AM (2026-09-01T09:00:00+10:00)
  const baseDate = new Date('2026-09-01T09:00:00+10:00').getTime();

  for (let i = 0; i < scores.length; i++) {
    const d = new Date(baseDate - (scores.length - 1 - i) * 60 * 60 * 1000); // spread by 1 hour
    const input: CreatePainLogInput = {
      score: scores[i],
      locations,
      mood: 'Focused',
      notes: 'Generated via sync',
      created_at: d.toISOString(),
    };
    await createPainLog(input);
    console.log(`Inserted pain log with score ${scores[i]} at ${d.toISOString()}`);
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch(console.error);
