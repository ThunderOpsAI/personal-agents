import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getDriveFiles,
  getDriveFileContent,
  uploadDriveFile,
  updateDriveFile,
  deleteDriveFile,
} from "./drive";
import * as driveLib from "../../dashboard/lib/google-drive";

describe("Google Drive Tools & Approval Safety Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Read Operations (No Approval Needed)", () => {
    it("fetches drive files without requiring approval", async () => {
      vi.spyOn(driveLib, "fetchLiveDriveFiles").mockResolvedValue({
        status: "success",
        files: [
          {
            id: "file_123",
            name: "Medical_Report.pdf",
            mimeType: "application/pdf",
            size: "102400",
            createdTime: "2026-09-01T10:00:00Z",
            modifiedTime: "2026-09-01T10:00:00Z",
          },
        ],
      });

      const res = await getDriveFiles.execute({ query: "Medical" });
      expect(res.oauthStatus.authenticated).toBe(true);
      expect(res.files).toHaveLength(1);
      expect(res.files[0].id).toBe("file_123");
      expect(res.files[0].name).toBe("Medical_Report.pdf");
    });

    it("fetches drive file content without requiring approval", async () => {
      const dummyBuffer = new ArrayBuffer(8);
      vi.spyOn(driveLib, "fetchLiveDriveFileContent").mockResolvedValue({
        status: "success",
        content: dummyBuffer,
      });

      const res = await getDriveFileContent.execute({ fileId: "file_123" });
      expect(res.oauthStatus.authenticated).toBe(true);
      expect(res.content).toBe(dummyBuffer);
    });

    it("handles auth_required for getDriveFiles gracefully", async () => {
      vi.spyOn(driveLib, "fetchLiveDriveFiles").mockResolvedValue({
        status: "auth_required",
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        message: "Google Drive authorization required",
      });

      const res = await getDriveFiles.execute();
      expect(res.oauthStatus.authenticated).toBe(false);
      expect(res.oauthStatus.authUrl).toBe("https://accounts.google.com/o/oauth2/v2/auth");
      expect(res.files).toHaveLength(0);
    });
  });

  describe("Write/Modify/Delete Operations (Requires Approval)", () => {
    it("blocks uploadDriveFile when approval is missing", async () => {
      const spy = vi.spyOn(driveLib, "uploadLiveDriveFile");
      const res = await uploadDriveFile.execute({
        name: "test.txt",
        content: "hello world",
        mimeType: "text/plain",
      });

      expect(res.success).toBe(false);
      expect(res.needsApproval).toBeDefined();
      expect(res.needsApproval?.toolName).toBe("uploadDriveFile");
      expect(res.needsApproval?.action).toBe("upload");
      expect(res.needsApproval?.status).toBe("pending_approval");
      expect(spy).not.toHaveBeenCalled();
    });

    it("executes uploadDriveFile when approved", async () => {
      vi.spyOn(driveLib, "uploadLiveDriveFile").mockResolvedValue({
        status: "success",
        fileId: "drive_new_999",
      });

      const res = await uploadDriveFile.execute(
        {
          name: "test.txt",
          content: "hello world",
          mimeType: "text/plain",
        },
        { approved: true, approvalId: "appr_test_1" }
      );

      expect(res.success).toBe(true);
      expect(res.fileId).toBe("drive_new_999");
      expect(res.needsApproval).toBeUndefined();
    });

    it("blocks updateDriveFile when approval is missing", async () => {
      const spy = vi.spyOn(driveLib, "updateLiveDriveFile");
      const res = await updateDriveFile.execute({
        fileId: "file_123",
        name: "updated.txt",
      });

      expect(res.success).toBe(false);
      expect(res.needsApproval).toBeDefined();
      expect(res.needsApproval?.toolName).toBe("updateDriveFile");
      expect(res.needsApproval?.action).toBe("update");
      expect(spy).not.toHaveBeenCalled();
    });

    it("executes updateDriveFile when approved", async () => {
      vi.spyOn(driveLib, "updateLiveDriveFile").mockResolvedValue({
        status: "success",
        fileId: "file_123",
      });

      const res = await updateDriveFile.execute(
        { fileId: "file_123", name: "updated.txt" },
        { approved: true }
      );

      expect(res.success).toBe(true);
      expect(res.fileId).toBe("file_123");
      expect(res.needsApproval).toBeUndefined();
    });

    it("blocks deleteDriveFile when approval is missing", async () => {
      const spy = vi.spyOn(driveLib, "deleteLiveDriveFile");
      const res = await deleteDriveFile.execute({
        fileId: "file_delete_target",
      });

      expect(res.success).toBe(false);
      expect(res.needsApproval).toBeDefined();
      expect(res.needsApproval?.toolName).toBe("deleteDriveFile");
      expect(res.needsApproval?.action).toBe("delete");
      expect(spy).not.toHaveBeenCalled();
    });

    it("executes deleteDriveFile when approved", async () => {
      vi.spyOn(driveLib, "deleteLiveDriveFile").mockResolvedValue({
        status: "success",
      });

      const res = await deleteDriveFile.execute(
        { fileId: "file_delete_target" },
        { approved: true }
      );

      expect(res.success).toBe(true);
      expect(res.fileId).toBe("file_delete_target");
      expect(res.needsApproval).toBeUndefined();
    });
  });
});
