/**
 * Client-side authentication utilities for MP Widget tokens
 * Reads the token from localStorage that is set by the MP Login Widget
 */

'use client';

const MP_WIDGET_TOKEN_KEY = 'mpp-widgets_AuthToken';
const MP_WIDGET_REFRESH_TOKEN_KEY = 'mpp-widgets_RefreshToken'; // Check if MP widget uses this

/**
 * Get the MP widget auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    console.log('[mpWidgetAuthClient] getAuthToken: window is undefined (SSR)');
    return null;
  }

  const token = localStorage.getItem(MP_WIDGET_TOKEN_KEY);

  // Handle case where localStorage has literal string "null" (logged out state)
  if (token === 'null' || token === null || token === '') {
    console.log('[mpWidgetAuthClient] getAuthToken: No valid token (value was:', token, ')');
    return null;
  }

  console.log('[mpWidgetAuthClient] getAuthToken: Found token (${token.substring(0, 20)}...)');
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
 * Get the refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;

  const refreshToken = localStorage.getItem(MP_WIDGET_REFRESH_TOKEN_KEY);

  // Handle case where localStorage has literal string "null"
  if (refreshToken === 'null' || refreshToken === null || refreshToken === '') {
    return null;
  }

  return refreshToken;
}

/**
 * Refresh the access token using the refresh token
 * NOTE: MP login widget doesn't store refresh tokens in localStorage
 * This function is kept for future use if MP changes this behavior
 * Returns the new access token or null if refresh failed
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.log('[mpWidgetAuthClient] No refresh token available - MP login widget does not expose refresh tokens');
    return null;
  }

  try {
    console.log('[mpWidgetAuthClient] Attempting to refresh access token...');

    // MP's OAuth token endpoint
    const tokenEndpoint = 'https://my.woodsidebible.org/ministryplatformapi/oauth/connect/token';

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'TM.Widgets',
        client_secret: 'MPQumeng3T5ahzQQ',
      }),
    });

    if (!response.ok) {
      console.error('[mpWidgetAuthClient] Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();

    // Update localStorage with new tokens (matching what MP login widget does)
    if (data.access_token) {
      localStorage.setItem(MP_WIDGET_TOKEN_KEY, data.access_token);
      console.log('[mpWidgetAuthClient] Access token refreshed successfully');
    }

    if (data.refresh_token) {
      localStorage.setItem(MP_WIDGET_REFRESH_TOKEN_KEY, data.refresh_token);
      console.log('[mpWidgetAuthClient] Refresh token updated');
    }

    return data.access_token || null;
  } catch (error) {
    console.error('[mpWidgetAuthClient] Error refreshing token:', error);
    return null;
  }
}

/**
 * Check if token is expired and needs re-authentication
 * Returns an object with status info
 */
export function getTokenStatus(): {
  hasToken: boolean;
  isValid: boolean;
  isExpired: boolean;
  needsReAuth: boolean;
} {
  const token = getAuthToken();

  if (!token) {
    return {
      hasToken: false,
      isValid: false,
      isExpired: false,
      needsReAuth: true,
    };
  }

  const expired = isTokenExpired(token);

  return {
    hasToken: true,
    isValid: !expired,
    isExpired: expired,
    needsReAuth: expired,
  };
}

/**
 * Save form state before page refresh (for token refresh scenario)
 */
export function saveFormState(formData: Record<string, unknown>, actionType?: string): void {
  if (typeof window === 'undefined') return;

  const state = {
    formData,
    actionType,
    timestamp: Date.now(),
  };

  sessionStorage.setItem('rsvp-widget-pending-state', JSON.stringify(state));
  console.log('[mpWidgetAuthClient] Form state saved for token refresh');
}

/**
 * Get saved form state after page refresh
 * Returns null if no saved state or if state is too old (> 5 minutes)
 */
export function getSavedFormState(): {
  formData: Record<string, unknown>;
  actionType?: string;
} | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = sessionStorage.getItem('rsvp-widget-pending-state');
    if (!saved) return null;

    const state = JSON.parse(saved);

    // Check if state is too old (5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - state.timestamp > fiveMinutes) {
      console.log('[mpWidgetAuthClient] Saved state expired, clearing...');
      clearSavedFormState();
      return null;
    }

    return {
      formData: state.formData,
      actionType: state.actionType,
    };
  } catch (error) {
    console.error('[mpWidgetAuthClient] Error reading saved form state:', error);
    return null;
  }
}

/**
 * Clear saved form state
 */
export function clearSavedFormState(): void {
  if (typeof window === 'undefined') return;

  sessionStorage.removeItem('rsvp-widget-pending-state');
  console.log('[mpWidgetAuthClient] Saved form state cleared');
}

/**
 * Refresh page to trigger MP login widget token refresh
 * Optionally save current scroll position and widget location
 */
export function refreshPageForTokenUpdate(saveScrollPosition = true): void {
  if (typeof window === 'undefined') return;

  if (saveScrollPosition) {
    // Save scroll position to restore after refresh
    const scrollY = window.scrollY || window.pageYOffset;
    sessionStorage.setItem('rsvp-widget-scroll-position', scrollY.toString());
  }

  console.log('[mpWidgetAuthClient] Refreshing page for token update...');
  window.location.reload();
}

/**
 * Restore scroll position after page refresh
 */
export function restoreScrollPosition(): void {
  if (typeof window === 'undefined') return;

  try {
    const saved = sessionStorage.getItem('rsvp-widget-scroll-position');
    if (saved) {
      const scrollY = parseInt(saved, 10);
      window.scrollTo(0, scrollY);
      sessionStorage.removeItem('rsvp-widget-scroll-position');
      console.log('[mpWidgetAuthClient] Scroll position restored:', scrollY);
    }
  } catch (error) {
    console.error('[mpWidgetAuthClient] Error restoring scroll position:', error);
  }
}

/**
 * Clear the authentication token (logout)
 * Note: This only clears the local token, doesn't log out from MP
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(MP_WIDGET_TOKEN_KEY);
  localStorage.removeItem(MP_WIDGET_REFRESH_TOKEN_KEY);
  console.log('[mpWidgetAuthClient] Auth tokens cleared');
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

  // Check if token is valid before making the request
  if (!token || isTokenExpired(token)) {
    console.log('[mpWidgetAuthClient] Token is missing or expired');
    return null;
  }

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
