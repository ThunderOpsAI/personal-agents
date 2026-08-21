import { NextResponse } from "next/server";
import { createNote, getNotes } from "../../../../lib/db";


export async function GET() {
  try {
    const notes = await getNotes();
    return NextResponse.json({ status: "success", notes });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to retrieve notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ status: "error", error: "Payload must be an object" }, { status: 400 });
  }

  const { content, author, pinned, isArchived } = body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ status: "error", error: "content is required and must be non-empty" }, { status: 400 });
  }

  try {
    const note = await createNote({
      content: content.trim(),
      author: typeof author === "string" && author.trim() ? author.trim() : "user",
      pinned: typeof pinned === "boolean" ? pinned : false,
      isArchived: typeof isArchived === "boolean" ? isArchived : false,
    });
    return NextResponse.json({ status: "success", note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to create note" }, { status: 500 });
  }
}
