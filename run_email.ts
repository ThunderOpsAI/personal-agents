import { sendEmail } from "./agent/tools/gmail.ts";
import fs from "fs";

const body = fs.readFileSync("/Users/thunderopsai/.gemini/antigravity-cli/brain/93362e87-b351-40ae-8ff2-b2d38f207565/support_email_draft.md", "utf-8");

async function main() {
    const res = await sendEmail.execute({
        to: "support@fortunica",
        subject: "URGENT ESCALATION: VIP Account - Unacceptable Withdrawal Cancellations & Technical Difficulties",
        body: body
    }, { approved: true });
    
    console.log(JSON.stringify(res, null, 2));
}
main();
