import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // ✅ Use `clerkClient.users.getUserList` instead of `clerkClient.users`
    const users = await clerkClient.arguments({
      emailAddress: [email],
    });

    const userExists = users.length > 0;
    return NextResponse.json({ exists: userExists });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
