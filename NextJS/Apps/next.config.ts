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

  // Increase body size limit for file uploads (experimental feature)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
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
