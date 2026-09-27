import { sendEmail } from "./agent/tools/gmail";

async function main() {
  const result = await sendEmail.execute({
    to: "support@fortunica.com",
    subject: "Inquiry Regarding Recommended Cryptocurrency Methods",
    body: "Hello Fortunica Support,\n\nI am writing to ask which cryptocurrency method your 'experts' currently recommend using.\n\nThank you,\n[Your Name]"
  }, { approved: true });

  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
