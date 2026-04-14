import { NextResponse } from "next/server";
import { db } from "@/db";
import { topologies, tasks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db
      .select({
        id: topologies.id,
        taskId: topologies.taskId,
        createdAt: topologies.createdAt,
        taskTitle: tasks.title,
      })
      .from(topologies)
      .innerJoin(tasks, eq(topologies.taskId, tasks.id))
      .orderBy(desc(topologies.createdAt));

    return NextResponse.json(all);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch topologies" },
      { status: 500 },
    );
  }
}
