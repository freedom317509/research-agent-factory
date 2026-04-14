"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "@/components/chat/message-bubble";
import ChatInput from "@/components/chat/chat-input";
import { Loader2, Loader } from "lucide-react";
import type { ChatMessage, UploadedFile } from "@/types/chat";

interface EditorChatViewProps {
  topologyId: string;
}

export default function EditorChatView({ topologyId }: EditorChatViewProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-create session
  useEffect(() => {
    const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    fetch("/api/chat/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, topologyId }),
    })
      .then((r) => r.json())
      .then(() => {
        setSessionId(id);
        setIsReady(true);
      })
      .catch(console.error);
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        setStreamingContent(assistantContent);
      }

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

  if (!isReady) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
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
