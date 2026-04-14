"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import type { Task } from "@/types/topology";
import { Loader2, Plus, ArrowRight } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-600",
  generating: "bg-yellow-500",
  generated: "bg-green-500",
  executing: "bg-blue-500",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
};

export default function Home() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) {
        throw new Error(`Failed to fetch tasks: ${res.status}`);
      }
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (res.ok) {
        const task = await res.json();
        router.push(`/tasks/${task.id}/editor`);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-3">
            AI Research Agent Factory
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            输入科研任务描述，AI 自动生成多 Agent 协作拓扑，可视化展示并执行
          </p>
        </div>

        {/* Create Task Form */}
        <div className="max-w-2xl mx-auto mb-12 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            Create Research Task
          </h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 深度学习在医疗诊断中的应用综述"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Task Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your research task in detail..."
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !title || !description}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Task
                </>
              )}
            </button>
          </form>
        </div>

        {/* Recent Tasks */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-white mb-4">
            Recent Tasks
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No tasks yet. Create one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.slice(-10).reverse().map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-900 rounded-lg border border-gray-800 p-4 flex items-center justify-between hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${statusColors[task.status] || "bg-gray-600"} flex-shrink-0`}
                    />
                    <div className="min-w-0">
                      <h3 className="text-white font-medium truncate">
                        {task.title}
                      </h3>
                      <p className="text-gray-500 text-sm truncate">
                        {task.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs text-gray-500 capitalize">
                      {task.status}
                    </span>
                    <button
                      onClick={() => router.push(`/tasks/${task.id}/editor`)}
                      className="p-1.5 hover:bg-gray-800 rounded-md transition-colors"
                      title="Open editor"
                    >
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
