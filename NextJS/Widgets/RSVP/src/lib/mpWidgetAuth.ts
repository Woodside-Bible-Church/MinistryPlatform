/**
 * MinistryPlatform Widget Authentication
 * Validates auth tokens from MP's native login widget stored in localStorage
 */

import { headers } from 'next/headers';

export interface MPWidgetUser {
  contactId: number;
  imageUrl: string;
  profileUrl: string;
  householdId: number;
  householdPositionId: number;
  isHeadOfHousehold: boolean;
  isStaff: boolean;
  user: {
    subject: string;
    userId: number;
    displayName: string;
    firstName: string;
    lastName: string;
    middleName: string;
    nickname: string;
    email: string;
    timeZoneId: string;
    locale: string;
    roles: string[];
    extentedProperties: Record<string, string>;
  };
  donorId?: number;
  statementMethodId?: number;
}

export interface AuthResult {
  user: MPWidgetUser;
  token: string;
}

/**
 * Get the auth token from the Authorization header
 */
export async function getTokenFromRequest(): Promise<string | null> {
  const headersList = await headers();
  const authorization = headersList.get('authorization');

  if (!authorization) {
    return null;
  }

  // Support both "Bearer <token>" and plain token
  if (authorization.startsWith('Bearer ')) {
    return authorization.substring(7);
  }

  return authorization;
}

/**
 * Validate the MP widget auth token against MP's auth endpoint
 */
export async function validateMPWidgetToken(token: string): Promise<MPWidgetUser> {
  const authEndpoint = process.env.NEXT_PUBLIC_MP_WIDGETS_AUTH_ENDPOINT;

  if (!authEndpoint) {
    throw new Error('MP_WIDGETS_AUTH_ENDPOINT not configured');
  }

  try {
    const response = await fetch(authEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Try to get error response body for debugging
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error('MP Auth Error Response:', errorBody);
      } catch {
        console.error('Could not parse MP auth error response');
      }
      throw new Error(`Auth validation failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const userData = await response.json() as MPWidgetUser;

    return userData;
  } catch (error) {
    console.error('MP Widget auth validation error:', error);
    throw new Error('Invalid or expired authentication token');
  }
}

/**
 * Authenticate the current request using MP widget token
 * Returns both the user data and the token for making MP API calls
 */
export async function authenticateRequest(): Promise<AuthResult> {
  const token = await getTokenFromRequest();

  if (!token) {
    throw new Error('No authentication token provided');
  }

  const user = await validateMPWidgetToken(token);

  return { user, token };
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: MPWidgetUser, role: string): boolean {
  return user.user.roles.some(r => r.toLowerCase() === role.toLowerCase());
}

/**
 * Check if user is staff (convenience method)
 */
export function isStaff(user: MPWidgetUser): boolean {
  return user.isStaff || hasRole(user, 'Staff') || hasRole(user, 'WBC Staff Basic Rights');
}
