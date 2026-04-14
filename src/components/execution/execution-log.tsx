"use client";

import { type ExecutionLog } from "@/types/topology";
import { Loader2, CheckCircle, XCircle, Circle } from "lucide-react";

interface ExecutionLogProps {
  logs: ExecutionLog[];
}

const statusIcons: Record<string, typeof Circle> = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors: Record<string, string> = {
  pending: "text-gray-500",
  running: "text-blue-400",
  completed: "text-emerald-400",
  failed: "text-red-400",
};

export default function ExecutionLogDisplay({ logs }: ExecutionLogProps) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-white text-sm">Execution Log</h3>
      </div>
      <div className="max-h-80 overflow-y-auto p-3 space-y-2 font-mono text-sm">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No logs yet</p>
        ) : (
          logs.map((log) => {
            const Icon = statusIcons[log.status] || Circle;
            const color = statusColors[log.status] || "text-gray-500";
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 py-2 border-b border-gray-800/50 last:border-0"
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color} ${log.status === "running" ? "animate-spin" : ""}`}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-gray-300 font-medium">
                    [{log.nodeId}]
                  </span>{" "}
                  <span className={`capitalize ${color}`}>{log.status}</span>
                  {log.output && (
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                      {log.output}
                    </p>
                  )}
                  {log.error && (
                    <p className="text-red-400 text-xs mt-1">{log.error}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
