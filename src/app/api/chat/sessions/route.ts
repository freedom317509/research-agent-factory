import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, topologies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topologyId = searchParams.get("topologyId");

    if (topologyId) {
      const sessions = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.topologyId, topologyId))
        .orderBy(desc(chatSessions.updatedAt));
      return NextResponse.json(sessions);
    }

    const all = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt));
    return NextResponse.json(all);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, topologyId, title } = body;

    if (!id || !topologyId) {
      return NextResponse.json(
        { error: "id and topologyId are required" },
        { status: 400 },
      );
    }

    // Verify topology exists
    const topo = await db
      .select()
      .from(topologies)
      .where(eq(topologies.id, topologyId));

    if (topo.length === 0) {
      return NextResponse.json(
        { error: "Topology not found" },
        { status: 404 },
      );
    }

    await db.insert(chatSessions).values({
      id,
      topologyId,
      title: title || "New Chat",
    });

    return NextResponse.json({
      id,
      topologyId,
      title: title || "New Chat",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 },
    );
  }
}
