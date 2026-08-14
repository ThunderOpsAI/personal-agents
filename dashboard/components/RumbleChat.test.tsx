import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RumbleChat } from "./RumbleChat";

afterEach(() => vi.unstubAllGlobals());

describe("RumbleChat", () => {
  it("sends each prompt as a distinct request and renders its live reply", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reply: "First live reply" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ reply: "Second live reply", intent: "conversation" }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<RumbleChat />);

    const messageField = screen.getByLabelText("Message");
    fireEvent.change(messageField, { target: { value: "First prompt" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByText("First live reply", { exact: false });

    fireEvent.change(messageField, { target: { value: "Second prompt" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await screen.findByText("Second live reply", { exact: false });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/rumble/chat", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ message: "First prompt" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/rumble/chat", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ message: "Second prompt" }),
    }));
  });

  it("shows an explicit unavailable state when the live service fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<RumbleChat />);

    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "A live question" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("unavailable"));
  });
});
