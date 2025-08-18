import { Montserrat, Open_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import ReduxProvider from "@/Redux/provider";
import DesktopOnlyWrapper from "@/components/custom/DesktopOnlyWrapper";
import ClientWrapper from "./ClientWrapper";
// ✅ Import your Analytics component
import Analytics from "@/components/Analytics";

export const metadata = {
  title: "AI Agents for eCommerce Growth",
  description:
    "Empowering eCommerce brands with AI-driven automation for customer engagement, support, and growth.",
};

const primaryFont = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-primary",
});

const secondaryFont = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-secondary",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body
        className={`${primaryFont.variable} ${secondaryFont.variable} antialiased min-h-screen flex flex-col`}
      >
        <ReduxProvider>
          <ClerkProvider>
          <Analytics />
            {/*
              1) We render <ClientWrapper> INSIDE <body> so it runs on the client.
              2) That wrapper includes all your "use client" listeners (logout, etc.).
            */}
            <ClientWrapper>
              <DesktopOnlyWrapper>
                <main className="flex-grow">
                  <Toaster position="top-center" reverseOrder={false} />
                  {children}
                </main>
              </DesktopOnlyWrapper>
            </ClientWrapper>
          </ClerkProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
