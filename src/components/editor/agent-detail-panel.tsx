"use client";

import { useState, useEffect } from "react";
import type { AgentNode } from "@/types/topology";
import { X, Save } from "lucide-react";

interface AgentDetailPanelProps {
  node: AgentNode;
  onClose: () => void;
  onSave: (updatedNode: AgentNode) => void;
}

export default function AgentDetailPanel({ node, onClose, onSave }: AgentDetailPanelProps) {
  const [label, setLabel] = useState(node.label);
  const [prompt, setPrompt] = useState(node.prompt);
  const [tools, setTools] = useState<string[]>(node.tools);

  useEffect(() => {
    setLabel(node.label);
    setPrompt(node.prompt);
    setTools(node.tools);
  }, [node]);

  const handleSave = () => {
    onSave({ ...node, label, prompt, tools });
  };

  const handleToggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const availableTools = [
    "web_search",
    "code_executor",
    "file_reader",
    "document_generator",
    "data_visualizer",
    "citation_manager",
  ];

  return (
    <div className="w-96 h-full bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-white">{node.label}</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded-md transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Role
          </label>
          <div className="px-3 py-2 bg-gray-800 rounded-lg text-white text-sm capitalize">
            {node.role}
          </div>
        </div>

        {/* Label */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">
            System Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={8}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono leading-relaxed"
          />
        </div>

        {/* Tools */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Tools
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTools.map((tool) => (
              <button
                key={tool}
                onClick={() => handleToggleTool(tool)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  tools.includes(tool)
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600"
                }`}
              >
                {tool.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800">
        <button
          onClick={handleSave}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
