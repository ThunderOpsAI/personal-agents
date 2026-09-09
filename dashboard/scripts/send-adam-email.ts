import { config } from 'dotenv';
config({ path: '.env.local' });
import { sendLiveGmailMessage } from '../lib/google-auth';

async function main() {
  const result = await sendLiveGmailMessage({
    to: 'adam.alderson@police.vic.gov.au',
    subject: 'Request for Brief of Evidence - James Jones',
    body: `Dear Adam,

I am writing to respectfully request a copy of my brief of evidence. I have been having difficulty obtaining a copy from my solicitor, Mr. Geoff Clancy, and with my upcoming court date on September 14, it is critical that I have access to these documents as soon as possible.

Could you please forward the brief to me directly?

Thank you for your assistance.

Sincerely,
James Jones`
  });

  console.log('Send result:', result);
}

main().catch(console.error);
