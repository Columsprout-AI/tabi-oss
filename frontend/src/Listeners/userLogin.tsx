import { useEffect, useRef } from "react";
import { useUser, useSession } from "@clerk/nextjs";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/Redux/store";
import { loginUser } from "@/Redux/Auth/slice";

export const UserLoginListener = () => {
  const { session } = useSession();
  const { isSignedIn, user } = useUser();
  const dispatch = useDispatch<AppDispatch>();
  const hasLoggedIn = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || hasLoggedIn.current) return;

    const createdAt = user.createdAt
      ? new Date(user.createdAt).getTime()
      : null;
    const lastSignInAt = user.lastSignInAt
      ? new Date(user.lastSignInAt).getTime()
      : null;

    // Ensure this is a normal login, NOT a first-time signup
    if (
      !createdAt ||
      !lastSignInAt ||
      lastSignInAt - createdAt > 1 * 60 * 1000
    ) {
      hasLoggedIn.current = true;
      console.log("Triggering Login API...");

      dispatch(
        loginUser({
          clerkId: user.id,
          sessionId: session?.id || "",
        })
      );
    }
  }, [isSignedIn, user, dispatch, session]);

  return null;
};
