/**
 * Client-side authentication utilities for MP Widget tokens
 * Reads the token from localStorage that is set by the MP Login Widget
 */

'use client';

const MP_WIDGET_TOKEN_KEY = 'mpp-widgets_AuthToken';

/**
 * Get the MP widget auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(MP_WIDGET_TOKEN_KEY);
}

/**
 * Check if user is authenticated (has a token)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Create fetch headers with authentication
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();

  if (!token) {
    throw new Error('No authentication token found');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Authenticated fetch wrapper
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = getAuthHeaders();

  // Use apiFetch to automatically add base URL for widget mode
  const { apiFetch } = await import('./apiClient');

  return apiFetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
}
