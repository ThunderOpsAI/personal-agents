import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query("ALTER TABLE notes ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'user'");
    console.log("Added author to notes");
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
