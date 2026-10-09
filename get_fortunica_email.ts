import { getGmailMessages } from './agent/tools/gmail';

async function main() {
    console.log("Fetching emails...");
    const result = await getGmailMessages.execute({ query: "fortunica", maxResults: 10 });
    console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
