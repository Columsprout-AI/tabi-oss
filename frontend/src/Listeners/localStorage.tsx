"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export const AuthStorageListener = () => {
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) {
      localStorage.removeItem("hasSyncedUser");
    }
  }, [isSignedIn]);

  return null;
};
