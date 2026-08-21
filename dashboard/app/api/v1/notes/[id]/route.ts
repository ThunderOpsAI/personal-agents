import { NextResponse } from "next/server";
import { updateNote, deleteNote } from "../../../../../lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ status: "error", error: "id is required" }, { status: 400 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "error", error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const updated = await updateNote(id, body);
    if (!updated) return NextResponse.json({ status: "error", error: "Note not found" }, { status: 404 });
    return NextResponse.json({ status: "success", note: updated });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ status: "error", error: "id is required" }, { status: 400 });

  try {
    const success = await deleteNote(id);
    if (!success) return NextResponse.json({ status: "error", error: "Note not found" }, { status: 404 });
    return NextResponse.json({ status: "success" });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to delete note" }, { status: 500 });
  }
}
