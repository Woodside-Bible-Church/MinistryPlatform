import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
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
  title: "Church Groups | Connect & Grow Together",
  description: "Find and join small groups, bible studies, and community gatherings at our church. Connect with others and grow in faith together.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Church Groups"
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
        <meta name="apple-mobile-web-app-title" content="Church Groups" />
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
