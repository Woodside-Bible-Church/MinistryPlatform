/**
 * Hook to fetch unified prayer widget data from a single endpoint
 * Replaces multiple API calls with one comprehensive call
 *
 * Works for both authenticated and unauthenticated users:
 * - With auth token: Returns all user data + public prayers
 * - Without auth token: Returns only public prayers
 */

import { useState, useEffect } from 'react';
import { getAuthToken } from '@/lib/mpWidgetAuthClient';
import { apiFetch } from '@/lib/apiClient';
import { UnifiedWidgetData } from '@/types/widgetData';

export function useWidgetData(refreshKey: number = 0) {
  const [data, setData] = useState<UnifiedWidgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        // Get token if available, but don't fail if missing
        const token = getAuthToken();

        // Build headers - include auth if token exists
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
          console.log('[useWidgetData] Fetching with authentication');
        } else {
          console.log('[useWidgetData] Fetching without authentication (public data only)');
        }

        const response = await apiFetch('/api/prayers/widget-data', { headers });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch widget data');
        }

        const widgetData = await response.json();
        console.log('[useWidgetData] Fetched unified data:', widgetData);
        setData(widgetData);
      } catch (err) {
        console.error('[useWidgetData] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load widget data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [refreshKey]);

  return { data, isLoading, error };
}
