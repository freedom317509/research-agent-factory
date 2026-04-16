import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatSessions, chatMessages, uploadedFiles, topologies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { executeChatStream, getSessionHistory } from "@/services/chat-executor";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { content, fileIds } = body;

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 },
      );
    }

    // Fetch session
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

    // Fetch topology
    const topoData = await db
      .select()
      .from(topologies)
      .where(eq(topologies.id, session[0].topologyId));

    if (topoData.length === 0) {
      return NextResponse.json(
        { error: "Topology not found" },
        { status: 404 },
      );
    }

    const nodes = JSON.parse(topoData[0].nodes);
    const edges = JSON.parse(topoData[0].edges);

    // Fetch file content if any
    let fileContent: string | null = null;
    if (fileIds && fileIds.length > 0) {
      const files = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.chatSessionId, sessionId));
      const matchingFiles = files.filter((f) => fileIds.includes(f.id));
      const contents = matchingFiles.map((f) => f.content).filter(Boolean) as string[];
      if (contents.length > 0) {
        fileContent = contents.join("\n\n---\n\n");
      }
    }

    // Save user message
    const userMsgId = `msg-${Date.now()}-user`;
    await db.insert(chatMessages).values({
      id: userMsgId,
      chatSessionId: sessionId,
      role: "user",
      content,
      fileIds: fileIds ? JSON.stringify(fileIds) : null,
    });

    // Get updated history (includes the user message we just saved)
    const history = await getSessionHistory(sessionId);

    // Execute chat with streaming
    const { stream } = await executeChatStream(
      nodes,
      edges,
      content,
      fileContent,
      history,
    );

    // Collect the stream output for DB saving while also streaming to client
    const encoder = new TextEncoder();
    const reader = stream.getReader();
    let fullOutput = "";

    const readable = new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          // Save assistant message after streaming completes
          const assistantMsgId = `msg-${Date.now()}-assistant`;
          await db.insert(chatMessages).values({
            id: assistantMsgId,
            chatSessionId: sessionId,
            role: "assistant",
            content: fullOutput,
          });
          // Update session updatedAt
          await db
            .update(chatSessions)
            .set({ updatedAt: new Date() })
            .where(eq(chatSessions.id, sessionId));
          controller.close();
          return;
        }
        fullOutput += value;
        controller.enqueue(encoder.encode(value));
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat execution failed" },
      { status: 500 },
    );
  }
}
