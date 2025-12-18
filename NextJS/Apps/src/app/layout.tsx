import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import DynamicManifest from "@/components/DynamicManifest";
import { ThemeProvider } from "@/components/ThemeProvider";
import SimulationBanner from "@/components/SimulationBanner";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Apps | Woodside Bible Church",
  description: "Internal tools platform for Woodside Bible Church staff and volunteers",
  // Manifest is dynamically loaded by DynamicManifest component based on route
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Woodside Apps"
  },
  icons: {
    apple: "/assets/icons/android-chrome-192x192.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#61BC47",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/assets/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Woodside Apps" />
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
        className={`${montserrat.variable} antialiased bg-background`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SimulationBanner />
          <DynamicManifest />
          {children}
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
