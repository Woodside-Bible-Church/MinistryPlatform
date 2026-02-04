/**
 * API Client for GroupFinder Widget
 * Handles API calls with automatic base URL resolution
 * When embedded as a widget, all API calls go to the Vercel backend
 */

'use client';

interface GroupFinderWidgetConfig {
  apiBaseUrl?: string;
  containerId?: string;
}

declare global {
  interface Window {
    GROUP_FINDER_WIDGET_CONFIG?: GroupFinderWidgetConfig;
  }
}

/**
 * Get the API base URL
 * In production widget mode, use the configured base URL
 * In Next.js mode, use relative URLs
 */
function getApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.GROUP_FINDER_WIDGET_CONFIG) {
    return window.GROUP_FINDER_WIDGET_CONFIG.apiBaseUrl || 'https://group-finder.vercel.app';
  }
  return '';
}

/**
 * Build full API URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }
  return normalizedPath;
}

/**
 * Enhanced fetch that automatically adds base URL for widget mode
 */
export function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const fullUrl = buildApiUrl(url);
  return fetch(fullUrl, options);
}
