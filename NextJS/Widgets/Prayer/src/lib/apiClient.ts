/**
 * API Client for Widget
 * Handles API calls with automatic base URL resolution
 * When embedded as a widget, all API calls go to the Vercel backend
 */

'use client';

/**
 * Get the API base URL
 * In production widget mode, use the configured base URL
 * In Next.js mode, use relative URLs
 */
function getApiBaseUrl(): string {
  // Check if we're running as an embedded widget (not in Next.js)
  if (typeof window !== 'undefined' && (window as any).PRAYER_WIDGET_CONFIG) {
    return (window as any).PRAYER_WIDGET_CONFIG.apiBaseUrl || 'https://prayer-gamma.vercel.app';
  }

  // For Next.js app, use relative URLs
  return '';
}

/**
 * Build full API URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If we have a base URL, combine them
  if (baseUrl) {
    return `${baseUrl}${normalizedPath}`;
  }

  // Otherwise return the path as-is (for Next.js)
  return normalizedPath;
}

/**
 * Enhanced fetch that automatically adds base URL for widget mode
 */
export function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const fullUrl = buildApiUrl(url);
  return fetch(fullUrl, options);
}
