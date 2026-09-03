import { NextResponse } from "next/server";
import { fetchLiveDriveFiles, uploadLiveDriveFile } from "../../../../lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;
    const folderId = searchParams.get("folderId") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const mimeType = searchParams.get("mimeType") || undefined;

    const res = await fetchLiveDriveFiles({
      query,
      folderId,
      maxResults: limit,
      mimeType,
    });

    if (res.status === "auth_required") {
      return NextResponse.json(
        { status: "auth_required", authUrl: res.authUrl, message: res.message },
        { status: 401 }
      );
    }

    if (res.status === "error") {
      return NextResponse.json(
        { status: "error", message: res.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      files: res.files || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to list Drive files" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, content, mimeType = "text/plain", folderId, approved } = body;

    if (!name || content === undefined) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields: name and content" },
        { status: 400 }
      );
    }

    // Write operations require approval flow
    if (!approved) {
      return NextResponse.json(
        {
          status: "pending_approval",
          needsApproval: {
            action: "upload",
            name,
            mimeType,
            folderId,
            contentPreview: typeof content === "string" ? content.slice(0, 100) : "Binary data",
          },
          message: "Google Drive upload requires explicit user approval",
        },
        { status: 200 }
      );
    }

    const res = await uploadLiveDriveFile({
      name,
      content,
      mimeType,
      folderId,
    });

    if (res.status === "auth_required") {
      return NextResponse.json(
        { status: "auth_required", authUrl: res.authUrl, message: res.message },
        { status: 401 }
      );
    }

    if (res.status === "error") {
      return NextResponse.json(
        { status: "error", message: res.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "success",
      fileId: res.fileId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to upload file to Drive" },
      { status: 500 }
    );
  }
}
