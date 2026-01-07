'use client';

import { useEffect, useState } from 'react';
import { AnnouncementsGrid } from '@/components/AnnouncementsGrid';
import { AnnouncementsData } from '@/lib/types';

export default function AnnouncementsPage() {
  const [data, setData] = useState<AnnouncementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'grid' | 'carousel'>('grid');

  useEffect(() => {
    // Get mode from:
    // 1. Global config (for widget embedding)
    // 2. URL params (for standalone pages)
    let modeToUse: 'grid' | 'carousel' = 'grid';

    if (typeof window !== 'undefined' && (window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { mode?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__) {
      modeToUse = ((window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { mode?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__?.mode as 'grid' | 'carousel') || 'grid';
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'carousel') {
        modeToUse = 'carousel';
      }
    }

    setMode(modeToUse);

    // Fetch announcements data
    const fetchData = async () => {
      try {
        // Get API base URL and dataParams from widget config or use current origin
        const widgetConfig = typeof window !== 'undefined' && (window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { apiBaseUrl?: string; dataParams?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__
          ? (window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { apiBaseUrl?: string; dataParams?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__
          : null;

        const apiBaseUrl = widgetConfig?.apiBaseUrl || '';
        const dataParamsString = widgetConfig?.dataParams || '';

        // Build query params from URL or widget config
        const apiParams = new URLSearchParams();

        // First, add params from widget's data-params attribute
        if (dataParamsString) {
          // Decode URL-encoded characters (e.g., %40 -> @)
          const decodedParams = decodeURIComponent(dataParamsString);

          // Parse data-params format: "@CongregationID=1,@NumPerPage=6"
          const paramPairs = decodedParams.split(',').map((p: string) => p.trim());
          paramPairs.forEach((pair: string) => {
            if (pair.includes('=')) {
              const [key, value] = pair.split('=');
              // Ensure @ prefix is present
              const cleanKey = key.startsWith('@') ? key : `@${key}`;
              apiParams.append(cleanKey, value);
            }
          });
        }

        // Then, add params from URL (these can override widget params)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          ['CongregationID', 'GroupID', 'EventID', 'Search', 'AnnouncementIDs', 'Page', 'NumPerPage'].forEach(
            (key) => {
              const value = urlParams.get(key);
              if (value) apiParams.set(`@${key}`, value); // Use set to override widget params
            }
          );
        }

        console.log('Fetching announcements with params:', apiParams.toString());
        const response = await fetch(`${apiBaseUrl}/api/announcements?${apiParams.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch announcements');
        }

        const result = await response.json();
        console.log('API response:', result);
        console.log('Announcements data:', result.Announcements);
        setData(result.Announcements);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-video bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return <AnnouncementsGrid data={data} mode={mode} />;
}
