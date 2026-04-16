"use client";

import type { ChatMessage } from "@/types/chat";
import { Loader2, Brain } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Strip markdown formatting for cleaner plain-text display.
 * Removes **bold**, *italic*, ### headers, --- horizontal rules, > blockquotes,
 * [link](url) patterns, and ``` code fences.
 */
function stripMarkdown(text: string): string {
  return text
    // Remove code fences
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, "").trim())
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic markers
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    // Remove inline code
    .replace(/`(.+?)`/g, "$1")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove blockquote markers
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove image syntax
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // Clean up extra blank lines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const displayContent = isUser ? message.content : stripMarkdown(message.content);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-gray-800 text-gray-100 rounded-bl-md"
        }`}
      >
        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.files.map((file) => (
              <span
                key={file.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                  isUser
                    ? "bg-blue-500/50 text-blue-100"
                    : "bg-gray-700/50 text-gray-300"
                }`}
              >
                📎 {file.filename}
              </span>
            ))}
          </div>
        )}

        {/* Message content */}
        <div className="text-sm whitespace-pre-wrap leading-relaxed">
          {displayContent}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? "text-blue-200" : "text-gray-500"
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

interface ThinkingIndicatorProps {
  stages?: string[];
}

export function ThinkingIndicator({ stages }: ThinkingIndicatorProps) {
  const currentStage = stages?.[stages.length - 1] || "正在处理请求...";

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-800 text-gray-100 rounded-bl-md">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-sm font-medium text-purple-400">思考中</span>
          <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
        </div>

        {/* Progress stages */}
        <div className="space-y-1.5">
          {stages && stages.length > 0 && stages.map((stage, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                i === stages.length - 1
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-green-500/20 text-green-400"
              }`}>
                {i === stages.length - 1 ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={i === stages.length - 1 ? "text-purple-300" : "text-gray-400"}>
                {stage}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
