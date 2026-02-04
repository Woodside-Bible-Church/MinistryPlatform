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
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(MP_WIDGET_TOKEN_KEY);

  if (token === 'null' || token === null || token === '') {
    return null;
  }

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
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now;
}

/**
 * Check if user is authenticated (has a valid token)
 */
export function isAuthenticated(): boolean {
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
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
