import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
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
  title: "Prayer Widget - Ministry Platform",
  description: "Submit and pray for prayer requests",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prayer Widget"
  },
  icons: {
    apple: "/assets/icons/android-chrome-192x192.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/assets/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Pastor App" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link
          rel="icon"
          type="image/png"
          sizes="196x196"
          href="/assets/icons/favicon-196.png"
        />
        <link rel="apple-touch-icon" href="/assets/icons/apple-icon-180.png" />
      </head>
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
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
