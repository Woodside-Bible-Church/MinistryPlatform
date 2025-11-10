import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Allow loading images from MinistryPlatform
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'my.woodsidebible.org',
        pathname: '/ministryplatformapi/files/**',
      },
    ],
  },

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
