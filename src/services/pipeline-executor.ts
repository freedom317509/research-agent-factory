import type { AgentNode, TopologyEdge, ExecutionStatus } from "@/types/topology";
import { db } from "@/db";
import { executionLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = process.env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL || "qwen-plus";

export interface ExecutionResult {
  nodeId: string;
  status: ExecutionStatus;
  output?: string;
  error?: string;
}

export interface ExecutionCallback {
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string, output: string) => void;
  onNodeError?: (nodeId: string, error: string) => void;
  onExecutionComplete?: () => void;
}

async function executeAgentNode(
  node: AgentNode,
  upstreamOutputs: Record<string, string>,
): Promise<string> {
  // Build context from upstream outputs
  let context = "";
  for (const [sourceId, output] of Object.entries(upstreamOutputs)) {
    context += `\n--- Output from agent "${sourceId}" ---\n${output}\n`;
  }

  const prompt = context
    ? `${node.prompt}\n\nHere is context from upstream agents:\n${context}`
    : node.prompt;

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: "You are executing a research agent task. Provide a concise, useful response." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`No content in LLM response`);
    }

    return text;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Agent "${node.label}" failed: ${message}`);
  }
}

export async function executeTopology(
  nodes: AgentNode[],
  edges: TopologyEdge[],
  topologyId: string,
  callbacks?: ExecutionCallback,
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];
  const outputs: Record<string, string> = {}; // nodeId -> output

  // Build adjacency and in-degree for Kahn's algorithm
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, { edge: TopologyEdge; node: AgentNode }[]>();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  });

  edges.forEach((e) => {
    const targetNode = nodeMap.get(e.target);
    if (targetNode) {
      adjacency.get(e.source)!.push({ edge: e, node: targetNode });
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Create initial DB entries with unique IDs per execution run
  const logIdMap = new Map<string, string>(); // nodeId -> logId
  for (const node of nodes) {
    const logId = `log_${topologyId}_${node.id}`;
    logIdMap.set(node.id, logId);
    await db.insert(executionLogs).values({
      id: logId,
      topologyId,
      nodeId: node.id,
      status: "pending",
    });
  }

  // Layer-by-layer execution (Kahn's)
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  while (queue.length > 0) {
    // Execute current layer in parallel
    const currentLayer = [...queue];
    queue.length = 0;

    const layerPromises = currentLayer.map(async (nodeId) => {
      const node = nodeMap.get(nodeId)!;
      callbacks?.onNodeStart?.(nodeId);

      // Update DB: running
      const logId = logIdMap.get(nodeId)!;
      await db
        .update(executionLogs)
        .set({ status: "running", startedAt: new Date() })
        .where(eq(executionLogs.id, logId));

      try {
        // Collect upstream outputs
        const upstreamOutputs: Record<string, string> = {};
        const incomingEdges = edges.filter((e) => e.target === nodeId);
        for (const edge of incomingEdges) {
          if (outputs[edge.source]) {
            upstreamOutputs[edge.source] = outputs[edge.source];
          }
        }

        const output = await executeAgentNode(node, upstreamOutputs);
        outputs[nodeId] = output;

        callbacks?.onNodeComplete?.(nodeId, output);
        await db
          .update(executionLogs)
          .set({ status: "completed", output, finishedAt: new Date() })
          .where(eq(executionLogs.id, logId));

        return { nodeId, status: "completed" as const, output };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        callbacks?.onNodeError?.(nodeId, errorMsg);
        await db
          .update(executionLogs)
          .set({ status: "failed", error: errorMsg, finishedAt: new Date() })
          .where(eq(executionLogs.id, logId));

        return { nodeId, status: "failed" as const, error: errorMsg };
      }
    });

    const layerResults = await Promise.all(layerPromises);
    results.push(...layerResults);

    // Add next layer nodes to queue
    for (const nodeId of currentLayer) {
      for (const { node } of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(node.id) || 1) - 1;
        inDegree.set(node.id, newDegree);
        if (newDegree === 0) {
          queue.push(node.id);
        }
      }
    }
  }

  callbacks?.onExecutionComplete?.();
  return results;
}
