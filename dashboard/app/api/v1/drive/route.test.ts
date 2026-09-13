/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as listFiles, POST as uploadFile } from "./route";
import {
  GET as getFileContent,
  PATCH as updateFile,
  DELETE as deleteFile,
} from "./[fileId]/route";
import * as driveLib from "../../../../lib/google-drive";

describe("Drive API Routes: /api/v1/drive", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/v1/drive", () => {
    it("returns list of files successfully", async () => {
      vi.spyOn(driveLib, "fetchLiveDriveFiles").mockResolvedValue({
        status: "success",
        files: [{ id: "f1", name: "Doc1.pdf", mimeType: "application/pdf" }],
      });

      const req = new Request("https://rumble.test/api/v1/drive?q=Doc1");
      const res = await listFiles(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.files).toHaveLength(1);
      expect(data.files[0].name).toBe("Doc1.pdf");
    });

    it("returns 401 when auth is required", async () => {
      vi.spyOn(driveLib, "fetchLiveDriveFiles").mockResolvedValue({
        status: "auth_required",
        authUrl: "https://auth.google.com",
        message: "Drive auth required",
      });

      const req = new Request("https://rumble.test/api/v1/drive");
      const res = await listFiles(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.status).toBe("auth_required");
      expect(data.authUrl).toBe("https://auth.google.com");
    });
  });

  describe("POST /api/v1/drive", () => {
    it("requires approval before uploading", async () => {
      const spy = vi.spyOn(driveLib, "uploadLiveDriveFile");
      const req = new Request("https://rumble.test/api/v1/drive", {
        method: "POST",
        body: JSON.stringify({
          name: "test.txt",
          content: "Hello Drive",
          mimeType: "text/plain",
        }),
      });

      const res = await uploadFile(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("pending_approval");
      expect(data.needsApproval.action).toBe("upload");
      expect(spy).not.toHaveBeenCalled();
    });

    it("uploads when approved is true", async () => {
      vi.spyOn(driveLib, "uploadLiveDriveFile").mockResolvedValue({
        status: "success",
        fileId: "created_drive_file_123",
      });

      const req = new Request("https://rumble.test/api/v1/drive", {
        method: "POST",
        body: JSON.stringify({
          name: "test.txt",
          content: "Hello Drive",
          mimeType: "text/plain",
          approved: true,
        }),
      });

      const res = await uploadFile(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.fileId).toBe("created_drive_file_123");
    });
  });

  describe("GET /api/v1/drive/[fileId]", () => {
    it("downloads file content directly", async () => {
      const buffer = Buffer.from("File binary content");
      const exactArrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      vi.spyOn(driveLib, "fetchLiveDriveFileContent").mockResolvedValue({
        status: "success",
        content: exactArrayBuffer,
      });

      const req = new Request("https://rumble.test/api/v1/drive/f1");
      const res = await getFileContent(req, { params: Promise.resolve({ fileId: "f1" }) });
      expect(res.status).toBe(200);
      const arrayBuffer = await res.arrayBuffer();
      expect(Buffer.from(arrayBuffer).toString()).toBe("File binary content");
    });
  });

  describe("PATCH /api/v1/drive/[fileId]", () => {
    it("requires approval before updating", async () => {
      const spy = vi.spyOn(driveLib, "updateLiveDriveFile");
      const req = new Request("https://rumble.test/api/v1/drive/f1", {
        method: "PATCH",
        body: JSON.stringify({
          name: "renamed.txt",
        }),
      });

      const res = await updateFile(req, { params: Promise.resolve({ fileId: "f1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("pending_approval");
      expect(data.needsApproval.action).toBe("update");
      expect(spy).not.toHaveBeenCalled();
    });

    it("updates file when approved is true", async () => {
      vi.spyOn(driveLib, "updateLiveDriveFile").mockResolvedValue({
        status: "success",
        fileId: "f1",
      });

      const req = new Request("https://rumble.test/api/v1/drive/f1", {
        method: "PATCH",
        body: JSON.stringify({
          name: "renamed.txt",
          approved: true,
        }),
      });

      const res = await updateFile(req, { params: Promise.resolve({ fileId: "f1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.fileId).toBe("f1");
    });
  });

  describe("DELETE /api/v1/drive/[fileId]", () => {
    it("requires approval before deleting", async () => {
      const spy = vi.spyOn(driveLib, "deleteLiveDriveFile");
      const req = new Request("https://rumble.test/api/v1/drive/f1", {
        method: "DELETE",
        body: JSON.stringify({}),
      });

      const res = await deleteFile(req, { params: Promise.resolve({ fileId: "f1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("pending_approval");
      expect(data.needsApproval.action).toBe("delete");
      expect(spy).not.toHaveBeenCalled();
    });

    it("deletes file when approved is true", async () => {
      vi.spyOn(driveLib, "deleteLiveDriveFile").mockResolvedValue({
        status: "success",
      });

      const req = new Request("https://rumble.test/api/v1/drive/f1", {
        method: "DELETE",
        body: JSON.stringify({ approved: true }),
      });

      const res = await deleteFile(req, { params: Promise.resolve({ fileId: "f1" }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("success");
      expect(data.fileId).toBe("f1");
    });
  });
});
