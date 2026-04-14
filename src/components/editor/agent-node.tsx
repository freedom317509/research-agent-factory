"use client";

import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { AgentNode } from "@/types/topology";
import { Brain, Search, BarChart3, PenTool, Eye, GitMerge, Database, Wrench } from "lucide-react";

const roleIcons: Record<string, typeof Brain> = {
  researcher: Search,
  analyst: BarChart3,
  writer: PenTool,
  reviewer: Eye,
  coordinator: GitMerge,
  data_collector: Database,
  methodologist: Wrench,
  custom: Brain,
};

const roleColors: Record<string, string> = {
  researcher: "border-blue-500 bg-blue-500/10",
  analyst: "border-purple-500 bg-purple-500/10",
  writer: "border-emerald-500 bg-emerald-500/10",
  reviewer: "border-amber-500 bg-amber-500/10",
  coordinator: "border-red-500 bg-red-500/10",
  data_collector: "border-cyan-500 bg-cyan-500/10",
  methodologist: "border-pink-500 bg-pink-500/10",
  custom: "border-gray-500 bg-gray-500/10",
};

const statusColors: Record<string, string> = {
  pending: "border-gray-600",
  running: "border-blue-400 animate-pulse",
  completed: "border-emerald-400",
  failed: "border-red-400",
};

interface AgentNodeProps {
  data: {
    node: AgentNode;
    status?: string;
    onClick?: () => void;
  };
}

function AgentNodeComponent({ data }: AgentNodeProps) {
  const { node, status = "pending", onClick } = data;
  const Icon = roleIcons[node.role] || Brain;
  const colorClass = roleColors[node.role] || roleColors.custom;
  const statusClass = statusColors[status] || "";

  return (
    <div
      className={`min-w-[220px] rounded-xl border-2 ${colorClass} ${statusClass} bg-gray-900/95 backdrop-blur-sm shadow-lg cursor-pointer hover:shadow-xl transition-all`}
      onClick={onClick}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-gray-400 !border-gray-600"
      />

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800">
        <div className="p-1.5 rounded-lg bg-gray-800">
          <Icon className="w-4 h-4 text-gray-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">
            {node.label}
          </h3>
          <span className="text-xs text-gray-500 capitalize">{node.role}</span>
        </div>
        {/* Status dot */}
        <div
          className={`w-2 h-2 rounded-full ${
            status === "completed"
              ? "bg-emerald-400"
              : status === "running"
                ? "bg-blue-400 animate-pulse"
                : status === "failed"
                  ? "bg-red-400"
                  : "bg-gray-600"
          }`}
        />
      </div>

      {/* Tools */}
      {node.tools && node.tools.length > 0 && (
        <div className="flex flex-wrap gap-1 px-4 py-2">
          {node.tools.map((tool: string) => (
            <span
              key={tool}
              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400"
            >
              {tool.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-gray-400 !border-gray-600"
      />
    </div>
  );
}

export default memo(AgentNodeComponent);
