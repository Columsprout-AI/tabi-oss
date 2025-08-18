"use client"; // This file is a client component

import React from "react";
import { UserLogoutListener } from "../Listeners/userLogout";
import { UserAuthListener } from "../Listeners/auth";
import { AuthStorageListener } from "../Listeners/localStorage";
import SessionChangeListener from "../Listeners/sessionChange";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* All your client-only listeners here */}
      <AuthStorageListener />
      <UserAuthListener />
      <UserLogoutListener />
      <SessionChangeListener />
      {/* Render the rest of the UI */}
      {children}
    </>
  );
}
