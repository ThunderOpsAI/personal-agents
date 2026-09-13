import { getGoogleAccessToken, getGoogleAuthUrl } from "./google-auth";

/**
 * Fetch Google Drive files using fresh serverless OAuth token.
 */
export async function fetchLiveDriveFiles(options?: {
  query?: string;
  folderId?: string;
  maxResults?: number;
  mimeType?: string;
}): Promise<{
  status: "success" | "auth_required" | "error";
  files?: any[];
  authUrl?: string;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Google Drive authorization required",
    };
  }

  const params = new URLSearchParams();
  if (options?.maxResults) params.set("pageSize", String(options.maxResults));
  
  let qParts: string[] = [];
  if (options?.query) qParts.push(`name contains '${options.query.replace(/'/g, "\\'")}'`);
  if (options?.folderId) qParts.push(`'${options.folderId}' in parents`);
  if (options?.mimeType) qParts.push(`mimeType = '${options.mimeType}'`);
  
  if (qParts.length > 0) {
    params.set("q", qParts.join(" and "));
  }

  // Request fields
  params.set("fields", "files(id, name, mimeType, size, createdTime, modifiedTime)");

  const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        status: "auth_required",
        authUrl: getGoogleAuthUrl(),
        message: "Google Drive access token expired or invalid",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        message: `Google Drive API error: ${res.statusText}`,
      };
    }

    const data = await res.json();
    return {
      status: "success",
      files: data.files || [],
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message || "Failed to connect to Google Drive service",
    };
  }
}

/**
 * Download a file's content from Google Drive.
 */
export async function fetchLiveDriveFileContent(fileId: string): Promise<{
  status: "success" | "auth_required" | "error";
  content?: ArrayBuffer;
  authUrl?: string;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Google Drive authorization required",
    };
  }

  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        status: "auth_required",
        authUrl: getGoogleAuthUrl(),
        message: "Google Drive access token expired or invalid",
      };
    }

    if (!res.ok) {
      return {
        status: "error",
        message: `Google Drive API error: ${res.statusText}`,
      };
    }

    const content = await res.arrayBuffer();
    return {
      status: "success",
      content,
    };
  } catch (err: any) {
    return {
      status: "error",
      message: err.message || "Failed to download Google Drive file",
    };
  }
}

/**
 * Upload a file to Google Drive.
 */
export async function uploadLiveDriveFile(options: {
  name: string;
  content: Buffer | string;
  mimeType: string;
  folderId?: string;
}): Promise<{
  status: "success" | "auth_required" | "error";
  fileId?: string;
  authUrl?: string;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Google Drive authorization required",
    };
  }

  const metadata: any = {
    name: options.name,
    mimeType: options.mimeType,
  };
  if (options.folderId) {
    metadata.parents = [options.folderId];
  }

  const boundary = "-------314159265358979323846";
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  let body: Buffer;
  const metadataPart = Buffer.from(
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    "\r\n"
  );
  
  const contentHeader = Buffer.from(
    delimiter +
    `Content-Type: ${options.mimeType}\r\n\r\n`
  );
  
  const contentBuffer = Buffer.isBuffer(options.content) 
    ? options.content 
    : Buffer.from(options.content);

  body = Buffer.concat([
    metadataPart,
    contentHeader,
    contentBuffer,
    Buffer.from(close_delim)
  ]);

  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body: body as any, // fetch accepts Buffer in Node environments
    });

    if (res.status === 401 || res.status === 403) {
      return {
        status: "auth_required",
        authUrl: getGoogleAuthUrl(),
        message: "Google Drive access token expired or invalid",
      };
    }

    if (!res.ok) {
      return { status: "error", message: `Google Drive API error: ${res.statusText}` };
    }

    const created = await res.json();
    return { status: "success", fileId: created.id };
  } catch (err: any) {
    return { status: "error", message: err.message || "Failed to upload Google Drive file" };
  }
}

/**
 * Update an existing file in Google Drive.
 */
export async function updateLiveDriveFile(options: {
  fileId: string;
  name?: string;
  content?: Buffer | string;
  mimeType?: string;
}): Promise<{
  status: "success" | "auth_required" | "error";
  fileId?: string;
  authUrl?: string;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Google Drive authorization required",
    };
  }

  try {
    let res: Response;
    if (options.content !== undefined) {
      // Multipart upload
      const metadata: any = {};
      if (options.name) metadata.name = options.name;

      const boundary = "-------314159265358979323846";
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadataPart = Buffer.from(
        delimiter +
        "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
        JSON.stringify(metadata) +
        "\r\n"
      );
      
      const contentHeader = Buffer.from(
        delimiter +
        `Content-Type: ${options.mimeType || "application/octet-stream"}\r\n\r\n`
      );
      
      const contentBuffer = Buffer.isBuffer(options.content) 
        ? options.content 
        : Buffer.from(options.content);

      const body = Buffer.concat([
        metadataPart,
        contentHeader,
        contentBuffer,
        Buffer.from(close_delim)
      ]);

      const url = `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(options.fileId)}?uploadType=multipart`;
      res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
          "Content-Length": String(body.length),
        },
        body: body as any,
      });
    } else {
      // Metadata-only update
      const metadata: any = {};
      if (options.name) metadata.name = options.name;
      
      const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(options.fileId)}`;
      res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });
    }

    if (res.status === 401 || res.status === 403) {
      return {
        status: "auth_required",
        authUrl: getGoogleAuthUrl(),
        message: "Google Drive access token expired or invalid",
      };
    }

    if (!res.ok) {
      return { status: "error", message: `Google Drive API error: ${res.statusText}` };
    }

    const updated = await res.json();
    return { status: "success", fileId: updated.id };
  } catch (err: any) {
    return { status: "error", message: err.message || "Failed to update Google Drive file" };
  }
}

/**
 * Delete a file from Google Drive.
 */
export async function deleteLiveDriveFile(fileId: string): Promise<{
  status: "success" | "auth_required" | "error";
  authUrl?: string;
  message?: string;
}> {
  const auth = await getGoogleAccessToken();
  if (!auth.authenticated || !auth.accessToken) {
    return {
      status: "auth_required",
      authUrl: auth.authUrl || getGoogleAuthUrl(),
      message: auth.error || "Google Drive authorization required",
    };
  }

  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return {
        status: "auth_required",
        authUrl: getGoogleAuthUrl(),
        message: "Google Drive access token expired or invalid",
      };
    }

    if (!res.ok && res.status !== 204) {
      return { status: "error", message: `Google Drive API error: ${res.statusText}` };
    }

    return { status: "success" };
  } catch (err: any) {
    return { status: "error", message: err.message || "Failed to delete Google Drive file" };
  }
}
