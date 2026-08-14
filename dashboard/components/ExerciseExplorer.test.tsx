import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExerciseExplorer } from "./ExerciseExplorer";
import type { ExerciseRecommendation } from "./exercise-types";

const recommendation: ExerciseRecommendation = {
  id: "live-id",
  name: "Live exercise",
  instruction: "Live instruction",
};

function mockSuggestions(suggestions = [recommendation]) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ suggestions }) }));
}

afterEach(() => vi.unstubAllGlobals());

describe("ExerciseExplorer", () => {
  it("opens and closes the demonstration without leaving the schedule", async () => {
    mockSuggestions();
    render(<ExerciseExplorer />);
    await screen.findByRole("button", { name: "Show Me" });
    fireEvent.click(screen.getByRole("button", { name: "Show Me" }));
    expect(screen.getByRole("dialog", { name: "Live exercise" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("not available");
    fireEvent.click(screen.getByRole("button", { name: "Close exercise demonstration" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Explore Exercises" })).toBeInTheDocument();
  });

  it("closes the demonstration with Escape", async () => {
    mockSuggestions();
    render(<ExerciseExplorer />);
    fireEvent.click(await screen.findByRole("button", { name: "Show Me" }));
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows an explicit unavailable state when live media is absent", async () => {
    mockSuggestions([{ ...recommendation, image_url: undefined, media_url: undefined, video_url: undefined }]);
    render(<ExerciseExplorer />);
    fireEvent.click(await screen.findByRole("button", { name: "Show Me" }));
    expect(screen.getByRole("status")).toHaveTextContent("demonstration is not available");
  });
});
