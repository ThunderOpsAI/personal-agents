import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.NEON_DATABASE_URL!);
  
  const courtId = `agenda_court_${Date.now()}`;
  await sql`
    INSERT INTO agenda_items (id, item_type, title, scheduled_time, status, created_at, updated_at)
    VALUES (
      ${courtId}, 
      'appointment', 
      'Court Appearance (Online via Webex) - Links in note', 
      '2026-09-11T09:00:00+10:00', 
      'pending', 
      now(), 
      now()
    )
  `;
  
  // also add a note or just update the title
  await sql`
    UPDATE agenda_items 
    SET title = 'Court Appearance (Online via Webex) - Links: https://csvic.webex.com/csvic/j.php?MTID=me6f9c76f09ebc658f7d844a1facfb3c4 OR https://csvic.webex.com/csvic/j.php?MTID=me884a390768e145c6a0edffbc5787813'
    WHERE id = ${courtId}
  `;

  console.log('Added Court to agenda');
}

main().catch(console.error);
