import { NextResponse } from "next/server";
import { createAgendaItem, getAgendaItems, getDbStatus, updateAgendaItemStatus } from "../../../../lib/db";
import { AgendaItemStatus } from "../../../../lib/schema";

export async function GET() {
  try {
    const items = await getAgendaItems();
    const dbStatus = getDbStatus();
    return NextResponse.json({
      status: "success",
      items,
      db_status: dbStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "error", error: "Failed to retrieve agenda items" },
      { status: 500 }
    );
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

  if (body.action === "update_status" || (body.id && body.status && !body.title)) {
    const { id, status, note } = body;
    if (!id || !status) {
      return NextResponse.json(
        { status: "error", error: "id and status are required for status update" },
        { status: 400 }
      );
    }

    try {
      const updated = await updateAgendaItemStatus(id, status as AgendaItemStatus, note);
      if (!updated) {
        return NextResponse.json({ status: "error", error: "Agenda item not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "success", item: updated });
    } catch (error) {
      return NextResponse.json({ status: "error", error: "Failed to update agenda item status" }, { status: 500 });
    }
  }

  const { title, item_type, scheduled_time, status, audit_trail, id } = body;
  if (!title || !item_type || !scheduled_time) {
    return NextResponse.json(
      { status: "error", error: "title, item_type, and scheduled_time are required" },
      { status: 400 }
    );
  }

  try {
    const created = await createAgendaItem({
      id,
      title,
      item_type,
      scheduled_time,
      status,
      audit_trail,
    });
    return NextResponse.json({ status: "success", item: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ status: "error", error: "Failed to create agenda item" }, { status: 500 });
  }
}
