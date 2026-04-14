import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages, uploadedFiles } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatSessionId, sessionId))
      .orderBy(asc(chatMessages.createdAt));

    // Attach file info for messages with fileIds
    const result = [];
    for (const msg of messages) {
      let files: typeof uploadedFiles.$inferSelect[] = [];
      if (msg.fileIds) {
        const fileIds: string[] = JSON.parse(msg.fileIds);
        files = await db
          .select()
          .from(uploadedFiles)
          .where(eq(uploadedFiles.chatSessionId, sessionId));
        files = files.filter((f) => fileIds.includes(f.id));
      }
      result.push({ ...msg, files });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
