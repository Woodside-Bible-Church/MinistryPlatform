import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DevLoginWidget } from "@/components/DevLoginWidget";
import { DevTokenInput } from "@/components/DevTokenInput";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "RSVP Widget - Ministry Platform",
  description: "RSVP for church events and services"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* MinistryPlatform Widgets Script */}
        <Script
          id="MPWidgets"
          src="https://my.woodsidebible.org/widgets/dist/MPWidgets.js"
          strategy="beforeInteractive"
        />

        {/* MP Widgets Configuration */}
        <Script
          id="MPWidgetsConfig"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.MPWidgetsConfig = {
                baseUrl: 'https://my.woodsidebible.org'
              };
            `
          }}
        />

        {/* Development Authentication Tools */}
        <DevTokenInput />
        <DevLoginWidget />

        {children}
      </body>
    </html>
  );
}
