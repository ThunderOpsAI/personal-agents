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

  it("renders a privacy-enhanced YouTube iframe when video_url is a YouTube link", async () => {
    mockSuggestions([{ ...recommendation, video_url: "https://www.youtube.com/watch?v=zeWO_635loM" }]);
    render(<ExerciseExplorer />);
    fireEvent.click(await screen.findByRole("button", { name: "Show Me" }));
    const iframe = screen.getByTitle("Live exercise demonstration") as HTMLIFrameElement;
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toBe("https://www.youtube-nocookie.com/embed/zeWO_635loM");
    expect(iframe.getAttribute("allow")).toContain("accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    expect(iframe.getAttribute("allowfullscreen")).not.toBeNull();
  });

  it("renders a video element when mediaUrl points to a direct video file", async () => {
    mockSuggestions([{ ...recommendation, video_url: "https://example.com/demo.mp4" }]);
    render(<ExerciseExplorer />);
    fireEvent.click(await screen.findByRole("button", { name: "Show Me" }));
    const video = screen.getByLabelText("Live exercise demonstration") as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.src).toBe("https://example.com/demo.mp4");
  });

  it("renders an img element when mediaUrl points to an image", async () => {
    mockSuggestions([{ ...recommendation, image_url: "https://example.com/demo.jpg" }]);
    render(<ExerciseExplorer />);
    fireEvent.click(await screen.findByRole("button", { name: "Show Me" }));
    const img = screen.getByAltText("Demonstration for Live exercise") as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe("https://example.com/demo.jpg");
  });
});
