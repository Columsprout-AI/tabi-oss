"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { pageview, GA_TRACKING_ID } from "../utils/gtag";
import Script from "next/script";

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window.gtag === "function") {
        console.log("✅ GA Loaded: Sending page_view event", pathname);
        pageview(pathname);
        } else {
        console.error("❌ GA not loaded! Check if gtag.js is included.");  
        }  
  }, [pathname]);

  return (
    <>
      {/* Google Analytics Scripts */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onLoad={() => console.log("✅ Google Analytics script loaded")}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `,
        }}
      />
    </>
  );
}
