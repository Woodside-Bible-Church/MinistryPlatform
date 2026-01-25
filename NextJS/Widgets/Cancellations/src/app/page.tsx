'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { CampusCard } from '@/components/CampusCard';
import { formatDateTime } from '@/lib/utils';
import type { CancellationsApiResponse, Campus, CancellationsInformation } from '@/lib/types';

// Polling interval in milliseconds (60 seconds)
const POLL_INTERVAL = 60000;

// Widget config type for window global
interface WidgetConfig {
  apiBaseUrl?: string;
  dataParams?: string;
}

// Extend window for widget globals
declare global {
  interface Window {
    __CANCELLATIONS_WIDGET_CONFIG__?: WidgetConfig;
  }
}

// Default labels when API hasn't loaded yet
const defaultLabels: CancellationsInformation = {
  alertTitle: 'Weather Advisory',
  mainTitle: 'Cancellations',
  alertMessage: 'Due to hazardous road conditions from winter weather, several church activities have been affected. Please check your campus status below before traveling.',
  autoRefreshMessage: 'This page refreshes automatically. Check back for the latest updates.',
  lastUpdatedPrefix: 'Last updated:',
  openStatusMessage: 'All activities are proceeding as scheduled',
  openStatusSubtext: 'No cancellations or modifications at this time',
};

/**
 * Get API base URL - works both in Next.js app and widget bundle
 */
function getApiBaseUrl(): string {
  // Check if running in widget context
  if (typeof window !== 'undefined') {
    const widgetConfig = window.__CANCELLATIONS_WIDGET_CONFIG__;
    if (widgetConfig?.apiBaseUrl) {
      return widgetConfig.apiBaseUrl;
    }
  }
  // Default to current origin for Next.js app, or production URL
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://cancellations-nu.vercel.app';
}

/**
 * Get congregation/campus from cookie
 * Returns both ID and name possibilities
 */
function getCampusFromCookie(): { id?: string; name?: string; slug?: string } | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const result: { id?: string; name?: string; slug?: string } = {};

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    const decodedValue = decodeURIComponent(value || '');
    const lowerName = name?.toLowerCase();

    // Check for congregation/campus ID cookies
    if (['congregationid', 'congregation_id', 'campusid', 'campus_id', 'congregation', 'location_id'].includes(lowerName)) {
      result.id = decodedValue;
    }
    // Check for campus name cookies
    if (['selectedcampus', 'campus', 'location', 'campus_name', 'campusname', 'selectedlocation'].includes(lowerName)) {
      // Could be a name or slug
      if (/^\d+$/.test(decodedValue)) {
        result.id = decodedValue;
      } else if (decodedValue.includes('-')) {
        result.slug = decodedValue.toLowerCase();
      } else {
        result.name = decodedValue;
      }
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Parse data-params attribute for initial values
 * Format: "@CampusID=1" or "@Campus=troy" or "@CongregationID=12"
 */
function parseDataParams(): { congregationId?: string; campusSlug?: string } {
  if (typeof window === 'undefined') return {};

  const widgetConfig = window.__CANCELLATIONS_WIDGET_CONFIG__;
  const dataParams = widgetConfig?.dataParams;

  if (!dataParams) return {};

  const result: { congregationId?: string; campusSlug?: string } = {};

  // Parse @Key=Value format
  const params = dataParams.split('&');
  for (const param of params) {
    const match = param.match(/@?(\w+)=(.+)/);
    if (match) {
      const [, key, value] = match;
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'congregationid' || lowerKey === 'campusid') {
        result.congregationId = value;
      } else if (lowerKey === 'campus') {
        result.campusSlug = value;
      }
    }
  }

  return result;
}

/**
 * Get URL search params
 */
function getUrlParams(): { congregationId?: string; campusSlug?: string } {
  if (typeof window === 'undefined') return {};

  const urlParams = new URLSearchParams(window.location.search);
  const result: { congregationId?: string; campusSlug?: string } = {};

  // Check various param names
  const congregationId = urlParams.get('@CongregationID') || urlParams.get('CongregationID') ||
    urlParams.get('@congregationId') || urlParams.get('congregationId');
  const campus = urlParams.get('@Campus') || urlParams.get('Campus') ||
    urlParams.get('@campus') || urlParams.get('campus');

  if (congregationId) result.congregationId = congregationId;
  if (campus) result.campusSlug = campus;

  return result;
}

export default function CancellationsPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [labels, setLabels] = useState<CancellationsInformation>(defaultLabels);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch cancellation data from API
   */
  const fetchData = useCallback(async (isInitialLoad = false) => {
    try {
      const apiBaseUrl = getApiBaseUrl();

      // Get initial campus preference from URL/data-params/cookie
      // But we fetch ALL campuses (no server-side filtering)
      const dataParams = parseDataParams();
      const urlParams = getUrlParams();
      const cookieData = getCampusFromCookie();

      // Fetch all campuses without filtering
      const url = `${apiBaseUrl}/api/cancellations`;

      const response = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: CancellationsApiResponse = await response.json();

      // Update state with API data
      if (data.Information) {
        setLabels(data.Information);
      }
      if (data.LastUpdated) {
        setLastUpdated(data.LastUpdated);
      }
      if (data.Campuses) {
        setCampuses(data.Campuses);

        // Set initial selected campus if not already set
        if (isInitialLoad && data.Campuses.length > 0) {
          // Priority: URL param > data-param > cookie > first affected campus > first campus
          const paramCampusSlug = urlParams.campusSlug || dataParams.campusSlug;
          const paramCongregationId = urlParams.congregationId || dataParams.congregationId;

          // Try to match by URL/data-param slug first
          if (paramCampusSlug) {
            const matchingCampus = data.Campuses.find(
              c => c.slug === paramCampusSlug.toLowerCase() ||
                   c.name.toLowerCase().replace(/['\s]/g, '-') === paramCampusSlug.toLowerCase()
            );
            if (matchingCampus) {
              setSelectedCampus(matchingCampus.name);
              return;
            }
          }

          // Try to match by URL/data-param congregation ID
          if (paramCongregationId) {
            const matchingCampus = data.Campuses.find(
              c => c.id.toString() === paramCongregationId
            );
            if (matchingCampus) {
              setSelectedCampus(matchingCampus.name);
              return;
            }
          }

          // Try to match by cookie (supports ID, name, or slug)
          if (cookieData) {
            let matchingCampus: Campus | undefined;

            // Match by ID
            if (cookieData.id) {
              matchingCampus = data.Campuses.find(c => c.id.toString() === cookieData.id);
            }
            // Match by name (case-insensitive)
            if (!matchingCampus && cookieData.name) {
              matchingCampus = data.Campuses.find(
                c => c.name.toLowerCase() === cookieData.name!.toLowerCase()
              );
            }
            // Match by slug
            if (!matchingCampus && cookieData.slug) {
              matchingCampus = data.Campuses.find(
                c => c.slug === cookieData.slug ||
                     c.name.toLowerCase().replace(/['\s]/g, '-') === cookieData.slug
              );
            }

            if (matchingCampus) {
              setSelectedCampus(matchingCampus.name);
              return;
            }
          }

          // Default to first affected campus or first campus
          const affectedCampus = data.Campuses.find(c => c.status !== 'open');
          setSelectedCampus(affectedCampus?.name || data.Campuses[0].name);
        }
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching cancellations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');

      // On initial load error, show empty state
      if (isInitialLoad) {
        setCampuses([]);
      }
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const initialFetch = async () => {
      await fetchData(true);

      // Transition out of loading state
      requestAnimationFrame(() => {
        setIsTransitioning(true);
        setLoading(false);
      });
    };

    initialFetch();
  }, [fetchData]);

  // Polling for auto-refresh
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchData(false);
    }, POLL_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [fetchData]);

  // Get unique campus names for dropdown
  const campusNames = useMemo(() => {
    return [...campuses].sort((a, b) => a.name.localeCompare(b.name)).map(c => c.name);
  }, [campuses]);

  // Filter and sort campuses
  const filteredCampuses = useMemo(() => {
    if (!selectedCampus) return campuses;
    return campuses.filter(c => c.name === selectedCampus).sort((a, b) => a.name.localeCompare(b.name));
  }, [campuses, selectedCampus]);

  const hasAffectedCampuses = campuses.some(c => c.status !== 'open');

  // Woodside logo element - same pattern as Announcements widget
  // Starts centered during loading, transitions to top-right corner
  const logoElement = (
    <div
      className="hidden md:block absolute transition-all ease-out pointer-events-none"
      style={{
        top: loading && !isTransitioning ? '1.5rem' : '1rem',
        width: loading && !isTransitioning ? '200px' : '275px',
        height: loading && !isTransitioning ? '200px' : '275px',
        right: loading && !isTransitioning ? 'calc(50% - 100px)' : '2rem',
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
              className="text-primary"
            />
          </svg>
        </div>

        {/* Woodside logo */}
        <div className="w-full h-full p-4">
          <svg
            viewBox="0 0 822.73 822.41"
            className="w-full h-full text-primary"
          >
            <path d="M482.59,292.96c-28.5,75.56-63.52,148.62-91.88,224.24-22.85,60.93-44.5,165.54,5.99,218.03,53.19,55.31,103.27-36.03,126.36-76.12,29.77-51.67,60.19-102.91,92.51-153.1,37.77-58.65,82.78-117.18,128.05-170.34,17.33-20.35,35.58-39.9,55.18-58.05,1.32-.3,1.67.72,2.19,1.61,2.7,4.68,6.16,19.72,7.79,25.79,55.59,207.53-59.67,424.44-261.39,494.49-162.86,56.55-343.5,6.03-452.97-125.71l.02-2.82c22.1-29.38,43.34-59.51,66.31-88.22,46.87-58.59,104.84-117,159.18-168.95,39.21-37.49,94.79-86.04,141.88-112.38,2.97-1.66,18.74-10.3,20.79-8.46Z" fill="currentColor"/>
            <path d="M454.78,615.29c-.4-37.26,12.31-73.93,23.96-108.91,21.35-64.11,58.46-144.93,65.26-211.05,10.09-98.15-75.84-54.82-121.59-23.71-87.22,59.32-157.97,140.42-238.72,207.44-1.08.9-1.56,2.33-3.36,1.91,29.91-61.5,79.75-118.22,92.63-187.03,26.62-142.2-143-109.97-223.13-77.75-1.54-1.51,19.5-33.71,21.85-37.14C170.36,35.21,348.48-31.19,518.31,14.05c111.97,29.83,206.98,107.78,259.7,210.54l-1.23,3.19c-101.38,85.68-182.57,188.93-258.5,297.03-21.17,30.14-40.81,61.47-63.5,90.48Z" fill="currentColor"/>
            <path d="M38.3,581.71c-6.2-9.05-10.4-20.99-14.14-31.42C-1.72,478.2-6.79,400.44,8.86,325.38c1.73-8.3,5.99-29.98,9.5-36.56,1.25-2.35,11.96-9.93,14.86-12.01,41.76-29.96,121.9-63.33,173.22-50.74,49.51,12.15,15.29,70.69-.39,97.86-34.22,59.31-78.86,114.75-116.32,172.48-18.06,27.83-35.65,56.1-51.43,85.3Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  );

  // Loading state - matches Announcements widget pattern
  if (loading) {
    return (
      <div className="relative p-8">
        {logoElement}
        <div className="min-h-[60vh]"></div>
      </div>
    );
  }

  // Empty state when no campuses
  if (campuses.length === 0) {
    return (
      <div className="relative">
        {logoElement}
        <div className="pb-6 md:pb-0 mb-4 md:mb-8 px-2 md:px-0 relative overflow-visible animate-[fadeInFromRight_1.25s_ease-out_0s_both]">
          <div className="flex-1 min-w-0 text-right">
            <div className="text-sm md:text-base font-normal text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-amber-500 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {labels.alertTitle}
            </div>
            <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
              {labels.mainTitle}
            </h1>
          </div>
        </div>
        <div className="text-center py-12 text-gray-500 px-2 md:px-0 animate-[fadeInUp_0.8s_ease-out_0.5s_both]">
          {error ? (
            <p>Unable to load campus information. Please try again later.</p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-700">{labels.openStatusMessage}</p>
              <p className="mt-2">{labels.openStatusSubtext}</p>
            </>
          )}
        </div>
        <div
          className="mt-8 text-center text-sm text-gray-400 px-2 md:px-0"
          style={{ animation: 'fadeInUp 0.5s ease-out 1.5s both' }}
        >
          <p>{labels.autoRefreshMessage}</p>
          <p className="mt-1">
            {labels.lastUpdatedPrefix} {formatDateTime(lastUpdated)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {logoElement}

      {/* Main Content Container */}
      <div>
        {/* Header - matches Announcements typography exactly */}
        <div className="pb-6 md:pb-0 mb-4 md:mb-8 px-2 md:px-0 relative overflow-visible animate-[fadeInFromRight_1.25s_ease-out_0s_both]">
          <div className="flex-1 min-w-0 text-right">
            <div className="text-sm md:text-base font-normal text-gray-400 uppercase tracking-widest flex items-center justify-end gap-2">
              <svg
                className="w-4 h-4 md:w-5 md:h-5 text-amber-500 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {labels.alertTitle}
            </div>
            <h1 className="text-3xl md:text-7xl lg:text-8xl font-bold tracking-tighter">
              {labels.mainTitle}
            </h1>
          </div>
        </div>

        {/* Alert Message - Centered and separated */}
        {labels.alertMessage && hasAffectedCampuses && (
          <div
            className="mb-8 md:mb-10 text-center animate-[fadeInUp_0.8s_ease-out_0.5s_both]"
          >
            <p className="text-sm md:text-base font-normal text-gray-400 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
              {labels.alertMessage}
            </p>
          </div>
        )}

        {/* Campus Card */}
        <div className="px-2 md:px-0">
          {filteredCampuses.map((campus, index) => (
            <div
              key={campus.id}
              style={{
                animation: `cardSlideIn 0.8s ease-out ${0.8 + (index * 0.3)}s both`
              }}
            >
              <CampusCard
                campus={campus}
                campusNames={campusNames}
                selectedCampus={selectedCampus}
                onCampusChange={setSelectedCampus}
                labels={labels}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCampuses.length === 0 && (
          <div className="text-center py-12 text-gray-500 px-2 md:px-0">
            No campuses match the selected filters.
          </div>
        )}

        {/* Last Updated */}
        <div
          className="mt-8 text-center text-sm text-gray-400 px-2 md:px-0"
          style={{ animation: 'fadeInUp 0.5s ease-out 1.5s both' }}
        >
          <p>
            {labels.autoRefreshMessage}
          </p>
          <p className="mt-1">
            {labels.lastUpdatedPrefix} {formatDateTime(lastUpdated)}
          </p>
        </div>
      </div>
    </div>
  );
}
