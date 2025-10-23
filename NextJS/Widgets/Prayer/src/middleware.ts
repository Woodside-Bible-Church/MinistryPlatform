/**
 * Middleware for Prayer Widget
 *
 * Note: This widget uses MP Widget authentication (localStorage token)
 * instead of NextAuth sessions, so we don't need server-side middleware
 * for authentication. The MPWidgetAuthWrapper component handles client-side
 * auth checks.
 *
 * This middleware just allows all requests to pass through.
 */

import { NextResponse } from 'next/server';

export async function middleware() {
  // Allow all requests - client-side auth is handled by MPWidgetAuthWrapper
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|manifest.json|favicon.ico|assets/).*)',
  ],
};
