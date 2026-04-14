"use client";

import type { UploadedFile } from "@/types/chat";

interface FilePreviewProps {
  file: UploadedFile;
  onRemove?: (fileId: string) => void;
}

function isImageFile(fileType: string): boolean {
  return fileType.startsWith("image/");
}

interface FilePreviewProps {
  file: UploadedFile;
  onRemove?: (fileId: string) => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = isImageFile(file.fileType);
  const sizeLabel = file.size < 1024
    ? `${file.size} B`
    : file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg text-sm">
      {isImage ? (
        <span className="text-lg">🖼️</span>
      ) : (
        <span className="text-lg">📄</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-medium truncate">{file.filename}</p>
        <p className="text-gray-500 text-xs">{sizeLabel}</p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(file.id)}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
