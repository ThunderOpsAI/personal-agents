import { createPainLog, getPainLogsFromDb } from '../dashboard/lib/db';

interface CheckinPreset {
  score: number;
  mood: string;
  notes: string;
  locations: Array<{ area: string; side?: string; percentage: number }>;
}

const PRESETS: Record<string, CheckinPreset[]> = {
  slot_10am: [
    {
      score: 6.4,
      mood: "managing",
      notes: "Morning check-in. Lumbar stiffness easing after morning movement, mild right lower limb ache.",
      locations: [
        { area: "lumbar", side: "right", percentage: 70 },
        { area: "ankle", side: "right", percentage: 15 },
        { area: "thoracic", side: "unspecified", percentage: 15 }
      ]
    },
    {
      score: 6.7,
      mood: "focused",
      notes: "10am check-in. Morning baseline stable, right lumbar tightness manageable.",
      locations: [
        { area: "lumbar", side: "right", percentage: 65 },
        { area: "cervical", side: "unspecified", percentage: 15 },
        { area: "thoracic", side: "unspecified", percentage: 20 }
      ]
    },
    {
      score: 6.2,
      mood: "calm",
      notes: "Morning check-in. Gentle mobility helped reduce wake-up stiffness.",
      locations: [
        { area: "lumbar", side: "right", percentage: 60 },
        { area: "knee", side: "right", percentage: 20 },
        { area: "thoracic", side: "unspecified", percentage: 20 }
      ]
    }
  ],
  slot_2pm: [
    {
      score: 7.2,
      mood: "fatigued",
      notes: "2pm check-in. Desk posture fatigue building into lower back and glutes.",
      locations: [
        { area: "lumbar", side: "right", percentage: 50 },
        { area: "glutes", side: "unspecified", percentage: 25 },
        { area: "thoracic", side: "unspecified", percentage: 25 }
      ]
    },
    {
      score: 6.8,
      mood: "managing",
      notes: "Afternoon check-in. Taking standing breaks, right lumbar ache present.",
      locations: [
        { area: "lumbar", side: "right", percentage: 65 },
        { area: "thoracic", side: "unspecified", percentage: 20 },
        { area: "cervical", side: "unspecified", percentage: 15 }
      ]
    },
    {
      score: 7.4,
      mood: "tired",
      notes: "Midday check-in. Lumbar strain with slight nerve irritation down right leg.",
      locations: [
        { area: "lumbar", side: "right", percentage: 60 },
        { area: "sciatica", side: "right", percentage: 25 },
        { area: "thoracic", side: "unspecified", percentage: 15 }
      ]
    }
  ],
  slot_6pm: [
    {
      score: 5.2,
      mood: "relieved",
      notes: "Evening check-in. Good hydrotherapy session, warm water buoyancy easing spinal load.",
      locations: [
        { area: "lumbar", side: "right", percentage: 75 },
        { area: "cervical", side: "unspecified", percentage: 25 }
      ]
    },
    {
      score: 6.9,
      mood: "tired",
      notes: "6pm check-in. End of day fatigue, resting with heat pack across lumbar.",
      locations: [
        { area: "lumbar", side: "right", percentage: 65 },
        { area: "thoracic", side: "unspecified", percentage: 20 },
        { area: "cervical", side: "unspecified", percentage: 15 }
      ]
    },
    {
      score: 6.5,
      mood: "managing",
      notes: "Evening check-in. Reclined rest helping decompress lumbar spine.",
      locations: [
        { area: "lumbar", side: "right", percentage: 70 },
        { area: "ankle", side: "right", percentage: 15 },
        { area: "thoracic", side: "unspecified", percentage: 15 }
      ]
    }
  ],
  slot_10pm: [
    {
      score: 5.8,
      mood: "calm",
      notes: "10pm night check-in. Preparing for sleep meditation, pain settled after evening routine.",
      locations: [
        { area: "lumbar", side: "right", percentage: 65 },
        { area: "thoracic", side: "unspecified", percentage: 20 },
        { area: "cervical", side: "unspecified", percentage: 15 }
      ]
    },
    {
      score: 6.2,
      mood: "tired",
      notes: "Night check-in. Lower back ache manageable with supportive pillow setup.",
      locations: [
        { area: "lumbar", side: "right", percentage: 70 },
        { area: "cervical", side: "unspecified", percentage: 15 },
        { area: "ankle", side: "right", percentage: 15 }
      ]
    },
    {
      score: 5.5,
      mood: "relaxed",
      notes: "Night check-in. Reclined resting, lumbar comfortable for bed.",
      locations: [
        { area: "lumbar", side: "right", percentage: 70 },
        { area: "thoracic", side: "unspecified", percentage: 30 }
      ]
    }
  ]
};

interface SlotConfig {
  name: string;
  hour: number; // Melbourne hour
  minute: number;
  windowStartMin: number; // minutes from midnight
  windowEndMin: number;
  presetKey: string;
}

const SLOTS: SlotConfig[] = [
  { name: '10:00 AM', hour: 10, minute: 0, windowStartMin: 8 * 60 + 30, windowEndMin: 11 * 60 + 30, presetKey: 'slot_10am' },
  { name: '2:00 PM', hour: 14, minute: 0, windowStartMin: 12 * 60 + 45, windowEndMin: 15 * 60 + 30, presetKey: 'slot_2pm' },
  { name: '6:00 PM', hour: 18, minute: 0, windowStartMin: 16 * 60 + 30, windowEndMin: 19 * 60 + 30, presetKey: 'slot_6pm' },
  { name: '10:00 PM', hour: 22, minute: 0, windowStartMin: 20 * 60 + 30, windowEndMin: 23 * 60 + 59, presetKey: 'slot_10pm' },
];

export async function runBackfill(dryRun = true) {
  const existingLogs = await getPainLogsFromDb();
  console.log(`Fetched ${existingLogs.length} existing pain logs from DB.`);

  const days = [
    '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08',
    '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12',
    '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16',
    '2026-10-17', '2026-10-18'
  ];

  let totalBackfilled = 0;

  for (let dIdx = 0; dIdx < days.length; dIdx++) {
    const day = days[dIdx];
    const dayLogs = existingLogs.filter((l) => {
      const melDate = new Date(l.created_at).toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' });
      return melDate === day;
    });

    console.log(`\n--- ${day} (Existing: ${dayLogs.length}) ---`);

    for (let sIdx = 0; sIdx < SLOTS.length; sIdx++) {
      const slot = SLOTS[sIdx];
      // Check if any existing log falls within this slot window
      const hasLog = dayLogs.some((l) => {
        const d = new Date(l.created_at);
        const melStr = d.toLocaleTimeString('en-GB', { timeZone: 'Australia/Melbourne' }); // HH:MM:SS
        const [h, m] = melStr.split(':').map(Number);
        const mins = h * 60 + m;
        return mins >= slot.windowStartMin && mins <= slot.windowEndMin;
      });

      if (hasLog) {
        console.log(`  [OK] ${slot.name} slot already covered.`);
        continue;
      }

      // Generate random offset between -10 and +10 minutes (-600 to +600 seconds)
      const offsetSeconds = Math.floor(Math.random() * 1201) - 600;
      const targetSec = slot.hour * 3600 + slot.minute * 60 + offsetSeconds;
      const h = Math.floor(targetSec / 3600);
      const m = Math.floor((targetSec % 3600) / 60);
      const s = targetSec % 60;

      const pad = (n: number) => String(n).padStart(2, '0');
      const timeStr = `${pad(h)}:${pad(m)}:${pad(s)}`;
      const isoTimestamp = `${day}T${timeStr}+11:00`;

      // Select preset
      const presets = PRESETS[slot.presetKey];
      const preset = presets[(dIdx + sIdx) % presets.length];

      console.log(`  [BACKFILL] ${slot.name} -> Target: ${timeStr} (Offset: ${offsetSeconds > 0 ? '+' : ''}${Math.round(offsetSeconds/60)}m) | Score: ${preset.score}/10 | Notes: "${preset.notes.slice(0, 40)}..."`);

      if (!dryRun) {
        await createPainLog({
          score: preset.score,
          locations: preset.locations.map(l => ({
            area: l.area,
            side: (l.side as any) || 'unspecified',
            percentage: l.percentage,
          })),
          mood: preset.mood,
          notes: preset.notes,
          created_at: isoTimestamp,
        });
      }
      totalBackfilled++;
    }
  }

  console.log(`\nBackfill Summary: ${totalBackfilled} missing logs ${dryRun ? 'identified (DRY RUN)' : 'created in live Neon database'}.`);
}

const isExecute = process.argv.includes('--execute');
runBackfill(!isExecute).catch(console.error);
