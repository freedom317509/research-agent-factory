import { NextResponse } from "next/server";
import { db } from "@/db";
import { topologies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const results = await db.select().from(topologies).where(eq(topologies.id, id));
    const topology = results[0];

    if (!topology) {
      return NextResponse.json({ error: "Topology not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...topology,
      nodes: JSON.parse(topology.nodes),
      edges: JSON.parse(topology.edges),
      layout: topology.layout ? JSON.parse(topology.layout) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch topology" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.nodes) {
      await db
        .update(topologies)
        .set({ nodes: JSON.stringify(body.nodes) })
        .where(eq(topologies.id, id));
    }
    if (body.edges) {
      await db
        .update(topologies)
        .set({ edges: JSON.stringify(body.edges) })
        .where(eq(topologies.id, id));
    }
    if (body.layout) {
      await db
        .update(topologies)
        .set({ layout: JSON.stringify(body.layout) })
        .where(eq(topologies.id, id));
    }

    const results = await db.select().from(topologies).where(eq(topologies.id, id));
    const updated = results[0];

    return NextResponse.json({
      ...updated,
      nodes: JSON.parse(updated.nodes),
      edges: JSON.parse(updated.edges),
      layout: updated.layout ? JSON.parse(updated.layout) : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update topology" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await db.delete(topologies).where(eq(topologies.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete topology" },
      { status: 500 },
    );
  }
}
