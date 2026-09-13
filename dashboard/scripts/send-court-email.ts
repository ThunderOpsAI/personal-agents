import { config } from 'dotenv';
config({ path: '.env.local' });
import { fetchLiveGmailMessages, sendLiveGmailMessage } from '../lib/google-auth';
import { neon } from '@neondatabase/serverless';

async function main() {
  const result = await fetchLiveGmailMessages({
    query: 'wangarattacoordinator@courts.vic.gov.au',
    maxResults: 2
  });
  
  let threadId = undefined;
  if (result.status === 'success' && result.messages) {
    const msg = result.messages.find(m => m.id === '1a045f4c6949f7e1' || m.id === '1a041f63cf1b0908');
    if (msg) threadId = msg.threadId;
  }

  const sendResult = await sendLiveGmailMessage({
    to: 'wangarattacoordinator@courts.vic.gov.au',
    subject: 'RE: Request for Video Link Appearances & Case Updates - James Jones',
    body: `Dear Wangaratta Court Coordinator,

Thank you for confirming I may appear online for my matters listed on 11 and 14 September 2026.

However, I am very concerned by your note that the duty solicitor service is unavailable on 11 September. It does not seem fair or equitable that I will be deprived of the opportunity to speak with a duty solicitor for my appearance on that date, especially given my circumstances and need for legal guidance.

I have already contacted Legal Aid and the Help Before Court service regarding this, and I am currently waiting to hear back from them.

In the meantime, could you please advise what alternative arrangements can be made? For example, would it be possible for me to come in on Wednesday (9th) or Thursday (10th) this week to speak with a duty solicitor ahead of Friday's appearance? If this or another alternative is not possible, should this matter be adjourned to a date when a duty solicitor is available?

I look forward to your guidance on how to proceed.

Sincerely,
James Jones`,
    threadId: threadId || '1a041f63cf1b0908' // fallback
  });

  console.log('Send result:', sendResult);

  // Mark the agenda item as completed
  const sql = neon(process.env.NEON_DATABASE_URL!);
  await sql`
    UPDATE agenda_items 
    SET status = 'completed', completed_at = now()
    WHERE title ILIKE '%Wangaratta Court Coordinator%'
  `;
  console.log('Marked agenda item as completed');
}

main().catch(console.error);
