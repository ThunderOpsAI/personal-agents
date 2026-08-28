import { generateBriefing } from "./lib/agents/briefing-engine";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

(async () => {
  const html = await generateBriefing([], "morning");
  console.log("OUTPUT:");
  console.log(html);
})();
