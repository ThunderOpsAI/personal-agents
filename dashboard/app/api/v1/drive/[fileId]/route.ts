import { NextResponse } from "next/server";
import {
  fetchLiveDriveFileContent,
  updateLiveDriveFile,
  deleteLiveDriveFile,
} from "../../../../../lib/google-drive";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await props.params;

    if (!fileId) {
      return NextResponse.json(
        { status: "error", message: "File ID is required" },
        { status: 400 }
      );
    }

    const res = await fetchLiveDriveFileContent(fileId);

    if (res.status === "auth_required") {
      return NextResponse.json(
        { status: "auth_required", authUrl: res.authUrl, message: res.message },
        { status: 401 }
      );
    }

    if (res.status === "error" || !res.content) {
      return NextResponse.json(
        { status: "error", message: res.message || "Failed to download file" },
        { status: 500 }
      );
    }

    const mimeType = (res as any).mimeType || "application/octet-stream";
    return new Response(res.content, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to fetch file content" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await props.params;

    if (!fileId) {
      return NextResponse.json(
        { status: "error", message: "File ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, content, mimeType, approved } = body;

    // Modify requires approval
    if (!approved) {
      return NextResponse.json(
        {
          status: "pending_approval",
          needsApproval: {
            action: "update",
            fileId,
            name,
            mimeType,
            contentPreview:
              typeof content === "string"
                ? content.slice(0, 100)
                : content
                ? "Binary data"
                : undefined,
          },
          message: "Google Drive file update requires explicit user approval",
        },
        { status: 200 }
      );
    }

    const res = await updateLiveDriveFile({
      fileId,
      name,
      content,
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
      fileId: res.fileId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to update Drive file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await props.params;

    if (!fileId) {
      return NextResponse.json(
        { status: "error", message: "File ID is required" },
        { status: 400 }
      );
    }

    let approved = false;
    try {
      const body = await request.json();
      approved = Boolean(body?.approved);
    } catch {
      const { searchParams } = new URL(request.url);
      approved = searchParams.get("approved") === "true";
    }

    // Delete requires approval
    if (!approved) {
      return NextResponse.json(
        {
          status: "pending_approval",
          needsApproval: {
            action: "delete",
            fileId,
          },
          message: "Google Drive file deletion requires explicit user approval",
        },
        { status: 200 }
      );
    }

    const res = await deleteLiveDriveFile(fileId);

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
      fileId,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error.message || "Failed to delete Drive file" },
      { status: 500 }
    );
  }
}
