"use client";

import { useClerk, useSession } from "@clerk/nextjs";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/Redux/store";
import { logoutUser } from "@/Redux/Auth/slice";

export default function LogoutButton() {
  const { session } = useSession();
  const { signOut } = useClerk();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = () => {
    // If we have a valid Clerk session ID, call the Redux thunk
    if (session?.id) {
      dispatch(logoutUser({ sessionId: session.id }))
        .unwrap()
        .finally(() => {
          // Then sign out from Clerk and redirect
          signOut().then(() => {
            window.location.href = "/signin";
          });
        });
    } else {
      // If no session, just sign out
      signOut().then(() => {
        window.location.href = "/signin";
      });
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-white px-4 py-2 rounded-md bg-black hover:bg-gray-800"
    >
      Logout
    </button>
  );
}
