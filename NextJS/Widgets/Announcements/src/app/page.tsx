'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnnouncementsGrid } from '@/components/AnnouncementsGrid';
import { type CampusOption } from '@/components/CampusSelector';
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
  const [refetching, setRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'grid' | 'carousel' | 'social'>('grid');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [campuses, setCampuses] = useState<CampusOption[]>([]);
  const [selectedCongregationId, setSelectedCongregationId] = useState<number | null>(null);

  // Resolved once on mount so a campus change can re-run the fetch without
  // re-reading window/config. baseParams holds the non-campus query params.
  const apiBaseUrlRef = useRef('');
  const baseParamsRef = useRef<URLSearchParams>(new URLSearchParams());
  const didInitRef = useRef(false);
  const suppressFetchRef = useRef(false);
  const pendingCampusNameRef = useRef<string | null>(null);

  // Fetch announcements for a campus. congregationId === null => church-wide
  // only. campusSlug is only used on the first load when the embed/URL gave a
  // slug instead of a numeric id.
  const fetchAnnouncements = useCallback(
    async (congregationId: number | null, campusSlug?: string | null) => {
      const params = new URLSearchParams(baseParamsRef.current);
      params.delete('@CongregationID');
      params.delete('@Campus');
      if (congregationId != null) {
        params.set('@CongregationID', String(congregationId));
      } else if (campusSlug) {
        params.set('@Campus', campusSlug);
      }

      const response = await fetch(
        `${apiBaseUrlRef.current}/api/announcements?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      const result = await response.json();
      setData(result.Announcements);
      setLabels(result.Information || {});
      return result.Announcements as AnnouncementsData;
    },
    []
  );

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

  // Initial mount: resolve mode + the initial campus, load the campus list,
  // and run the first announcements fetch.
  useEffect(() => {
    // Get mode from:
    // 1. Global config (for widget embedding)
    // 2. URL params (for standalone pages)
    let modeToUse: 'grid' | 'carousel' | 'social' = 'grid';

    if (typeof window !== 'undefined' && (window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { mode?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__) {
      modeToUse = ((window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { mode?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__?.mode as 'grid' | 'carousel' | 'social') || 'grid';
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'carousel' || modeParam === 'social') {
        modeToUse = modeParam;
      }
    }

    setMode(modeToUse);

    // Resolve API base URL + data-params from widget config.
    const widgetConfig = typeof window !== 'undefined' && (window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { apiBaseUrl?: string; dataParams?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__
      ? (window as Window & { __ANNOUNCEMENTS_WIDGET_CONFIG__?: { apiBaseUrl?: string; dataParams?: string } }).__ANNOUNCEMENTS_WIDGET_CONFIG__
      : null;

    const apiBaseUrl = widgetConfig?.apiBaseUrl || '';
    const dataParamsString = widgetConfig?.dataParams || '';
    apiBaseUrlRef.current = apiBaseUrl;

    // Split the resolved params into the campus selection (which the dropdown
    // now owns) and the base passthrough params (GroupID, Search, etc.).
    const baseParams = new URLSearchParams();
    let initialCongregationId: number | null = null;
    let initialCampusSlug: string | null = null;

    // data-params (highest priority)
    if (dataParamsString) {
      const decodedParams = decodeURIComponent(dataParamsString);
      decodedParams.split(',').map((p) => p.trim()).forEach((pair) => {
        if (!pair.includes('=')) return;
        const [key, value] = pair.split('=');
        const cleanKey = key.startsWith('@') ? key : `@${key}`;
        if (cleanKey === '@CongregationID') {
          const n = parseInt(value, 10);
          if (!Number.isNaN(n)) initialCongregationId = n;
        } else if (cleanKey === '@Campus' || cleanKey === '@campus') {
          initialCampusSlug = value;
        } else {
          baseParams.set(cleanKey, value);
        }
      });
    }

    // URL params: campus (second priority) + passthrough params.
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);

      if (initialCongregationId == null && !initialCampusSlug) {
        const urlCong = urlParams.get('@CongregationID');
        if (urlCong) {
          const n = parseInt(urlCong, 10);
          if (!Number.isNaN(n)) initialCongregationId = n;
        } else {
          const slug = urlParams.get('campus');
          if (slug) initialCampusSlug = slug;
        }
      }

      ['@GroupID', '@EventID', '@Search', '@AnnouncementIDs', '@Page', '@NumPerPage'].forEach((key) => {
        const value = urlParams.get(key);
        if (value && !baseParams.has(key)) baseParams.set(key, value);
      });
    }

    // Cookie (third priority) — read only; the dropdown never writes it back.
    if (initialCongregationId == null && !initialCampusSlug) {
      const cookieId = getCongregationIdFromCookie();
      if (cookieId) {
        const n = parseInt(cookieId, 10);
        if (!Number.isNaN(n)) initialCongregationId = n;
      }
    }

    baseParamsRef.current = baseParams;
    if (initialCongregationId != null) setSelectedCongregationId(initialCongregationId);

    // Load the campus list for the dropdown (non-blocking).
    fetch(`${apiBaseUrl}/api/campuses`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.campuses) setCampuses(json.campuses as CampusOption[]);
      })
      .catch(() => {
        /* dropdown just stays hidden if the list fails to load */
      });

    // First announcements fetch.
    (async () => {
      try {
        const ann = await fetchAnnouncements(initialCongregationId, initialCampusSlug);
        // Loaded via a slug (no numeric id yet)? Remember the campus name so the
        // dropdown can sync its selection once the campus list arrives.
        if (initialCongregationId == null && ann?.Campus?.Name) {
          pendingCampusNameRef.current = ann.Campus.Name;
        }

        if (modeToUse === 'grid') {
          requestAnimationFrame(() => {
            setIsTransitioning(true);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      } finally {
        didInitRef.current = true;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync the dropdown to a slug/cookie-based initial selection once the campus
  // list loads, without triggering a redundant re-fetch.
  useEffect(() => {
    if (selectedCongregationId != null) return;
    const name = pendingCampusNameRef.current;
    if (!name || campuses.length === 0) return;
    const match = campuses.find(
      (c) => c.name === name || `${c.name} Campus` === name || c.name === `${name} Campus`
    );
    if (match) {
      pendingCampusNameRef.current = null;
      suppressFetchRef.current = true; // data for this campus is already shown
      setSelectedCongregationId(match.id);
    }
  }, [campuses, selectedCongregationId]);

  // Re-fetch when the user picks a different campus. Never runs on the initial
  // mount, and never writes the selected-location cookie.
  useEffect(() => {
    if (!didInitRef.current) return;
    if (suppressFetchRef.current) {
      suppressFetchRef.current = false;
      return;
    }
    let cancelled = false;
    setRefetching(true);
    fetchAnnouncements(selectedCongregationId)
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'An error occurred');
      })
      .finally(() => {
        if (!cancelled) setRefetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCongregationId, fetchAnnouncements]);

  if (loading) {
    // Social skeleton
    if (mode === 'social') {
      return (
        <div className="px-4 py-6">
          <div className="max-w-lg mx-auto animate-pulse">
            {/* Header skeleton */}
            <div className="text-center mb-6">
              <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-24 mx-auto mb-2" />
              <div className="h-7 bg-gray-200 dark:bg-neutral-800 rounded w-48 mx-auto" />
            </div>
            {/* Quick links skeleton */}
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-gray-200 dark:bg-neutral-800 rounded w-20" />
              ))}
            </div>
            {/* Section header skeleton */}
            <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-40 mb-3" />
            {/* Announcement items skeleton */}
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-white/5">
                  <div className="w-24 aspect-video bg-gray-200 dark:bg-neutral-800" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Carousel skeleton
    if (mode === 'carousel') {
      return (
        <div className="px-4 md:px-8 pt-4 md:pt-8 pb-20 md:pb-2 mt-4 md:mt-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="pb-4 md:pb-8 mb-2 md:mb-4">
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-20 mb-2" />
                  <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded w-48" />
                </div>
                <div className="hidden md:block w-40 h-12 bg-gray-200 dark:bg-neutral-800 rounded" />
              </div>
            </div>

            {/* Carousel items skeleton */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="inline-flex gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-[clamp(250px,50vw,400px)]">
                    <div className="aspect-video bg-gray-200 dark:bg-neutral-800 rounded mb-3" />
                    <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-neutral-800 rounded w-1/2" />
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

  // The campus picker is grid-mode only — it lives inside the campus section
  // heading (rendered by AnnouncementsGrid).
  if (mode === 'grid') {
    return (
      <div className="relative">
        {logoElement}
        <AnnouncementsGrid
          data={data}
          mode={mode}
          labels={labels}
          campuses={campuses}
          selectedCongregationId={selectedCongregationId}
          onCampusChange={setSelectedCongregationId}
          campusChanging={refetching}
        />
      </div>
    );
  }

  if (mode === 'social') {
    return (
      <div className="px-4 py-6">
        <AnnouncementsGrid data={data} mode={mode} labels={labels} />
      </div>
    );
  }

  return <AnnouncementsGrid data={data} mode={mode} labels={labels} />;
}
