const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function run() {
  if (!process.env.NEON_DATABASE_URL) {
    console.error("NO NEON DB URL");
    return;
  }
  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });
  try {
    await pool.query('ALTER TABLE notes ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT FALSE;');
    console.log('Added pinned');
  } catch(e) { console.error('pinned:', e.message); }
  
  try {
    await pool.query('ALTER TABLE notes ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT FALSE;');
    console.log('Added isArchived');
  } catch(e) { console.error('isArchived:', e.message); }
  
  pool.end();
}
run();
