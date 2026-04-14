"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import type { Task } from "@/types/topology";
import { Loader2, ArrowRight, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "bg-gray-600",
  generating: "bg-yellow-500",
  generated: "bg-green-500",
  executing: "bg-blue-500",
  completed: "bg-emerald-500",
  failed: "bg-red-500",
};

export default function HistoryPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Task History</h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No tasks in history.
          </div>
        ) : (
          <div className="space-y-3">
            {[...tasks].reverse().map((task) => (
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
                    <p className="text-gray-600 text-xs mt-1">
                      {new Date(task.createdAt).toLocaleString()}
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
      </main>
    </div>
  );
}
