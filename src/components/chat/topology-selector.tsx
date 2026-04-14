"use client";

import { useState } from "react";

export interface TopologyOption {
  id: string;
  taskId: string;
  taskTitle: string;
}

interface TopologySelectorProps {
  topologies: TopologyOption[];
  selectedId: string | null;
  onSelect: (topologyId: string) => void;
}

export default function TopologySelector({
  topologies,
  selectedId,
  onSelect,
}: TopologySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = topologies.find((t) => t.id === selectedId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:border-gray-600 transition-colors text-left flex items-center justify-between"
      >
        <span className="truncate">
          {selected ? selected.taskTitle : "Select a topology..."}
        </span>
        <svg className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {topologies.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No topologies found. Create a task first.
              </div>
            ) : (
              topologies.map((topo) => (
                <button
                  key={topo.id}
                  onClick={() => {
                    onSelect(topo.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-sm text-left hover:bg-gray-700 transition-colors ${
                    topo.id === selectedId
                      ? "bg-gray-700 text-blue-400"
                      : "text-gray-300"
                  }`}
                >
                  <div className="font-medium truncate">{topo.taskTitle}</div>
                  <div className="text-xs text-gray-500 truncate">
                    Topology {topo.id.slice(0, 12)}...
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
