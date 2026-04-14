"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import { Loader2, Beaker, ArrowRight } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  topology: string;
  createdAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Templates are seeded on first API call
    fetch("/api/tasks")
      .then(() => fetch("/api/templates"))
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleUseTemplate = async (template: Template) => {
    const topology = JSON.parse(template.topology);

    // Create a task from the template
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: template.name,
        description: template.description,
      }),
    });

    if (res.ok) {
      const task = await res.json();
      const topoId = `topo_${Date.now()}`;

      // Assign positions using layout algorithm
      const nodesWithPositions = topology.nodes.map(
        (node: { id: string }, idx: number) => ({
          ...node,
          position: { x: idx * 340, y: 0 },
        }),
      );

      // Create topology entry
      const edgesWithIds = topology.edges.map(
        (edge: { source: string; target: string; label?: string }, idx: number) => ({
          id: `edge_${idx}`,
          ...edge,
        }),
      );

      await fetch("/api/topologies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: topoId,
          taskId: task.id,
          nodes: nodesWithPositions,
          edges: edgesWithIds,
        }),
      });

      router.push(`/tasks/${task.id}/editor`);
    }
  };

  const categoryLabels: Record<string, string> = {
    literature_review: "文献综述",
    data_analysis: "数据分析",
    experiment: "实验设计",
    writing: "论文写作",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Beaker className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">Template Library</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No templates available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => {
              const topology = JSON.parse(tpl.topology);
              return (
                <div
                  key={tpl.id}
                  className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {tpl.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/20">
                        {categoryLabels[tpl.category] || tpl.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {tpl.description}
                  </p>

                  {/* Preview nodes */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {topology.nodes?.map((node: { label: string; role: string }) => (
                      <span
                        key={node.label}
                        className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300"
                      >
                        {node.label}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {topology.nodes?.length || 0} agents,{" "}
                      {topology.edges?.length || 0} connections
                    </span>
                    <button
                      onClick={() => handleUseTemplate(tpl)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
                    >
                      Use Template
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
