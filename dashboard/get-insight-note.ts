import { getNotes, initDb } from './lib/db';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  initDb();
  const notes = await getNotes();
  const insightNote = notes.find(n => n.content.toLowerCase().includes('insight'));
  console.log(insightNote?.content || "Not found");
  process.exit(0);
}
run();
