import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        pathname: '/maps/api/staticmap/**',
      },
      {
        protocol: 'https',
        hostname: 'my.woodsidebible.org',
        pathname: '/ministryplatformapi/files/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: https://maps.googleapis.com https://my.woodsidebible.org;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
