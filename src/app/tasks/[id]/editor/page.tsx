"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import TopologyCanvas from "@/components/editor/topology-canvas";
import AgentDetailPanel from "@/components/editor/agent-detail-panel";
import type { AgentNode, TopologyEdge } from "@/types/topology";
import { Loader2, Play, RefreshCw, ArrowLeft, Zap, Download, Plus, Trash2 } from "lucide-react";

export default function TaskEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const [edges, setEdges] = useState<TopologyEdge[]>([]);
  const [topologyId, setTopologyId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<AgentNode | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [taskTitle, setTaskTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const nodeCounter = useRef(0);

  // Unpack params in useEffect — never call .then() during render
  useEffect(() => {
    params.then((p) => setTaskId(p.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const id = taskId || "";

  // Fetch topology if exists
  const fetchTopology = useCallback(async () => {
    if (!id) return;
    try {
      // Fetch task info by ID
      const taskRes = await fetch(`/api/tasks?id=${id}`);
      if (taskRes.ok) {
        const task = await taskRes.json();
        setTaskTitle(task.title);
      }

      // Fetch topology by taskId
      const topoRes = await fetch(`/api/topologies?taskId=${id}`);
      if (topoRes.ok) {
        const data = await topoRes.json();
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
          setTopologyId(data.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch topology:", error);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTopology();
      setIsLoading(false);
    }
  }, [id, fetchTopology]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/generate`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      const data = await res.json();
      setNodes(data.nodes);
      setEdges(data.edges);
      setTopologyId(data.id);
    } catch (error) {
      console.error("Failed to generate topology:", error);
      alert(`Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) setSelectedNode(node);
  };

  const handleSaveNode = (updatedNode: AgentNode) => {
    const updated = nodes.map((n) =>
      n.id === updatedNode.id ? updatedNode : n,
    );
    setNodes(updated);
    setSelectedNode(null);
    persistNodes(updated);
  };

  const persistNodes = (updatedNodes: AgentNode[]) => {
    if (!topologyId) return;
    fetch(`/api/topologies/${topologyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes: updatedNodes }),
    }).catch(console.error);
  };

  const persistEdges = (updatedEdges: TopologyEdge[]) => {
    if (!topologyId) return;
    fetch(`/api/topologies/${topologyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ edges: updatedEdges }),
    }).catch(console.error);
  };

  const handleAddNode = async () => {
    nodeCounter.current += 1;
    const newNode: AgentNode = {
      id: `node-${Date.now()}-${nodeCounter.current}`,
      label: `Agent ${nodeCounter.current}`,
      role: "custom",
      prompt: "You are a research assistant. Describe your role.",
      tools: ["web_search"],
      position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
    };

    // If no topology exists yet, create one first
    let currentTopologyId = topologyId;
    if (!currentTopologyId && taskId) {
      const newTopologyId = `topo-${Date.now()}`;
      const res = await fetch("/api/topologies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newTopologyId,
          taskId,
          nodes: [newNode],
          edges: [],
          layout: { [newNode.id]: newNode.position },
        }),
      });
      if (!res.ok) {
        console.error("Failed to create topology");
        return;
      }
      const data = await res.json();
      setTopologyId(data.id);
      setNodes([newNode]);
      setSelectedNode(newNode);
      return;
    }

    const updated = [...nodes, newNode];
    setNodes(updated);
    setSelectedNode(newNode);
    persistNodes(updated);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updated = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter(
      (e) => e.source !== nodeId && e.target !== nodeId,
    );
    setNodes(updated);
    setEdges(updatedEdges);
    if (selectedNode?.id === nodeId) setSelectedNode(null);
    persistNodes(updated);
    persistEdges(updatedEdges);
  };

  const handleEdgesChange = (updatedEdges: TopologyEdge[]) => {
    setEdges(updatedEdges);
    persistEdges(updatedEdges);
  };

  const handleExecute = () => {
    if (topologyId) {
      router.push(`/tasks/${taskId}/execute`);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topology-${taskId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header />

      {/* Toolbar */}
      <div className="h-12 border-b border-gray-800 bg-gray-900/50 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h1 className="font-semibold text-white text-sm">
            {taskTitle || "Task Editor"}
          </h1>
          {nodes.length > 0 && (
            <span className="text-xs text-gray-500">
              {nodes.length} agents, {edges.length} connections
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddNode}
            disabled={!taskId}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Agent
          </button>
          <button
            onClick={handleExport}
            disabled={nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-md transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Regenerate
          </button>
          <button
            onClick={handleExecute}
            disabled={!topologyId}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Execute
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {nodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">
                No Topology Yet
              </h2>
              <p className="text-gray-500 mb-6 max-w-md">
                Click the button below to let AI generate a multi-agent collaboration topology for your research task, or start by adding agents manually.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {isGenerating ? "Generating..." : "Generate Topology"}
                </button>
                <button
                  onClick={handleAddNode}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Agent
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 relative">
              <TopologyCanvas
                nodes={nodes}
                edges={edges}
                onNodeClick={handleNodeClick}
                onEdgesChange={handleEdgesChange}
                onNodeDelete={handleDeleteNode}
              />
            </div>
            {selectedNode && (
              <AgentDetailPanel
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
                onSave={handleSaveNode}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
