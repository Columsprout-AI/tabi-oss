"use client"; // 1) Must be a client component

import { useEffect, useRef } from "react";
import { useClerk, useSession } from "@clerk/nextjs";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/Redux/store";
import { logoutUser } from "@/Redux/Auth/slice";

// 10 minutes
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

export const UserLogoutListener = () => {
  const { session, isLoaded } = useSession();
  const clerk = useClerk();
  const dispatch = useDispatch<AppDispatch>();

  // Tracks the inactivity timeout
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1) If Clerk hasn't finished loading or no session is found, do nothing
    if (!isLoaded || !session?.id) return;

    // Reset the timer
    const resetInactivityTimer = () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      inactivityTimer.current = setTimeout(() => {
        console.log("User inactive for 10 minutes. Logging out...");
        clerk.signOut();
      }, INACTIVITY_TIMEOUT);
    };

    // Listen for user activity
    const activityEvents = ["mousemove", "keydown", "scroll", "click"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );

    // Start the timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
    };
  }, [isLoaded, session, dispatch, clerk]);

  return null;
};
