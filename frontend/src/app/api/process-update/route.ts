import { NextResponse } from "next/server";

// Map sessionId -> processData
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processDataMap: Record<string, any> = {};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  console.log("GET /api/process-update called, sessionId:", sessionId);

  // If sessionId is missing, return an error
  if (!sessionId) {
    return NextResponse.json({ message: "Missing sessionId" }, { status: 400 });
  }

  const data = processDataMap[sessionId];
  console.log("process update data for test", data);

  processDataMap[sessionId] = null;

  if (!data) {
    // No data means still processing
    return NextResponse.json({ message: "Processing..." }, { status: 202 });
  }

  // Return the data for this session
  return NextResponse.json(data, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received data:", body);

    const {
      sessionId,
      projectId,
      outputFilePath,
      projectCredits,
      userCredits,
    } = body;
    if (
      !sessionId ||
      !projectId ||
      !outputFilePath ||
      !projectCredits ||
      !userCredits
    ) {
      return NextResponse.json(
        { message: "Missing required data" },
        { status: 400 }
      );
    }

    // Store data keyed by sessionId
    processDataMap[sessionId] = {
      projectId,
      outputFilePath,
      message: "Processing completed",
      projectCredits,
      userCredits,
    };

    console.log(
      "Stored processData for session:",
      sessionId,
      processDataMap[sessionId]
    );
    return NextResponse.json(
      { message: "Process data updated successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in process-update API:", error);
    return NextResponse.json(
      { message: "Error processing data" },
      { status: 500 }
    );
  }
}
