import "dotenv/config";
import { sendLiveGmailMessage } from "./dashboard/lib/google-auth";

export const emailDetails = {
  to: "support@fortunica.casino",
  subject: "Inquiry Regarding Recommended Cryptocurrency Withdrawal Methods - James Jones",
  body: `Hello Fortunica Support,

Following your advice to use cryptocurrency for withdrawals to bypass banking bounce-backs, could you please let me know which specific cryptocurrency withdrawal method your team of experts recommends using for the fastest and most reliable processing?

Thank you,
James Jones
thunderops.ai@gmail.com`
};

async function main() {
  console.log("Sending email with details:", emailDetails);
  const result = await sendLiveGmailMessage(emailDetails);
  console.log("Result:", JSON.stringify(result, null, 2));
}

if (process.argv.includes("--send")) {
  main().catch(console.error);
}
