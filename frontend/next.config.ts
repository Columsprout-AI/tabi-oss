// next.config.ts
import type { NextConfig } from "next";

const api = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async headers() {
    // Allow localhost/127.* automatically for dev
    const connectExtra = [
      api, // e.g., http://localhost:3000 or https://api.tabi.columsprout.ai
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter(Boolean);

    const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-inline'
        https://www.googletagmanager.com
        https://www.google-analytics.com
        https://pagead2.googlesyndication.com
        https://adservice.google.com
        https://checkout.razorpay.com
        https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data:
        https://www.googletagmanager.com
        https://www.google-analytics.com
        https://stats.g.doubleclick.net
        https://googleads.g.doubleclick.net
        https://pagead2.googlesyndication.com
        https://adservice.google.com
        https://www.google.co.in
        https://www.gstatic.com
        https://img.clerk.com;
      connect-src 'self'
        https://www.google-analytics.com
        https://analytics.google.com
        https://stats.g.doubleclick.net
        https://googleads.g.doubleclick.net
        https://pagead2.googlesyndication.com
        https://api.clerk.dev
        https://storage.googleapis.com
        https://lumberjack.razorpay.com
        https://clerk-telemetry.com
        ${connectExtra.join(" ")};
      font-src 'self' https://fonts.gstatic.com;
      frame-src 'self'
        https://td.doubleclick.net
        https://api.razorpay.com
        https://checkout.razorpay.com
        https://www.googletagmanager.com;
      worker-src 'self' blob:;
    `
      .replace(/\s{2,}/g, " ")
      .trim();

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
