"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function DesktopOnlyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isDesktop) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center md:text-2xl text-lg font-semibold gap-3">
        <Image src="/logo.png" alt="logo" width={250} height={50} className="invert"/>
        This website is only available on desktop.
      </div>
    );
  }

  return <>{children}</>;
}
