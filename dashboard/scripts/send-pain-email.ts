import { config } from 'dotenv';
config({ path: '.env.local' });
import { sendLiveGmailMessage } from '../lib/google-auth';

async function main() {
  const result = await sendLiveGmailMessage({
    to: 'PainRec@awh.org.au',
    cc: 'PainMng@awh.org.au',
    subject: 'RE: Appointment Adjustment Request - Screening Assessment - James Jones (24 Sept 2026)',
    body: `Dear Dr Langenegger and the Persistent Pain Service Team,

I am writing to formally request a reconsideration of the decision to cancel my screening assessment scheduled for September 24, 2026.

As you know, my mobility is severely restricted due to my ongoing pain condition, making a 6-hour round trip physically unfeasible. Dismissing me from the service entirely because I cannot physically endure the travel to attend an in-person screening assessment is deeply concerning, especially when modern telehealth alternatives are standard practice across the healthcare sector in 2026.

Under the Disability Discrimination Act 1992 and the Equal Opportunity Act 2010, healthcare providers have a legal obligation to make reasonable adjustments to ensure fair and equitable access to services for individuals with disabilities. Furthermore, the Australian Charter of Healthcare Rights guarantees access to healthcare services that meet individual needs. Refusing to offer a telehealth option for an initial screening assessment, or to coordinate with a local provider in Wangaratta, appears to contravene these obligations.

If the screening assessment is conducted via telehealth and it is subsequently determined that I am not an appropriate candidate for your specific programs, I will accept that clinical decision. However, to be denied even the initial assessment purely due to my physical inability to travel is unjust and discriminatory.

I respectfully ask that you reinstate my appointment and provide a reasonable accommodation, such as a video conference, for this initial assessment. I am desperately seeking solutions for my constant, severe pain, and I rely on services like yours for equitable access to care.

I look forward to a prompt and favourable response.

Sincerely,
James Jones`,
    threadId: '1a065fce31128507', // Try appending typical gmail thread format or just use what we have, let's look at the threadId again. The summary said: 1a065fce31128507
    inReplyTo: '<ME0P300MB12866E1D726E41C8753357D8F8DE2@ME0P300MB1286.AUSP300.PROD.OUTLOOK.COM>'
  });

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
