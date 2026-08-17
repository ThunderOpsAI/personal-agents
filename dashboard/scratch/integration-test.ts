import { config } from 'dotenv';
config({ path: '.env.local' });

import { routeChatMessage, executeConfirmedAction } from '../lib/agents/intent-router';

async function runTest() {
  console.log("=== 1. Testing routeChatMessage ===");
  const prompt = "add to calendar Court for Tavern 11th September, and for tomorrow to Call Clancy, check my emails from deakin for the ticket number and who to call, and log pain 100% at right ankle level 8 mood [X].";
  
  const result = await routeChatMessage(prompt);
  
  console.log("Reply from Rumble:", result.reply);
  console.log("Intent:", result.intent);
  console.log("Requires Confirmation:", result.requires_confirmation);
  console.log("Preview object:", JSON.stringify(result.preview, null, 2));

  if (result.requires_confirmation && result.preview) {
    console.log("\n=== 2. Testing executeConfirmedAction ===");
    try {
      const execResult = await executeConfirmedAction(result.preview);
      console.log("Execution Result:", JSON.stringify(execResult, null, 2));
    } catch (e: any) {
      console.error("Execution failed:", e.message);
    }
  } else {
    console.log("No preview generated. Test failed.");
  }
}

runTest().catch(console.error);
