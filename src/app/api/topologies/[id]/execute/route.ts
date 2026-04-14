import { NextResponse } from "next/server";
import { db } from "@/db";
import { topologies, tasks, executionLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { executeTopology } from "@/services/pipeline-executor";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch topology
    const topoResults = await db
      .select()
      .from(topologies)
      .where(eq(topologies.id, id));
    const topology = topoResults[0];

    if (!topology) {
      return NextResponse.json(
        { error: "Topology not found" },
        { status: 404 },
      );
    }

    // Update task status
    await db
      .update(tasks)
      .set({ status: "executing", updatedAt: new Date() })
      .where(eq(tasks.id, topology.taskId));

    const nodes = JSON.parse(topology.nodes);
    const edges = JSON.parse(topology.edges);

    // Execute the topology
    const results = await executeTopology(nodes, edges, id);

    // Determine overall status
    const hasFailures = results.some((r) => r.status === "failed");
    await db
      .update(tasks)
      .set({
        status: hasFailures ? "failed" : "completed",
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, topology.taskId));

    return NextResponse.json({ results });
  } catch (error) {
    const { id } = await params;
    const topoResults = await db
      .select()
      .from(topologies)
      .where(eq(topologies.id, id));
    const topology = topoResults[0];

    if (topology) {
      await db
        .update(tasks)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(tasks.id, topology.taskId));
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Execution failed: ${message}` },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const logs = await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.topologyId, id))
      .orderBy(executionLogs.createdAt);

    // Map to camelCase for frontend consumption
    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        topologyId: log.topologyId,
        nodeId: log.nodeId,
        status: log.status,
        output: log.output,
        error: log.error,
        startedAt: log.startedAt,
        finishedAt: log.finishedAt,
        createdAt: log.createdAt,
      })),
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch execution logs" },
      { status: 500 },
    );
  }
}
