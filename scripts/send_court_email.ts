import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: "dashboard/.env.local" });
dotenv.config({ path: "dashboard/.env" });

import { sendLiveGmailMessage } from "./dashboard/lib/google-auth";

async function sendCourtEmail() {
  console.log(`[${new Date().toISOString()}] Dispatching scheduled court email...`);
  const body = `Dear Wangaratta Court Coordinator,

Thank you for confirming the Webex appearance arrangements for 11 and 14 September 2026.

I note your advice that the duty solicitor service is unavailable on Friday, 11 September.

Because of my physical disability and post-surgical medical restrictions, being unable to speak with the duty solicitor denies me my right to legal counsel prior to my hearing.

I only have two brief questions for the duty solicitor to ensure my matter is handled fairly and properly. Could you please advise if any of the following options can be arranged:

• Consultation on an Alternative Day:
Could I come in (or call in via phone/Webex) on a different day at 9:30 am when a duty solicitor is rostered on?

• Direct Contact:
Can the court provide direct contact details for the local Victoria Legal Aid duty lawyer team so I can speak with someone by phone beforehand?
(Please note I have already contacted Victoria Legal Aid and Help Before Court and am currently waiting to hear back).

I want to make sure I am prepared and that my procedural fairness rights are protected.

Thank you for your assistance.

Kind regards,

James Jones
Phone: 0402 270 259
158 Tone Road, Wangaratta VIC 3677`;

  try {
    const res = await sendLiveGmailMessage({
      to: "wangarattacoordinator@courts.vic.gov.au",
      subject: "RE: Request for Video Link Appearances & Case Updates - James Jones (11 & 14 September)",
      body: body
    });
    console.log("Dispatched successfully:", JSON.stringify(res));
  } catch (err) {
    console.error("Failed to send court email:", err);
  }
}

sendCourtEmail();
