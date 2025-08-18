"use client";
import { useAuth } from "@clerk/nextjs";

export default function User() {
  const { userId, sessionId } = useAuth();

  return (
    <div>
      {userId}
      {sessionId}
    </div>
  );
}
