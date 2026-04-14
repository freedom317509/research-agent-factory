import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, uploadedFiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { saveAndExtractFile } from "@/services/file-extractor";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const file = formData.get("file") as File;

    if (!sessionId || !file) {
      return NextResponse.json(
        { error: "sessionId and file are required" },
        { status: 400 },
      );
    }

    // Verify session exists
    const session = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));

    if (session.length === 0) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 },
      );
    }

    const fileId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const extracted = await saveAndExtractFile(file, sessionId, fileId);

    await db.insert(uploadedFiles).values({
      id: extracted.id,
      chatSessionId: sessionId,
      filename: extracted.filename,
      filePath: extracted.filePath,
      fileType: extracted.fileType,
      content: extracted.content,
      size: extracted.size,
    });

    return NextResponse.json({
      id: extracted.id,
      filename: extracted.filename,
      fileType: extracted.fileType,
      size: extracted.size,
      hasContent: extracted.content !== null,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
