import { getNotes, initDb } from './lib/db';
import dotenv from 'dotenv';
dotenv.config();
async function run() {
  initDb();
  const notes = await getNotes();
  notes.forEach(n => console.log(`ID: ${n.id} | Pinned: ${n.pinned} | Author: ${n.author} | Title: ${n.content.split('\n')[0]}`));
  process.exit(0);
}
run();
