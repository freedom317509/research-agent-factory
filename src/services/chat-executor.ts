import type { AgentNode, TopologyEdge } from "@/types/topology";
import { db } from "@/db";
import { chatMessages, uploadedFiles } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const BASE_URL = process.env.OPENAI_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1";
const API_KEY = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL || "qwen-plus";

const openai = createOpenAI({
  baseURL: BASE_URL,
  apiKey: API_KEY,
});

async function executeAgentNode(
  node: AgentNode,
  upstreamOutputs: Record<string, string>,
  isLastNode: boolean,
): Promise<{ output: string; stream?: ReadableStream<string> }> {
  let context = "";
  for (const [sourceId, output] of Object.entries(upstreamOutputs)) {
    context += `\n--- Output from agent "${sourceId}" ---\n${output}\n`;
  }

  const prompt = context
    ? `${node.prompt}\n\nHere is context from upstream agents:\n${context}`
    : node.prompt;

  if (isLastNode) {
    const result = streamText({
      model: openai(MODEL_NAME),
      system: "You are executing a research agent task. Provide a concise, useful response.",
      prompt,
      temperature: 0.7,
    });
    return { output: "", stream: result.textStream };
  } else {
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
      throw new Error(`LLM API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("No content in LLM response");
    return { output: text };
  }
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  fileContent?: string;
}

export interface StreamedChatResult {
  stream: ReadableStream<string>;
  finalOutput: string;
}

/**
 * Executes a topology for a chat session:
 * - Builds the user prompt from message + conversation history + file content
 * - Injects it into the first node's prompt
 * - Runs topology in topological order
 * - Streams the last node's output
 */
export async function executeChatStream(
  nodes: AgentNode[],
  edges: TopologyEdge[],
  userMessage: string,
  fileContent: string | null,
  history: ChatMessage[],
): Promise<StreamedChatResult> {
  if (nodes.length === 0) throw new Error("No nodes in topology");

  // Build conversation history string
  let historyText = "";
  for (const msg of history) {
    const prefix = msg.role === "user" ? "User" : "Assistant";
    historyText += `\n[${prefix}]: ${msg.content}`;
    if (msg.fileContent) {
      historyText += `\n[Attached file content]:\n${msg.fileContent}`;
    }
  }

  // Build the final prompt for the first node
  let injectedPrompt = nodes[0].prompt;
  if (fileContent) {
    injectedPrompt += `\n\nHere is the content from an uploaded file:\n${fileContent}`;
  }
  if (historyText) {
    injectedPrompt += `\n\nConversation history:\n${historyText}`;
  }
  injectedPrompt += `\n\nNow answer this question: ${userMessage}`;

  // Build modified nodes: first node gets the injected prompt
  const chatNodes = nodes.map((n, i) =>
    i === 0 ? { ...n, prompt: injectedPrompt } : n,
  );

  // Topological sort (Kahn's)
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, { edge: TopologyEdge; node: AgentNode }[]>();
  const nodeMap = new Map(chatNodes.map((n) => [n.id, n]));
  const sortedOrder: string[] = [];

  chatNodes.forEach((n) => {
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

  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  while (queue.length > 0) {
    const currentLayer = [...queue];
    queue.length = 0;

    for (const nodeId of currentLayer) {
      sortedOrder.push(nodeId);
      for (const { node } of adjacency.get(nodeId) || []) {
        const newDegree = (inDegree.get(node.id) || 1) - 1;
        inDegree.set(node.id, newDegree);
        if (newDegree === 0) queue.push(node.id);
      }
    }
  }

  // Execute sequentially, streaming only the last node
  const lastNodeId = sortedOrder[sortedOrder.length - 1];
  const outputs: Record<string, string> = {};

  for (const nodeId of sortedOrder) {
    const node = nodeMap.get(nodeId)!;
    const isLast = nodeId === lastNodeId;

    // Collect upstream
    const upstreamOutputs: Record<string, string> = {};
    const incomingEdges = edges.filter((e) => e.target === nodeId);
    for (const edge of incomingEdges) {
      if (outputs[edge.source]) {
        upstreamOutputs[edge.source] = outputs[edge.source];
      }
    }

    const result = await executeAgentNode(node, upstreamOutputs, isLast);

    if (isLast && result.stream) {
      return {
        stream: result.stream,
        finalOutput: await collectStream(result.stream),
      };
    }

    outputs[nodeId] = result.output;
  }

  // Fallback (shouldn't reach here)
  throw new Error("No streamable node found");
}

async function collectStream(stream: ReadableStream<string>): Promise<string> {
  const reader = stream.getReader();
  let result = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += value;
    }
  } finally {
    reader.releaseLock();
  }
  return result;
}

/**
 * Fetch chat session message history from DB
 */
export async function getSessionHistory(chatSessionId: string): Promise<ChatMessage[]> {
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.chatSessionId, chatSessionId))
    .orderBy(asc(chatMessages.createdAt));

  const history: ChatMessage[] = [];
  for (const msg of messages) {
    let fileContent: string | undefined;
    if (msg.fileIds) {
      const fileIds: string[] = JSON.parse(msg.fileIds);
      const files = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.chatSessionId, chatSessionId));
      const matchingFiles = files.filter((f) => fileIds.includes(f.id));
      const contents = matchingFiles.map((f) => f.content).filter(Boolean) as string[];
      if (contents.length > 0) {
        fileContent = contents.join("\n\n---\n\n");
      }
    }
    history.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
      fileContent,
    });
  }
  return history;
}
