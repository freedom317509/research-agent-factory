"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnConnect,
  type Connection,
  MarkerType,
  BackgroundVariant,
  applyNodeChanges,
  addEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import AgentNode from "./agent-node";
import type { AgentNode as AgentNodeType, TopologyEdge } from "@/types/topology";

interface CanvasNodeData extends Record<string, unknown> {
  node: AgentNodeType;
  status: string;
  onClick: () => void;
  onDelete: () => void;
}

const nodeTypes = {
  agent: AgentNode,
};

interface TopologyCanvasProps {
  nodes: AgentNodeType[];
  edges: TopologyEdge[];
  executionStatus?: Record<string, string>;
  onNodeClick?: (nodeId: string) => void;
  onEdgesChange?: (edges: TopologyEdge[]) => void;
  onNodeDelete?: (nodeId: string) => void;
}

export default function TopologyCanvas({
  nodes: agentNodes,
  edges: agentEdges,
  executionStatus = {},
  onNodeClick,
  onEdgesChange,
  onNodeDelete,
}: TopologyCanvasProps) {
  const [internalNodes, setInternalNodes] = useState<Node<CanvasNodeData>[]>([]);
  const initializedRef = useRef(false);

  // Initialize nodes from props — only runs once per topology load
  useEffect(() => {
    if (agentNodes.length === 0) {
      setInternalNodes([]);
      initializedRef.current = false;
      return;
    }
    initializedRef.current = true;
    setInternalNodes(
      agentNodes.map((n) => ({
        id: n.id,
        type: "agent",
        position: n.position || { x: 0, y: 0 },
        data: {
          node: n,
          status: "pending",
          onClick: () => onNodeClick?.(n.id),
          onDelete: () => onNodeDelete?.(n.id),
        },
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentNodes.length]);

  // Sync execution status — only update when values actually change
  const statusKey = JSON.stringify(executionStatus);
  useEffect(() => {
    if (!initializedRef.current || internalNodes.length === 0) return;
    setInternalNodes((nds) =>
      nds.map((nd) => {
        const newStatus = executionStatus[nd.id];
        if (newStatus && newStatus !== nd.data.status) {
          return {
            ...nd,
            data: { ...nd.data, status: newStatus },
          };
        }
        return nd;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusKey]);

  // Edges — stable derived data
  const rfEdges: Edge[] = useMemo(
    () =>
      agentEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 },
        style: { stroke: "#555", strokeWidth: 2 },
        labelStyle: { fill: "#888", fontSize: 11 },
      })),
    [agentEdges],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setInternalNodes((nds) => applyNodeChanges(changes, nds) as Node<CanvasNodeData>[]);
    },
    [],
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      // Prevent duplicate edges
      const exists = agentEdges.some(
        (e) => e.source === connection.source && e.target === connection.target
      );
      if (exists) return;

      const newEdge: TopologyEdge = {
        id: `edge-${Date.now()}`,
        source: connection.source,
        target: connection.target,
      };
      const updated = [...agentEdges, newEdge];
      onEdgesChange?.(updated);
    },
    [agentEdges, onEdgesChange],
  );

  const onNodeClickHandler = useCallback(
    (_event: React.MouseEvent, node: Node<CanvasNodeData>) => {
      node.data?.onClick?.();
    },
    [],
  );

  const onEdgeDoubleClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      const updated = agentEdges.filter((e) => e.id !== edge.id);
      onEdgesChange?.(updated);
    },
    [agentEdges, onEdgesChange],
  );

  return (
    <div className="w-full h-full bg-gray-950">
      <ReactFlow
        nodes={internalNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClickHandler}
        onConnect={onConnect}
        onEdgeDoubleClick={onEdgeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        connectionLineStyle={{ stroke: "#8b5cf6", strokeWidth: 2 }}
        connectionRadius={10}
      >
        <Controls
          className="!bg-gray-900 !border-gray-700 [&>button]:!bg-gray-900 [&>button]:!border-gray-700 [&>button]:!fill-gray-300 [&>button:hover]:!bg-gray-800"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-gray-900 !border-gray-700"
          nodeColor={(node) => {
            const data = node.data as CanvasNodeData | undefined;
            const role = data?.node?.role as string | undefined;
            const colors: Record<string, string> = {
              researcher: "#3b82f6",
              analyst: "#8b5cf6",
              writer: "#10b981",
              reviewer: "#f59e0b",
              coordinator: "#ef4444",
              data_collector: "#06b6d4",
              methodologist: "#ec4899",
              custom: "#6b7280",
            };
            return colors[role || "custom"] || "#6b7280";
          }}
          maskColor="rgba(0,0,0,0.3)"
        />
        <Background color="#333" gap={20} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}
