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
    console.log('[mpWidgetAuthClient] getAuthToken: window is undefined (SSR)');
    return null;
  }

  const token = localStorage.getItem(MP_WIDGET_TOKEN_KEY);
  console.log('[mpWidgetAuthClient] getAuthToken:', token ? `Found token (${token.substring(0, 20)}...)` : 'No token found');
  return token;
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
    console.error('[mpWidgetAuthClient] getAuthHeaders: No token found, throwing error');
    throw new Error('No authentication token found. Please log in with the Ministry Platform login widget.');
  }

  console.log('[mpWidgetAuthClient] getAuthHeaders: Creating headers with token');
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
