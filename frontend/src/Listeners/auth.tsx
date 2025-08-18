"use client";
import { useEffect, useRef } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/Redux/store";
import { signupUser, loginUser } from "@/Redux/Auth/slice";
export const UserAuthListener = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const hasCalledAPI = useRef(false);
  useEffect(() => {
    // 1. Wait for Clerk to finish loading user data
    if (!isLoaded) return;
    // 2. If user not signed in after load, clear storage and return
    if (!isSignedIn) {
      console.log("User is not signed in. Clearing localStorage...");
      localStorage.clear();
      return;
    }
    // 3. If we've already called the API, skip
    if (hasCalledAPI.current || !user) return;
    // The rest of your signup/login logic...
    const createdAt = user.createdAt
      ? new Date(user.createdAt).getTime()
      : null;
    const lastSignInAt = user.lastSignInAt
      ? new Date(user.lastSignInAt).getTime()
      : null;
    const clerkId = user.id;
    if (!createdAt || !lastSignInAt || !clerkId) return;
    const storedClerkId = localStorage.getItem("clerkId");
    const hasSignedUpBefore = localStorage.getItem("hasSignedUp");
    if (storedClerkId && storedClerkId !== clerkId) {
      console.log(
        "User deleted and recreated account. Resetting localStorage..."
      );
      localStorage.clear();
      localStorage.setItem("clerkId", clerkId);
    } else if (!storedClerkId) {
      localStorage.setItem("clerkId", clerkId);
    }
    const isFirstSignup =
      !hasSignedUpBefore && Math.abs(createdAt - lastSignInAt) < 5000;
    if (isFirstSignup) {
      hasCalledAPI.current = true;
      localStorage.setItem("hasSignedUp", "true");
      dispatch(
        signupUser({
          clerkId,
          email: user.primaryEmailAddress?.emailAddress || "",
          createdAt: new Date(createdAt).toISOString(),
          lastLogin: new Date(lastSignInAt).toISOString(),
          sessionId: session?.id || "",
        })
      );
      return;
    }
    // Otherwise, call login
    hasCalledAPI.current = true;
    dispatch(
      loginUser({
        clerkId,
        sessionId: session?.id || "",
      })
    );
  }, [isLoaded, isSignedIn, user, session, dispatch]);
  return null;
};
