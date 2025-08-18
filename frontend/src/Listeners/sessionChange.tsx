"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@clerk/nextjs";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/Redux/store";
import { logoutUser } from "@/Redux/Auth/slice";

export default function SessionChangeListener() {
  const { session, isLoaded } = useSession();
  const dispatch = useDispatch<AppDispatch>();

  // Track whether the user was signed in before
  const wasSignedInRef = useRef(false);
  // Optionally track the last known sessionId if your backend needs it
  const lastSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't do anything until Clerk is fully loaded
    if (!isLoaded) return;

    const currentlySignedIn = !!session?.id;

    if (currentlySignedIn) {
      // The user is signed in, store the session ID
      wasSignedInRef.current = true;
      lastSessionIdRef.current = session!.id;
    } else {
      // The user is signed out (no session)
      // If we WERE signed in before, that means they've just logged out
      if (wasSignedInRef.current) {
        console.log("Clerk floatie sign-out detected. Calling logout API...");
        // Dispatch your logout thunk with the last known sessionId (or empty if none)
        dispatch(logoutUser({ sessionId: lastSessionIdRef.current ?? "" }));

        // Reset
        wasSignedInRef.current = false;
        lastSessionIdRef.current = null;
      }
    }
  }, [session, isLoaded, dispatch]);

  return null;
}
