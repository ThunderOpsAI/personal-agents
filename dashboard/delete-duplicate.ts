import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query("DELETE FROM notes WHERE id = 'c100266e-38f9-459b-95cd-825cef3199c0'");
  console.log('Deleted duplicate insight note');
  
  // also delete duplicate Dr Reno ones
  await pool.query("DELETE FROM notes WHERE id IN ('9be37a05-8df0-4e54-bdba-87f782950f90', '2467816c-f37d-4688-b5ca-0f06c4a03e40')");
  console.log('Deleted duplicate dr reno notes');
  process.exit(0);
}
run();
