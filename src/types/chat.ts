export interface UploadedFile {
  id: string;
  filename: string;
  filePath: string;
  fileType: string;
  content: string | null;
  size: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  chatSessionId: string;
  role: "user" | "assistant";
  content: string;
  fileIds?: string | null;
  files?: UploadedFile[];
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  topologyId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopologySummary {
  id: string;
  taskId: string;
  createdAt: Date;
  taskTitle: string;
}
