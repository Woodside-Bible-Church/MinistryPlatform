/**
 * MinistryPlatform Login Utilities
 * Handles checking login status and redirecting to MP SSO when needed
 */

const MP_HOST = process.env.NEXT_PUBLIC_MP_HOST || 'my.woodsidebible.org';

/**
 * Check if user is currently logged in
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;

  const authToken = localStorage.getItem('mpp-widgets_AuthToken');
  return authToken !== null && authToken !== '' && authToken !== 'null';
}

/**
 * Generate a random nonce for OAuth processing
 */
function generateNonce(length = 16): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create the state URL for redirecting after SSO authentication
 */
function createStateUrl(): string {
  const currentUrl = window.location.href;

  // Add mpCustomWidgetAuth query param to force custom widgets to wait for auth after SSO
  const separator = currentUrl.includes('?') ? '&' : '?';
  const stateUrl = `${currentUrl}${separator}mpCustomWidgetAuth=true`;

  return encodeURIComponent(stateUrl);
}

/**
 * Redirect to MinistryPlatform SSO login
 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined') return;

  const ssoUrl = `https://${MP_HOST}/ministryplatformapi/oauth/connect/authorize?response_type=code&scope=openid%20http://www.thinkministry.com/dataplatform/scopes/all&client_id=TM.Widgets&redirect_uri=https://${MP_HOST}/widgets/signin-oidc&nonce=${generateNonce()}&state=${createStateUrl()}`;

  console.log('Redirecting to login:', ssoUrl);

  // If we're in an iframe, ask parent to redirect instead
  if (window.self !== window.top) {
    window.parent.postMessage({
      type: 'LOGIN_REQUIRED',
      url: ssoUrl
    }, '*');
  } else {
    window.location.href = ssoUrl;
  }
}

/**
 * Require login - checks if logged in, if not, redirects to login
 * Returns true if logged in, false if redirecting
 */
export function requireLogin(): boolean {
  if (isLoggedIn()) {
    return true;
  }

  redirectToLogin();
  return false;
}

/**
 * Get the current user's auth token (if logged in)
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mpp-widgets_AuthToken');
}
