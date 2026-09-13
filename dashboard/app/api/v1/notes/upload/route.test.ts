/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@vercel/blob", () => {
  return {
    put: vi.fn().mockResolvedValue({ url: "https://public.blob.vercel-storage.com/test-image.jpg" }),
  };
});

describe("API Route: /api/v1/notes/upload", () => {
  it("uploads an image and returns a blob url", async () => {
    const formData = new FormData();
    const file = new File(["test image content"], "test.jpg", { type: "image/jpeg" });
    formData.append("image", file);

    const postReq = new Request("https://rumble.test/api/v1/notes/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(postReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.url).toBe("https://public.blob.vercel-storage.com/test-image.jpg");
  });

  it("returns 400 when no image is provided", async () => {
    const formData = new FormData();

    const postReq = new Request("https://rumble.test/api/v1/notes/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(postReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe("error");
    expect(data.error).toBe("No image file provided");
  });

  it("returns 400 when file is not an image", async () => {
    const formData = new FormData();
    const file = new File(["test text content"], "test.txt", { type: "text/plain" });
    formData.append("image", file);

    const postReq = new Request("https://rumble.test/api/v1/notes/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(postReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe("error");
    expect(data.error).toBe("File must be an image");
  });

  it("returns 400 when file size is over 10MB", async () => {
    const formData = new FormData();
    const largeFile = new File([new Uint8Array(11 * 1024 * 1024)], "large.jpg", { type: "image/jpeg" });
    
    formData.append("image", largeFile);

    const postReq = new Request("https://rumble.test/api/v1/notes/upload", {
      method: "POST",
      body: formData,
    });

    const res = await POST(postReq);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.status).toBe("error");
    expect(data.error).toBe("File size must be less than 10MB");
  });
});
