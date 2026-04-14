import { NextResponse } from "next/server";
import { getAllTemplates } from "@/services/template-manager";

export async function GET() {
  try {
    const allTemplates = await getAllTemplates();
    return NextResponse.json(allTemplates);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
}
