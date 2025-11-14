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
 * Decode JWT without verification (for checking expiration)
 */
function decodeJwt(token: string): { exp?: number; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('[mpWidgetAuthClient] Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;

  // exp is in seconds, Date.now() is in milliseconds
  const now = Math.floor(Date.now() / 1000);
  const expired = decoded.exp < now;

  console.log('[mpWidgetAuthClient] Token expiration check:', {
    exp: decoded.exp,
    now,
    expired,
    timeRemaining: expired ? 0 : decoded.exp - now
  });

  return expired;
}

/**
 * Check if user is authenticated (has a token)
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Check if user is authenticated and token is not expired
 */
export function isAuthenticatedAndValid(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired(token);
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

/**
 * Get current user data from MP auth endpoint
 */
export async function getCurrentUser(): Promise<{
  contactId: number;
  imageUrl?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
} | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const authEndpoint = process.env.NEXT_PUBLIC_MP_WIDGETS_AUTH_ENDPOINT;
    if (!authEndpoint) return null;

    const response = await fetch(authEndpoint, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;

    const userData = await response.json();
    return {
      contactId: userData.contactId,
      imageUrl: userData.imageUrl,
      firstName: userData.user?.firstName,
      lastName: userData.user?.lastName,
      displayName: userData.user?.displayName,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
