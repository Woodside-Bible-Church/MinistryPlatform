'use client';

import { useEffect, useState } from 'react';
import { AnnouncementsGrid } from '@/components/AnnouncementsGrid';
import { AnnouncementsData, AnnouncementsLabels } from '@/lib/types';

/**
 * Helper function to get CongregationID from the selected location cookie
 * Cookie name: tbx-ws__selected-location
 * Value: Base64-encoded JSON with location_id field
 */
function getCongregationIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  try {
    // Parse cookies
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const cookieValue = cookies['tbx-ws__selected-location'];
    if (!cookieValue) return null;

    // Decode base64 to JSON
    // The cookie is a simple base64-encoded JSON object
    const jsonPayload = decodeURIComponent(
      atob(cookieValue)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const data = JSON.parse(jsonPayload);

    // Extract location_id
    // Example payload: {"user_id":201,"location_id":9,"location_name":"Lake Orion",...}
    if (data.location_id) {
      return String(data.location_id);
    }

    return null;
  } catch (error) {
    console.error('Error decoding selected location cookie:', error);
    return null;
  }
}

export default function AnnouncementsPage() {
  const [data, setData] = useState<AnnouncementsData | null>(null);
  const [labels, setLabels] = useState<AnnouncementsLabels>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'grid' | 'carousel'>('grid');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Single logo element that persists through loading and after
  // Grid mode only - logo transitions from center with spinner to top-right corner
  const logoElement = mode === 'grid' && (
    <div
      className="hidden md:block absolute transition-all ease-out pointer-events-none"
      style={{
        top: loading && !isTransitioning ? '1.5rem' : '1rem',
        width: loading && !isTransitioning ? '200px' : '275px',
        height: loading && !isTransitioning ? '200px' : '275px',
        right: loading && !isTransitioning ? 'calc(50% - 100px)' : '2rem', // Center: 50% - half width (100px), Final: 2rem from edge
        opacity: loading && !isTransitioning ? 0.15 : 0.08,
        transitionDuration: '0.8s',
        zIndex: loading ? 50 : 0
      }}
    >
      <div className="relative w-full h-full">
        {/* Spinning loading circle - only visible during loading, fades out with opacity */}
        <div
          className="absolute inset-0 animate-spin transition-opacity"
          style={{
            animationDuration: '2s',
            opacity: loading && !isTransitioning ? 0.3 : 0,
            transitionDuration: '0.8s'
          }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="70 200"
              strokeLinecap="round"
              className="text-primary dark:text-white"
            />
          </svg>
        </div>

        {/* Woodside logo */}
        <div className="w-full h-full p-4">
          <svg
            viewBox="0 0 822.73 822.41"
            className="w-full h-full text-primary dark:text-white"
          >
            <path d="M482.59,292.96c-28.5,75.56-63.52,148.62-91.88,224.24-22.85,60.93-44.5,165.54,5.99,218.03,53.19,55.31,103.27-36.03,126.36-76.12,29.77-51.67,60.19-102.91,92.51-153.1,37.77-58.65,82.78-117.18,128.05-170.34,17.33-20.35,35.58-39.9,55.18-58.05,1.32-.3,1.67.72,2.19,1.61,2.7,4.68,6.16,19.72,7.79,25.79,55.59,207.53-59.67,424.44-261.39,494.49-162.86,56.55-343.5,6.03-452.97-125.71l.02-2.82c22.1-29.38,43.34-59.51,66.31-88.22,46.87-58.59,104.84-117,159.18-168.95,39.21-37.49,94.79-86.04,141.88-112.38,2.97-1.66,18.74-10.3,20.79-8.46Z" fill="currentColor"/>
            <path d="M454.78,615.29c-.4-37.26,12.31-73.93,23.96-108.91,21.35-64.11,58.46-144.93,65.26-211.05,10.09-98.15-75.84-54.82-121.59-23.71-87.22,59.32-157.97,140.42-238.72,207.44-1.08.9-1.56,2.33-3.36,1.91,29.91-61.5,79.75-118.22,92.63-187.03,26.62-142.2-143-109.97-223.13-77.75-1.54-1.51,19.5-33.71,21.85-37.14C170.36,35.21,348.48-31.19,518.31,14.05c111.97,29.83,206.98,107.78,259.7,210.54l-1.23,3.19c-101.38,85.68-182.57,188.93-258.5,297.03-21.17,30.14-40.81,61.47-63.5,90.48Z" fill="currentColor"/>
            <path d="M38.3,581.71c-6.2-9.05-10.4-20.99-14.14-31.42C-1.72,478.2-6.79,400.44,8.86,325.38c1.73-8.3,5.99-29.98,9.5-36.56,1.25-2.35,11.96-9.93,14.86-12.01,41.76-29.96,121.9-63.33,173.22-50.74,49.51,12.15,15.29,70.69-.39,97.86-34.22,59.31-78.86,114.75-116.32,172.48-18.06,27.83-35.65,56.1-51.43,85.3Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );

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

        // First, add params from widget's data-params attribute (highest priority)
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

        // Handle @CongregationID with priority: data-params > URL param > cookie
        // Also check for friendly 'campus' URL param
        if (!apiParams.has('@CongregationID')) {
          let congregationId: string | null = null;
          let campusSlug: string | null = null;

          // Check URL parameters (second priority)
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);

            // Try @CongregationID first
            congregationId = urlParams.get('@CongregationID');

            // Also check for friendly 'campus' param (without @)
            campusSlug = urlParams.get('campus');

            // If not in URL, check cookie (third priority)
            if (!congregationId && !campusSlug) {
              congregationId = getCongregationIdFromCookie();
            }
          }

          // Add to params if found
          if (congregationId) {
            apiParams.set('@CongregationID', congregationId);
          } else if (campusSlug) {
            // Pass campus slug to API - stored proc will resolve it
            apiParams.set('@Campus', campusSlug);
          }
        }

        // Add other params from URL (only if not already set by data-params)
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          ['@GroupID', '@EventID', '@Search', '@AnnouncementIDs', '@Page', '@NumPerPage'].forEach(
            (key) => {
              const value = urlParams.get(key);
              if (value && !apiParams.has(key)) {
                apiParams.set(key, value);
              }
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
        console.log('Labels from Information:', result.Information);
        setData(result.Announcements);
        setLabels(result.Information || {});

        // Trigger transition for grid mode
        if (modeToUse === 'grid') {
          // Wait a frame to ensure the DOM is ready, then start transition
          requestAnimationFrame(() => {
            setIsTransitioning(true);
            setLoading(false); // Show content immediately when transition starts
          });
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    // Carousel skeleton
    if (mode === 'carousel') {
      return (
        <div className="px-4 md:px-8 pt-4 md:pt-8 pb-20 md:pb-2 mt-4 md:mt-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="pb-4 md:pb-8 mb-2 md:mb-4">
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                </div>
                <div className="hidden md:block w-40 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>

            {/* Carousel items skeleton */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="inline-flex gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[clamp(250px,50vw,400px)]">
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Grid loading - show persistent logo element with placeholder for content
    return (
      <div className="relative p-8">
        {logoElement}
        {/* Placeholder for content area */}
        <div className="min-h-[60vh]"></div>
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

  if (mode === 'grid') {
    return (
      <div className="relative">
        {logoElement}
        <AnnouncementsGrid data={data} mode={mode} labels={labels} />
      </div>
    );
  }

  return <AnnouncementsGrid data={data} mode={mode} labels={labels} />;
}
