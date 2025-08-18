// pages/api/ingestion-update.ts
import { NextResponse } from "next/server";

// A simple in-memory map to store ingestion data per session.
// For production, consider a more robust solution.
const ingestionDataMap: {
  [key: string]: { message: string; fileId: string } | null;
} = {};

// POST endpoint: Called by backend to update ingestion status
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received ingestion completion callback:", body);

    const { fileId, sessionId } = body;
    if (!fileId || !sessionId) {
      return NextResponse.json(
        { message: "Missing required data" },
        { status: 400 }
      );
    }

    // Update the shared state for this session
    ingestionDataMap[sessionId] = {
      message: "Ingestion completed",
      fileId,
    };

    console.log(
      "Updated ingestionDataMap for session:",
      sessionId,
      ingestionDataMap[sessionId]
    );

    return NextResponse.json(
      { message: "Ingestion data updated successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in ingestion-update API:", error);
    return NextResponse.json(
      { message: "Error in ingestion" },
      { status: 500 }
    );
  }
}

// GET endpoint: Called by frontend to fetch the latest ingestion data for a session
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json(
        { message: "Missing sessionId" },
        { status: 400 }
      );
    }

    const data = ingestionDataMap[sessionId] || null;
    console.log("GET function:", data);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error in ingestion-status API:", error);
    return NextResponse.json(
      { message: "Error retrieving data" },
      { status: 500 }
    );
  }
}
