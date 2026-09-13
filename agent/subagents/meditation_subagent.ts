import { defineAgent } from "./defineAgent";

export interface MeditationProtocol {
  id: string;
  timeSlot: "21:00" | "00:00";
  title: string;
  durationMinutes: number;
  focus: string;
  audioPrompt: string;
}

export const meditationSubagent = defineAgent({
  id: "meditation_subagent",
  name: "Meditation Protocol Subagent",
  schedule: "0 21,0 * * *",
  timezone: "Australia/Melbourne",
  instructions:
    "Injects nightly Meditation Protocols into the daily chronological agenda at 21:00 PM and 00:00 AM Australia/Melbourne.",
  handler: async (context?: { timeSlot?: "21:00" | "00:00" }) => {
    const slot = context?.timeSlot ?? "21:00";

    const insightTracks = [
      "https://insig.ht/WNXkIEmD35b",
      "https://insig.ht/iOHiTPpD35b",
      "https://insig.ht/0aQuRDrD35b",
      "https://insig.ht/9XyOUPsD35b"
    ];
    
    // Rotate based on day of year, shifted by slot to give different tracks for 21:00 vs 00:00
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const slotOffset = slot === "21:00" ? 0 : 1;
    const trackLink = insightTracks[(dayOfYear + slotOffset) % 4];

    const protocol: MeditationProtocol =
      slot === "21:00"
        ? {
            id: "med_evening_2100",
            timeSlot: "21:00",
            title: "Evening Somatic Relaxation & Parasympathetic Wind-Down",
            durationMinutes: 15,
            focus: "Progressive muscle relaxation and parasympathetic breathing (4-7-8)",
            audioPrompt: `Focus on releasing tension in lower back, hips, and shoulders before sleep. \nInsight Timer Track: ${trackLink}`,
          }
        : {
            id: "med_midnight_0000",
            timeSlot: "00:00",
            title: "Midnight Sleep Restoration & Pain Distraction Protocol",
            durationMinutes: 20,
            focus: "Body scan meditation and deep restorative sleep induction",
            audioPrompt: `Slow rhythmic breathing focusing on physical ease and nervous system calm. \nInsight Timer Track: ${trackLink}`,
          };

    return {
      timestamp: now.toISOString(),
      timezone: "Australia/Melbourne",
      timeSlot: slot,
      protocol,
    };
  },
});

export default meditationSubagent;
