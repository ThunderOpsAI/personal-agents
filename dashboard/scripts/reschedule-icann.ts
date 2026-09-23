import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.NEON_DATABASE_URL!);

  // Fetch current item
  const rows = await sql`
    SELECT * FROM agenda_items WHERE id = 'agenda_icann_1789663062554'
  `;
  console.log('Current item:', rows);

  let auditTrail: any[] = [];
  if (rows.length > 0 && rows[0].audit_trail) {
    try {
      auditTrail = typeof rows[0].audit_trail === 'string' 
        ? JSON.parse(rows[0].audit_trail) 
        : rows[0].audit_trail;
    } catch {
      auditTrail = [];
    }
  }

  auditTrail.push({
    timestamp: new Date().toISOString(),
    previous_status: 'pending',
    new_status: 'pending',
    note: 'Rescheduled to Saturday 26 Sept 2026 at 10:00 AM (10:00 - 10:30 AM window) per user request'
  });

  await sql`
    UPDATE agenda_items
    SET scheduled_time = '2026-09-26T10:00:00+10:00',
        title = 'Icann Consultation / Prescription Appointment (10:00 - 10:30 AM)',
        audit_trail = ${JSON.stringify(auditTrail)},
        updated_at = now()
    WHERE id = 'agenda_icann_1789663062554'
  `;

  const updatedRows = await sql`
    SELECT * FROM agenda_items WHERE id = 'agenda_icann_1789663062554'
  `;
  console.log('Updated item:', updatedRows);
}

main().catch(console.error);
