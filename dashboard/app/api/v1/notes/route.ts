import { NextResponse } from "next/server";
import { createNote, getNotes, updateNote, deleteNote } from "../../../../lib/db";


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

  const { title, content, color, pinned, author } = body;
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ status: "error", error: "content is required and must be non-empty" }, { status: 400 });
  }

  try {
    const note = await createNote({
      title: title !== undefined ? String(title).trim() : undefined,
      content: content.trim(),
      color: color !== undefined ? String(color).trim() : undefined,
      pinned: typeof pinned === "boolean" ? pinned : undefined,
      author: typeof author === "string" && author.trim() ? author.trim() : "user",
    });
    return NextResponse.json({ status: "success", note }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to create note" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ status: "error", error: "Payload must be an object" }, { status: 400 });
  }

  const { id, title, content, color, pinned } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ status: "error", error: "id is required" }, { status: 400 });
  }

  try {
    const updated = await updateNote({
      id,
      title: title !== undefined ? String(title).trim() : undefined,
      content: content !== undefined ? String(content).trim() : undefined,
      color: color !== undefined ? String(color).trim() : undefined,
      pinned: typeof pinned === "boolean" ? pinned : undefined,
    });

    if (!updated) {
      return NextResponse.json({ status: "error", error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", note: updated });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  let id = url.searchParams.get("id");

  if (!id) {
    try {
      const body = await request.json();
      if (body && typeof body === "object" && typeof body.id === "string") {
        id = body.id;
      }
    } catch {
      // Ignore body parsing errors here
    }
  }

  if (!id) {
    return NextResponse.json({ status: "error", error: "id is required" }, { status: 400 });
  }

  try {
    const success = await deleteNote(id);
    if (!success) {
      return NextResponse.json({ status: "error", error: "Note not found or already deleted" }, { status: 404 });
    }
    return NextResponse.json({ status: "success", message: "Note deleted successfully" });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to delete note" }, { status: 500 });
  }
}
