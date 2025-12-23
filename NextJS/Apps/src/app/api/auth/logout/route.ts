import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Custom logout endpoint that:
 * 1. Clears NextAuth session cookies
 * 2. Clears any admin simulation cookies
 * 3. Redirects to signin page with logout message
 *
 * Note: This does NOT log out from MinistryPlatform OAuth.
 * The OAuth token will naturally expire. For shared/public devices,
 * users should close their browser to fully clear the MP session.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Clear NextAuth session cookies
  const cookieStore = await cookies();
  const sessionTokenName = process.env.NODE_ENV === 'production'
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  cookieStore.delete(sessionTokenName);

  // Also clear any CSRF token cookies
  cookieStore.delete('__Secure-next-auth.csrf-token');
  cookieStore.delete('next-auth.csrf-token');
  cookieStore.delete('__Host-next-auth.csrf-token');

  // Clear any admin simulation cookies
  cookieStore.delete('admin-simulation');
  cookieStore.delete('admin-app-simulation');

  console.log('Logout: Session cleared, redirecting to signin');

  // Redirect back to our signin page with logout parameter
  return NextResponse.redirect(`${appUrl}/signin?logout=true`);
}
