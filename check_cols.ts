import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'dashboard/.env.local' });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='notes'");
    console.log("notes cols:", res.rows.map(r => r.column_name));
    const res2 = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name='pain_logs'");
    console.log("pain_logs cols:", res2.rows.map(r => r.column_name));
    
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
