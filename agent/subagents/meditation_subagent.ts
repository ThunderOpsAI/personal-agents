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

    const protocol: MeditationProtocol =
      slot === "21:00"
        ? {
            id: "med_evening_2100",
            timeSlot: "21:00",
            title: "Evening Somatic Relaxation & Parasympathetic Wind-Down",
            durationMinutes: 15,
            focus: "Progressive muscle relaxation and parasympathetic breathing (4-7-8)",
            audioPrompt: "Focus on releasing tension in lower back, hips, and shoulders before sleep.",
          }
        : {
            id: "med_midnight_0000",
            timeSlot: "00:00",
            title: "Midnight Sleep Restoration & Pain Distraction Protocol",
            durationMinutes: 20,
            focus: "Body scan meditation and deep restorative sleep induction",
            audioPrompt: "Slow rhythmic breathing focusing on physical ease and nervous system calm.",
          };

    return {
      timestamp: new Date().toISOString(),
      timezone: "Australia/Melbourne",
      timeSlot: slot,
      protocol,
    };
  },
});

export default meditationSubagent;
