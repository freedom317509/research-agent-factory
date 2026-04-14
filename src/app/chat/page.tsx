"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import MessageBubble, { ThinkingIndicator } from "@/components/chat/message-bubble";
import ChatInput from "@/components/chat/chat-input";
import TopologySelector, { type TopologyOption } from "@/components/chat/topology-selector";
import { Loader2, Plus, MessageCircle } from "lucide-react";
import type { ChatMessage, ChatSession, UploadedFile } from "@/types/chat";

export default function ChatPage() {
  const router = useRouter();
  const [topologies, setTopologies] = useState<TopologyOption[]>([]);
  const [selectedTopology, setSelectedTopology] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [thinkingStages, setThinkingStages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch topologies
  useEffect(() => {
    fetch("/api/chat/topologies")
      .then((r) => r.json())
      .then((data) => setTopologies(data))
      .catch(console.error);
  }, []);

  // Fetch sessions when topology changes
  useEffect(() => {
    if (!selectedTopology) {
      setSessions([]);
      return;
    }
    fetch(`/api/chat/sessions?topologyId=${selectedTopology}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setSelectedSession(null);
        setMessages([]);
      })
      .catch(console.error);
  }, [selectedTopology]);

  // Fetch messages when session changes
  useEffect(() => {
    if (!selectedSession) return;
    setIsLoading(true);
    setMessages([]);
    setStreamingContent("");
    fetch(`/api/chat/${selectedSession}/messages`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedSession]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSelectTopology = (topologyId: string) => {
    setSelectedTopology(topologyId);
  };

  const handleNewSession = async () => {
    if (!selectedTopology) return;
    const id = `session-${Date.now()}`;
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, topologyId: selectedTopology }),
      });
      if (res.ok) {
        const session = await res.json();
        setSessions((prev) => [session, ...prev]);
        setSelectedSession(session.id);
        setMessages([]);
        setStreamingContent("");
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  const handleUpload = async (file: File): Promise<UploadedFile> => {
    if (!selectedSession) throw new Error("No session selected");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", selectedSession);
    const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  };

  const handleSend = useCallback(async (content: string, fileIds: string[]) => {
    if (!selectedSession) return;

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatSessionId: selectedSession,
      role: "user",
      content,
      files: fileIds.map((id) => ({ id, filename: "uploading...", filePath: "", fileType: "", content: null, size: 0, createdAt: new Date() })),
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setStreamingContent("");
    setThinkingStages(["正在接收请求..."]);
    setIsSending(true);

    try {
      const res = await fetch(`/api/chat/${selectedSession}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileIds }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      // Read streaming response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let hasReceivedData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;

        if (!hasReceivedData) {
          setThinkingStages(["正在接收请求...", "Agent 已开始回答"]);
          hasReceivedData = true;
        }

        setStreamingContent(assistantContent);
      }

      setThinkingStages([]);

      // Replace temp message with real messages
      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        chatSessionId: selectedSession,
        role: "user",
        content,
        createdAt: new Date(),
      };
      const assistantMsg: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        chatSessionId: selectedSession,
        role: "assistant",
        content: assistantContent,
        createdAt: new Date(),
      };
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.id.startsWith("temp-"));
        return [...filtered, userMsg, assistantMsg];
      });
      setStreamingContent("");
    } catch (error) {
      console.error("Send error:", error);
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-")));
    } finally {
      setIsSending(false);
    }
  }, [selectedSession]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-gray-800 bg-gray-900/30 flex flex-col">
          {/* Topology selector */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Topology</h3>
            <TopologySelector
              topologies={topologies}
              selectedId={selectedTopology}
              onSelect={handleSelectTopology}
            />
          </div>

          {/* Sessions list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-400">Sessions</h3>
              <button
                onClick={handleNewSession}
                disabled={!selectedTopology}
                className="p-1 hover:bg-gray-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="New session"
              >
                <Plus className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-gray-600 py-4 text-center">
                {selectedTopology ? "No sessions yet" : "Select a topology first"}
              </p>
            ) : (
              <div className="space-y-1">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      session.id === selectedSession
                        ? "bg-gray-800 text-white"
                        : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-300"
                    }`}
                  >
                    <div className="truncate font-medium">{session.title}</div>
                    <div className="text-xs text-gray-600">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!selectedSession ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-400 mb-2">
                  {selectedTopology ? "Select or create a session" : "Select a topology to start chatting"}
                </h2>
                <p className="text-gray-500 text-sm">
                  Choose a topology from the sidebar, then create a new chat session.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 && !streamingContent ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p className="text-sm">Start a new conversation</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Type a message or upload files to get started
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {isSending && thinkingStages.length > 0 && !streamingContent && (
                      <ThinkingIndicator stages={thinkingStages} />
                    )}
                    {streamingContent && (
                      <MessageBubble
                        message={{
                          id: "streaming",
                          chatSessionId: selectedSession,
                          role: "assistant",
                          content: streamingContent,
                          createdAt: new Date(),
                        }}
                      />
                    )}
                    {streamingContent && isSending && (
                      <div className="flex justify-start mb-4 -mt-2">
                        <span className="text-xs text-purple-400 animate-pulse">正在接收回答...</span>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <ChatInput
                onSend={handleSend}
                onUpload={handleUpload}
                disabled={isSending}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
