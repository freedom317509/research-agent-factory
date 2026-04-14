"use client";

import { useState, useRef, useCallback } from "react";
import { Paperclip, Send, Loader2 } from "lucide-react";
import FilePreview from "./file-preview";
import type { UploadedFile } from "@/types/chat";

interface ChatInputProps {
  onSend: (content: string, fileIds: string[]) => void;
  onUpload: (file: File) => Promise<UploadedFile>;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onUpload, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(selectedFiles)) {
        const uploaded = await onUpload(file);
        setFiles((prev) => [...prev, uploaded]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUpload]);

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(input.trim(), files.map((f) => f.id));
    setInput("");
    setFiles([]);
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-800 bg-gray-900/50 p-4">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {files.map((file) => (
            <FilePreview key={file.id} file={file} onRemove={handleRemoveFile} />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".txt,.md,.csv,.pdf,.docx,.png,.jpg,.jpeg,.gif"
          onChange={handleUpload}
          disabled={uploading || disabled}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || disabled}
          className="p-2.5 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          title="Attach file"
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5 text-gray-400" />
          )}
        </button>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
          disabled={disabled}
        />

        <button
          onClick={handleSend}
          disabled={(!input.trim() && files.length === 0) || disabled}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
