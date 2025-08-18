import { useEffect, useRef } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/Redux/store";
import { signupUser, resetSignupFlag } from "@/Redux/Auth/slice";

export const UserSignupListener = () => {
  const { isSignedIn, user } = useUser();
  const { session } = useSession();
  const dispatch = useDispatch<AppDispatch>();
  const hasCalledAPI = useRef(false);
  const isSignedUp = useSelector((state: RootState) => state.auth.isSignedUp);

  useEffect(() => {
    if (!isSignedIn || !user || hasCalledAPI.current || isSignedUp) return;

    // const now = Date.now();
    const createdAt = user.createdAt
      ? new Date(user.createdAt).getTime()
      : null;
    const lastSignInAt = user.lastSignInAt
      ? new Date(user.lastSignInAt).getTime()
      : null;

    // Ensure the user just signed up (created account within the last 5 minutes)
    if (createdAt && lastSignInAt && lastSignInAt - createdAt < 5 * 60 * 1000) {
      hasCalledAPI.current = true;
      console.log("Triggering Signup API...");
      dispatch(
        signupUser({
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress || "",
          createdAt: new Date(createdAt).toISOString(),
          lastLogin: new Date(lastSignInAt).toISOString(),
          sessionId: session?.id || "",
        })
      );

      // Reset the signup flag after 5 seconds
      setTimeout(() => {
        dispatch(resetSignupFlag());
      }, 5000);
    }
  }, [isSignedIn, user, session, dispatch, isSignedUp]);

  return null;
};
