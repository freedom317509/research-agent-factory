"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import TopologyCanvas from "@/components/editor/topology-canvas";
import type { AgentNode, TopologyEdge, ExecutionLog } from "@/types/topology";
import { Loader2, Play, ArrowLeft, RotateCcw } from "lucide-react";

export default function TaskExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [taskId, setTaskId] = useState<string | null>(null);
  const [topologyId, setTopologyId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<AgentNode[]>([]);
  const [edges, setEdges] = useState<TopologyEdge[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [executionStatus, setExecutionStatus] = useState<Record<string, string>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Unpack params in useEffect — never call .then() during render
  useEffect(() => {
    params.then((p) => setTaskId(p.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const id = taskId || "";

  // Load topology
  useEffect(() => {
    if (!id) return;

    const loadTopology = async () => {
      try {
        const res = await fetch(`/api/topologies?taskId=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.nodes && data.edges) {
            setNodes(data.nodes);
            setEdges(data.edges);
            setTopologyId(data.id);
          }
        }
      } catch (error) {
        console.error("Failed to load topology:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTopology();
  }, [id]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleExecute = async () => {
    if (!topologyId) return;

    setIsExecuting(true);
    setIsComplete(false);
    setLogs([]);
    setExecutionStatus({});

    // Set all nodes to running initially
    const initialStatus: Record<string, string> = {};
    nodes.forEach((n) => {
      initialStatus[n.id] = "pending";
    });
    setExecutionStatus(initialStatus);

    try {
      const res = await fetch(`/api/topologies/${topologyId}/execute`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      // Fetch execution logs
      const logsRes = await fetch(`/api/topologies/${topologyId}/execute`);
      if (logsRes.ok) {
        const fetchedLogs = await logsRes.json();
        setLogs(fetchedLogs);

        // Update node statuses from logs
        const statusMap: Record<string, string> = {};
        fetchedLogs.forEach((log: ExecutionLog) => {
          statusMap[log.nodeId] = log.status;
        });
        setExecutionStatus(statusMap);
      }

      setIsComplete(true);
    } catch (error) {
      console.error("Execution failed:", error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReset = () => {
    setIsExecuting(false);
    setIsComplete(false);
    setLogs([]);
    setExecutionStatus(
      Object.fromEntries(nodes.map((n) => [n.id, "pending"])),
    );
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
            onClick={() => router.push(`/tasks/${id}/editor`)}
            className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <h1 className="font-semibold text-white text-sm">Execution Monitor</h1>
          {isComplete && (
            <span className="text-xs text-emerald-400">Completed</span>
          )}
          {isExecuting && (
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Running...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded-md disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handleExecute}
            disabled={isExecuting || nodes.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md transition-colors"
          >
            {isExecuting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {isExecuting ? "Running..." : "Execute"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Topology Canvas */}
        <div className="flex-1 border-r border-gray-800">
          {nodes.length > 0 ? (
            <TopologyCanvas
              nodes={nodes}
              edges={edges}
              executionStatus={executionStatus}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No topology available. Generate one first.</p>
            </div>
          )}
        </div>

        {/* Execution Log Panel */}
        <div className="w-96 flex-shrink-0 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="font-semibold text-white text-sm mb-3">
              Execution Log
            </h3>
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">
                Click Execute to start the pipeline
              </p>
            ) : (
              logs.map((log) => {
                const statusColor: Record<string, string> = {
                  pending: "text-gray-500",
                  running: "text-blue-400",
                  completed: "text-emerald-400",
                  failed: "text-red-400",
                };
                return (
                  <div
                    key={log.id}
                    className="bg-gray-900 rounded-lg border border-gray-800 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          log.status === "completed"
                            ? "bg-emerald-400"
                            : log.status === "running"
                              ? "bg-blue-400 animate-pulse"
                              : log.status === "failed"
                                ? "bg-red-400"
                                : "bg-gray-600"
                        }`}
                      />
                      <span className="text-white text-sm font-medium">
                        {log.nodeId}
                      </span>
                      <span
                        className={`text-xs capitalize ${statusColor[log.status] || "text-gray-500"}`}
                      >
                        {log.status}
                      </span>
                    </div>
                    {log.output && (
                      <p className="text-gray-400 text-xs line-clamp-3 mt-1 font-mono">
                        {log.output}
                      </p>
                    )}
                    {log.error && (
                      <p className="text-red-400 text-xs mt-1">{log.error}</p>
                    )}
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
