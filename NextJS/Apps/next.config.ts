import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // PWA configuration for app-like experience
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
