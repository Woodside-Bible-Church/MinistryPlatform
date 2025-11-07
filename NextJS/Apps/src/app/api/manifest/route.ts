import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type AppManifest = {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  background_color: string;
  theme_color: string;
  orientation?: 'any' | 'natural' | 'landscape' | 'portrait';
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: string;
  }>;
  scope?: string;
  categories?: string[];
};

const manifests: Record<string, AppManifest> = {
  projects: {
    name: 'Project Budgets',
    short_name: 'Projects',
    description: 'Manage project budgets, expenses, and income tracking',
    start_url: '/projects',
    scope: '/projects',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#61BC47',
    orientation: 'any',
    categories: ['finance', 'productivity', 'business'],
    icons: [
      {
        src: '/icons/projects-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/projects-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/projects-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/projects-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  counter: {
    name: 'Event Counter',
    short_name: 'Counter',
    description: 'Real-time event attendance tracking and metrics',
    start_url: '/counter',
    scope: '/counter',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    categories: ['utilities', 'productivity'],
    icons: [
      {
        src: '/icons/counter-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/counter-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/counter-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/counter-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  prayer: {
    name: 'Prayer Requests',
    short_name: 'Prayer',
    description: 'Submit and manage prayer requests',
    start_url: '/prayer',
    scope: '/prayer',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8b5cf6',
    orientation: 'any',
    categories: ['lifestyle', 'social'],
    icons: [
      {
        src: '/icons/prayer-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/prayer-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/prayer-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/prayer-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  'people-search': {
    name: 'People Search',
    short_name: 'People',
    description: 'Search and find people in the directory',
    start_url: '/people-search',
    scope: '/people-search',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#10b981',
    orientation: 'any',
    categories: ['social', 'productivity'],
    icons: [
      {
        src: '/icons/people-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/people-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/people-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/people-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  default: {
    name: 'Woodside Bible Church Apps',
    short_name: 'WBC Apps',
    description: 'Church management and community apps',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#61BC47',
    orientation: 'any',
    categories: ['productivity', 'lifestyle'],
    icons: [
      {
        src: '/icons/default-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/default-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/default-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/default-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app') || 'default';

  const manifest = manifests[app] || manifests.default;

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
