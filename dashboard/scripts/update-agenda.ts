import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.NEON_DATABASE_URL!);
  
  // 1. Update Legal Aid to Follow-up
  await sql`
    UPDATE agenda_items 
    SET title = 'Follow-up: Call Legal Aid Help Before Court - Ph: (03) 9269 0220 (Ref: 649851)',
        scheduled_time = '2026-09-08T14:30:00+10:00'
    WHERE id = 'agenda_legal_aid_1788749131919'
  `;
  console.log('Updated Legal Aid');

  // 2. Add Trent on Friday 1pm (2026-09-11T13:00:00+10:00)
  const trentId = `agenda_trent_${Date.now()}`;
  await sql`
    INSERT INTO agenda_items (id, item_type, title, scheduled_time, status, created_at, updated_at)
    VALUES (
      ${trentId}, 
      'appointment', 
      'Mental Health appointment with Trent', 
      '2026-09-11T13:00:00+10:00', 
      'pending', 
      now(), 
      now()
    )
  `;
  console.log('Added Trent appointment');
}

main().catch(console.error);
