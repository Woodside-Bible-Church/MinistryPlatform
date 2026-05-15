import { NextResponse, NextRequest } from 'next/server';

/**
 * Maintenance-mode middleware.
 *
 * The Apps platform is being replaced by the Church Hub workspace.
 * Until that cutover lands, this app redirects all UI routes to a
 * single /maintenance page.
 *
 * What's still allowed through:
 *   - /api/*     — keeps webhook receivers and any external POST integrations alive
 *   - /maintenance — the page itself
 *   - /_next/*   — Next.js static asset routes
 *   - /assets/*, favicon, manifest — handled by the matcher exclusion below
 *
 * Auth / Neon-permissions / role-fetch logic was removed when this file
 * was put into maintenance mode. The full prior implementation lives in
 * git history if it ever needs to be restored.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Webhooks + service-to-service calls keep working.
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // The maintenance page itself must be reachable.
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  // Everything else gets sent to the maintenance page.
  return NextResponse.redirect(new URL('/maintenance', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|manifest.json|favicon.ico|assets/).*)'],
};
