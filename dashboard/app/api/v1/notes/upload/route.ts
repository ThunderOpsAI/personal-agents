import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { status: "error", error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { status: "error", error: "File must be an image" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { status: "error", error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    const blob = await put(file.name, file, {
      access: 'public',
    });

    return NextResponse.json({ status: "success", url: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { status: "error", error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
