import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { seedTemplates } from "@/services/template-manager";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    await seedTemplates();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const results = await db.select().from(tasks).where(eq(tasks.id, id));
      if (results.length === 0) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      return NextResponse.json(results[0]);
    }

    const allTasks = await db.select().from(tasks).orderBy(tasks.createdAt);
    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, title, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Task id is required" },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    await db.update(tasks).set(updateData).where(eq(tasks.id, id));

    const results = await db.select().from(tasks).where(eq(tasks.id, id));
    return NextResponse.json(results[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 },
      );
    }

    const id = `task_${Date.now()}`;
    await db.insert(tasks).values({
      id,
      title,
      description,
      status: "draft",
    });

    const created = await db.select().from(tasks).where(eq(tasks.id, id));
    return NextResponse.json(created[0]);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}
