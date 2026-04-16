"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble, { ThinkingIndicator } from "@/components/chat/message-bubble";
import ChatInput from "@/components/chat/chat-input";
import { Loader2, Plus } from "lucide-react";
import type { ChatMessage, UploadedFile } from "@/types/chat";

interface EditorChatViewProps {
  topologyId: string;
}

export default function EditorChatView({ topologyId }: EditorChatViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [thinkingStages, setThinkingStages] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startNewChat = useCallback(async () => {
    setIsCreating(true);
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    try {
      const res = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, topologyId }),
      });
      if (res.ok) {
        setSessionId(id);
        setMessages([]);
        setStreamingContent("");
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    } finally {
      setIsCreating(false);
    }
  }, [topologyId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleUpload = async (file: File): Promise<UploadedFile> => {
    if (!sessionId) throw new Error("Session not ready");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    const res = await fetch("/api/chat/upload", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  };

  const handleSend = useCallback(async (content: string, fileIds: string[]) => {
    if (!sessionId) return;

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      chatSessionId: sessionId,
      role: "user",
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setStreamingContent("");
    setThinkingStages(["正在接收请求..."]);
    setIsSending(true);

    try {
      const res = await fetch(`/api/chat/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileIds }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

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

      const userMsg: ChatMessage = {
        id: `msg-user-${Date.now()}`,
        chatSessionId: sessionId,
        role: "user",
        content,
        createdAt: new Date(),
      };
      const assistantMsg: ChatMessage = {
        id: `msg-assistant-${Date.now()}`,
        chatSessionId: sessionId,
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
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4 text-sm">Click below to start a new chat session</p>
          <button
            onClick={startNewChat}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Start New Chat
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && !streamingContent ? (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Chat with your topology</p>
            <p className="text-xs text-gray-600 mt-1">
              Ask questions or upload files for the agent pipeline to process
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
                  chatSessionId: sessionId || "",
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
    </div>
  );
}
