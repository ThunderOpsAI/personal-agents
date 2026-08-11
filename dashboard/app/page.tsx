import { ExerciseExplorer } from "../components/ExerciseExplorer";
import { RumbleChat } from "../components/RumbleChat";

export default function DashboardPage() {
  return (
    <main className="dashboard-shell">
      <header>
        <h1>Rumble OS</h1>
        <p>Daily schedule</p>
      </header>
      <ExerciseExplorer />
      <RumbleChat />
    </main>
  );
}
