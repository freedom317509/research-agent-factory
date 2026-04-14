// Agent node types in the topology
export type AgentRole =
  | "researcher"
  | "analyst"
  | "writer"
  | "reviewer"
  | "coordinator"
  | "data_collector"
  | "methodologist"
  | "custom";

export interface AgentNode {
  id: string;
  label: string;
  role: AgentRole;
  prompt: string; // System prompt for this agent
  tools: string[]; // Available tools (e.g., "web_search", "code_executor", "file_reader")
  position?: { x: number; y: number };
}

export interface TopologyEdge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  label?: string;
}

export interface Topology {
  id: string;
  taskId: string;
  nodes: AgentNode[];
  edges: TopologyEdge[];
}

// Execution types
export type ExecutionStatus = "pending" | "running" | "completed" | "failed";

export interface ExecutionLog {
  id: string;
  topologyId: string;
  nodeId: string;
  status: ExecutionStatus;
  output?: string;
  error?: string;
  startedAt?: Date;
  finishedAt?: Date;
}

// Task types
export type TaskStatus =
  | "draft"
  | "generating"
  | "generated"
  | "executing"
  | "completed"
  | "failed";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

// LLM-generated topology response
export interface TopologyGenerationResponse {
  nodes: Array<{
    id: string;
    label: string;
    role: AgentRole;
    prompt: string;
    tools: string[];
  }>;
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
}
