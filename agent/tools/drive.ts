import { defineTool, createNeedsApprovalResponse, ToolOptions } from "./defineTool";
import { OAuthStatus, ToolActionResult } from "./types";
import {
  fetchLiveDriveFiles,
  fetchLiveDriveFileContent,
  uploadLiveDriveFile,
  updateLiveDriveFile,
  deleteLiveDriveFile,
} from "../../dashboard/lib/google-drive";

export interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export interface DriveActionResult<T = unknown> extends ToolActionResult<T> {
  fileId?: string;
}

export const getDriveFiles = defineTool({
  name: "getDriveFiles",
  description: "Read-only fetch of Google Drive files. Does not require approval.",
  execute: async (params?: {
    query?: string;
    folderId?: string;
    maxResults?: number;
    mimeType?: string;
  }) => {
    const res = await fetchLiveDriveFiles(params);
    if (res.status === "auth_required") {
      return {
        files: [],
        oauthStatus: {
          authenticated: false,
          authUrl: res.authUrl,
          error: res.message || "OAuth authorization required",
        },
      };
    }
    if (res.status === "error" || !res.files) {
      return {
        files: [],
        oauthStatus: {
          authenticated: false,
          error: res.message || "Failed to fetch Drive files",
        },
      };
    }
    const files: DriveFile[] = res.files.map((f: any) => ({
      id: f.id,
      name: f.name || "Untitled",
      mimeType: f.mimeType,
      size: f.size,
      createdTime: f.createdTime,
      modifiedTime: f.modifiedTime,
    }));
    return { files, oauthStatus: { authenticated: true } };
  },
});

export const getDriveFileContent = defineTool({
  name: "getDriveFileContent",
  description: "Read-only fetch of Google Drive file content. Does not require approval.",
  execute: async (params: { fileId: string }) => {
    const res = await fetchLiveDriveFileContent(params.fileId);
    if (res.status === "auth_required") {
      return {
        content: null,
        oauthStatus: {
          authenticated: false,
          authUrl: res.authUrl,
          error: res.message || "OAuth authorization required",
        },
      };
    }
    if (res.status === "error" || !res.content) {
      return {
        content: null,
        oauthStatus: {
          authenticated: false,
          error: res.message || "Failed to download Drive file",
        },
      };
    }
    return {
      content: res.content,
      mimeType: (res as any).mimeType || "application/octet-stream",
      oauthStatus: { authenticated: true },
    };
  },
});

export const uploadDriveFile = defineTool({
  name: "uploadDriveFile",
  description: "Uploads a new file to Google Drive. Requires explicit user approval.",
  execute: async (
    params: { name: string; content: Buffer | string; mimeType: string; folderId?: string },
    options?: ToolOptions
  ): Promise<DriveActionResult<{ fileId: string }>> => {
    if (!options?.approved) {
      return createNeedsApprovalResponse("uploadDriveFile", "upload", params, options?.approvalId);
    }
    const res = await uploadLiveDriveFile(params);
    if (res.status === "error") {
      return {
        success: false,
        error: res.message || "Failed to upload file to Google Drive",
      };
    }
    const fileId = res.fileId || `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      fileId,
      data: { fileId },
    };
  },
});

export const updateDriveFile = defineTool({
  name: "updateDriveFile",
  description: "Updates an existing file in Google Drive. Requires explicit user approval.",
  execute: async (
    params: { fileId: string; name?: string; content?: Buffer | string; mimeType?: string },
    options?: ToolOptions
  ): Promise<DriveActionResult<{ fileId: string }>> => {
    if (!options?.approved) {
      return createNeedsApprovalResponse("updateDriveFile", "update", params, options?.approvalId);
    }
    const res = await updateLiveDriveFile(params);
    if (res.status === "error") {
      return {
        success: false,
        error: res.message || "Failed to update Google Drive file",
      };
    }
    const fileId = res.fileId || params.fileId;
    return {
      success: true,
      fileId,
      data: { fileId },
    };
  },
});

export const deleteDriveFile = defineTool({
  name: "deleteDriveFile",
  description: "Deletes a file from Google Drive. Requires explicit user approval.",
  execute: async (
    params: { fileId: string },
    options?: ToolOptions
  ): Promise<DriveActionResult<{ fileId: string }>> => {
    if (!options?.approved) {
      return createNeedsApprovalResponse("deleteDriveFile", "delete", params, options?.approvalId);
    }
    const res = await deleteLiveDriveFile(params.fileId);
    if (res.status === "error") {
      return {
        success: false,
        error: res.message || "Failed to delete Google Drive file",
      };
    }
    return {
      success: true,
      fileId: params.fileId,
      data: { fileId: params.fileId },
    };
  },
});
