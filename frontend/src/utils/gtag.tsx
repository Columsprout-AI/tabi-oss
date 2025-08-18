// src/lib/gtag.ts
"use client";
// 1. Force GA_TRACKING_ID to be a string (fallback to "")
export const GA_TRACKING_ID: string = process.env.NEXT_PUBLIC_GA_ID ?? "";

// 2. Declare global window.gtag with better typing
declare global {
  interface Window {
    gtag: (
      command: "config" | "event",
      trackingIdOrEventName: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

// 3. Pageview tracking
export const pageview = (url: string) => {
  // Ensure gtag and GA_TRACKING_ID exist
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    });
  } else {
    console.warn("GA_TRACKING_ID is missing or gtag is not initialized.");
  }
};

// 4. Event tracking
interface GTagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const event = ({ action, category, label, value }: GTagEvent) => {
  if (typeof window !== "undefined" && window.gtag && GA_TRACKING_ID) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
    });
  } else {
    console.warn("GA_TRACKING_ID is missing or gtag is not initialized.");
  }
};
