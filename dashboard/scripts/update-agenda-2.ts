import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.NEON_DATABASE_URL!);
  
  // 1. Mark Cops and Rex as done
  await sql`
    UPDATE agenda_items 
    SET status = 'completed', completed_at = now()
    WHERE title ILIKE '%Check in Cops%' OR title ILIKE '%Rex pickup%'
  `;
  console.log('Marked Cops and Rex as done');

  // 2. Move Court Coordinator and Persistent Pain alert to tomorrow morning (Sept 9, 9:00 AM)
  await sql`
    UPDATE agenda_items 
    SET scheduled_time = '2026-09-09T09:00:00+10:00'
    WHERE title ILIKE '%Wangaratta Court Coordinator%' OR title ILIKE '%Action Required: RE: Appointment Adjustment Request%'
  `;
  console.log('Moved Court Coordinator and Persistent Pain tasks to tomorrow morning');
}

main().catch(console.error);
