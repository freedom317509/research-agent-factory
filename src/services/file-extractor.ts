import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export interface ExtractedFile {
  id: string;
  filename: string;
  filePath: string;
  fileType: string;
  content: string | null; // extracted text, null for images
  size: number;
}

async function ensureUploadDir(sessionId: string): Promise<string> {
  const dir = path.join(UPLOADS_DIR, sessionId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

async function extractPdf(filePath: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const dataBuffer = await fs.readFile(filePath);
  const pdf = new PDFParse({ data: new Uint8Array(dataBuffer) });
  const result = await pdf.getText();
  return result?.text || "";
}

async function extractDocx(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

export async function saveAndExtractFile(
  file: File,
  sessionId: string,
  fileId?: string,
): Promise<ExtractedFile> {
  const uploadDir = await ensureUploadDir(sessionId);
  const ext = getExtension(file.name);
  const fileId_ = fileId || `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${fileId_}${ext}`;
  const filePath = path.join(uploadDir, filename);

  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));

  const fileType = file.type || guessMimeType(ext);
  let content: string | null = null;

  switch (ext) {
    case ".txt":
    case ".md":
    case ".csv":
      content = await readTextFile(filePath);
      break;
    case ".pdf":
      content = await extractPdf(filePath);
      break;
    case ".docx":
      content = await extractDocx(filePath);
      break;
    // images and other binary files: no content extraction
  }

  return {
    id: fileId_,
    filename: file.name,
    filePath,
    fileType,
    content,
    size: file.size,
  };
}

export async function getFileContent(fileId: string, sessionId: string, ext: string): Promise<string | null> {
  const uploadDir = await ensureUploadDir(sessionId);
  const filePath = path.join(uploadDir, `${fileId}${ext}`);

  try {
    switch (ext) {
      case ".txt":
      case ".md":
      case ".csv":
        return readTextFile(filePath);
      case ".pdf":
        return extractPdf(filePath);
      case ".docx":
        return extractDocx(filePath);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function guessMimeType(ext: string): string {
  const map: Record<string, string> = {
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".csv": "text/csv",
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
  };
  return map[ext] || "application/octet-stream";
}

export function isImageFile(fileType: string): boolean {
  return fileType.startsWith("image/");
}
