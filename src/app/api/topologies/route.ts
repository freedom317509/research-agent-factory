import { NextResponse } from "next/server";
import { db } from "@/db";
import { topologies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (taskId) {
      const results = await db
        .select()
        .from(topologies)
        .where(eq(topologies.taskId, taskId));
      const topology = results[0];

      if (!topology) {
        return NextResponse.json(
          { error: "Topology not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        ...topology,
        nodes: JSON.parse(topology.nodes),
        edges: JSON.parse(topology.edges),
        layout: topology.layout ? JSON.parse(topology.layout) : null,
      });
    }

    // List all topologies
    const all = await db.select().from(topologies).orderBy(topologies.createdAt);
    return NextResponse.json(
      all.map((t) => ({
        ...t,
        nodes: JSON.parse(t.nodes),
        edges: JSON.parse(t.edges),
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch topologies" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, taskId, nodes, edges, layout } = body;

    if (!id || !taskId || !nodes || !edges) {
      return NextResponse.json(
        { error: "id, taskId, nodes, and edges are required" },
        { status: 400 },
      );
    }

    await db.insert(topologies).values({
      id,
      taskId,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      layout: layout ? JSON.stringify(layout) : null,
    });

    return NextResponse.json({ id, taskId, nodes, edges, layout });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create topology" },
      { status: 500 },
    );
  }
}
