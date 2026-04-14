import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, topologies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateTopology, assignLayoutPositions } from "@/services/topology-generator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    console.log("[generate] Looking for task:", id);

    // Fetch task
    const taskResults = await db.select().from(tasks).where(eq(tasks.id, id));
    console.log("[generate] Query result:", JSON.stringify(taskResults));
    const task = taskResults[0];

    if (!task) {
      // Try listing all tasks to debug
      const allTasks = await db.select({ id: tasks.id, title: tasks.title }).from(tasks);
      console.log("[generate] All tasks in DB:", JSON.stringify(allTasks));
      return NextResponse.json({ error: `Task not found. ID: ${id}. Available: ${allTasks.map((t) => t.id).join(", ")}` }, { status: 404 });
    }

    // Update task status
    await db.update(tasks).set({ status: "generating", updatedAt: new Date() }).where(eq(tasks.id, id));

    // Generate topology via LLM
    const response = await generateTopology(task.description);

    // Convert to AgentNode[] with positions
    const nodes = assignLayoutPositions(
      response.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        role: n.role,
        prompt: n.prompt,
        tools: n.tools,
      })),
      response.edges,
    );

    const edges = response.edges.map((e, i) => ({
      id: `edge_${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
    }));

    // Save topology
    const topologyId = `topo_${Date.now()}`;
    await db.insert(topologies).values({
      id: topologyId,
      taskId: id,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      layout: JSON.stringify(
        Object.fromEntries(
          nodes.filter((n) => n.position).map((n) => [n.id, n.position!]),
        ),
      ),
    });

    // Update task status
    await db.update(tasks).set({ status: "generated", updatedAt: new Date() }).where(eq(tasks.id, id));

    return NextResponse.json({
      id: topologyId,
      taskId: id,
      nodes,
      edges,
    });
  } catch (error) {
    const taskId = (await params).id;
    console.error("[generate] Error:", error);
    try {
      await db.update(tasks).set({ status: "failed", updatedAt: new Date() }).where(eq(tasks.id, taskId));
    } catch {}

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Topology generation failed: ${message}` },
      { status: 500 },
    );
  }
}
