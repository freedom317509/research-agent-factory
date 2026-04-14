import type { TopologyGenerationResponse, AgentNode } from "@/types/topology";

interface RawEdge {
  source: string;
  target: string;
  label?: string;
}

const BASE_URL = process.env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL || "qwen-plus";

const SYSTEM_PROMPT = `You are a research workflow architect. Given a research task description, you design a multi-agent collaboration topology as a directed acyclic graph (DAG).

Each agent node in the DAG represents a specialized research agent with a specific role, system prompt, and available tools.

Available roles: researcher, analyst, writer, reviewer, coordinator, data_collector, methodologist.
Available tools: web_search, code_executor, file_reader, document_generator, data_visualizer, citation_manager.

Rules:
1. Design 4-8 agent nodes for a typical research workflow.
2. Edges define data flow — the output of the source node becomes context for the target node.
3. The DAG must be acyclic (no circular dependencies).
4. Use role-appropriate prompts for each agent.
5. The first node(s) should be entry points (no incoming edges). The last node should be the final output.

Return ONLY valid JSON with this exact structure, no markdown code blocks, no explanation:
{
  "nodes": [
    {
      "id": "unique_id_snake_case",
      "label": "Human-readable name",
      "role": "one_of_the_roles",
      "prompt": "Detailed system prompt for this agent (2-3 sentences, role-specific, task-specific)",
      "tools": ["tool1", "tool2"]
    }
  ],
  "edges": [
    {
      "source": "source_node_id",
      "target": "target_node_id",
      "label": "What data flows through this edge"
    }
  ]
}`;

export async function generateTopology(taskDescription: string): Promise<TopologyGenerationResponse> {
  const userPrompt = `Research task: ${taskDescription}`;

  console.log("[topology-generator] Calling LLM with model:", MODEL_NAME, "at", BASE_URL);

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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error(`No content in LLM response: ${JSON.stringify(data)}`);
    }

    console.log("[topology-generator] LLM response length:", text.length);

    // Clean the response — remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleaned) as TopologyGenerationResponse;

    // Validate structure
    if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
      throw new Error("Invalid topology: no nodes returned");
    }
    if (!parsed.edges || !Array.isArray(parsed.edges)) {
      throw new Error("Invalid topology: no edges returned");
    }

    return parsed;
  } catch (error) {
    console.error("[topology-generator] LLM call failed:", error);
    throw error;
  }
}

// Assign default positions based on topological sort layering
export function assignLayoutPositions(nodes: AgentNode[], edges: RawEdge[]): AgentNode[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  nodes.forEach((n) => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  });

  edges.forEach((e) => {
    if (nodeIds.has(e.source) && nodeIds.has(e.target)) {
      adjacency.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Kahn's algorithm with layering
  const layers: string[][] = [];
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  while (queue.length > 0) {
    layers.push([...queue]);
    const nextQueue: string[] = [];
    for (const nodeId of queue) {
      for (const neighbor of adjacency.get(nodeId) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          nextQueue.push(neighbor);
        }
      }
    }
    queue.length = 0;
    queue.push(...nextQueue);
  }

  // Assign positions
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 180;
  const H_SPACING = 60;
  const V_SPACING = 80;

  for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
    const layer = layers[layerIdx];
    for (let nodeIdx = 0; nodeIdx < layer.length; nodeIdx++) {
      const node = nodeMap.get(layer[nodeIdx]);
      if (node) {
        node.position = {
          x: nodeIdx * (NODE_WIDTH + H_SPACING),
          y: layerIdx * (NODE_HEIGHT + V_SPACING),
        };
      }
    }
  }

  return nodes;
}
