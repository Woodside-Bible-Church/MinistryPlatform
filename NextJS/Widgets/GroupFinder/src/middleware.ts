/**
 * Middleware for GroupFinder Widget
 *
 * This widget uses MP Widget authentication (localStorage token)
 * instead of NextAuth sessions, so we don't need server-side middleware
 * for authentication. All requests pass through.
 */

import { NextResponse } from 'next/server';

export async function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|manifest.json|favicon.ico|assets/).*)',
  ],
};
