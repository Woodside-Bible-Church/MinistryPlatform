import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Cache for public app routes to avoid repeated API calls
const publicAppRoutesCache: { routes: Set<string>; timestamp: number } = {
  routes: new Set(),
  timestamp: 0,
};
const CACHE_TTL = 60000; // 1 minute cache

// Cache for service account token (client credentials flow)
const serviceTokenCache: { token: string | null; timestamp: number } = {
  token: null,
  timestamp: 0,
};
const TOKEN_TTL = 3300000; // 55 minutes (tokens usually last 1 hour, refresh before expiry)

async function getServiceToken(): Promise<string | null> {
  // Return cached token if still valid
  if (serviceTokenCache.token && Date.now() - serviceTokenCache.timestamp < TOKEN_TTL) {
    console.log('Middleware: Using cached service token');
    return serviceTokenCache.token;
  }

  const clientId = process.env.MINISTRY_PLATFORM_CLIENT_ID;
  const clientSecret = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;
  const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

  if (!clientId || !clientSecret || !baseUrl) {
    console.log('Middleware: Missing client credentials for service token');
    return null;
  }

  try {
    // Use OAuth client credentials grant to get a service token
    const tokenUrl = baseUrl.replace('/ministryplatformapi', '/ministryplatform/oauth/connect/token');
    console.log('Middleware: Requesting service token from', tokenUrl);
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
      }),
    });

    if (!response.ok) {
      console.log('Middleware: Service token request failed with status', response.status);
      return null;
    }

    const data = await response.json();
    serviceTokenCache.token = data.access_token;
    serviceTokenCache.timestamp = Date.now();

    console.log('Middleware: Service token obtained successfully');
    return data.access_token;
  } catch (error) {
    console.error('Middleware: Error getting service token:', error);
    return null;
  }
}

async function getPublicAppRoutes(): Promise<Set<string>> {
  // Return cached routes if still valid
  if (Date.now() - publicAppRoutesCache.timestamp < CACHE_TTL) {
    console.log('Middleware: Using cached public routes:', Array.from(publicAppRoutesCache.routes));
    return publicAppRoutesCache.routes;
  }

  console.log('Middleware: Fetching public routes from database...');

  try {
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    if (!baseUrl) {
      console.log('Middleware: No base URL configured');
      return new Set();
    }

    // Get service token using client credentials flow
    const serviceToken = await getServiceToken();
    if (!serviceToken) {
      // If we can't get a token, return empty set
      // This allows the app to work without public access feature enabled
      console.log('Middleware: Could not get service token, no public routes will be available');
      return new Set();
    }

    // Fetch public applications directly from MinistryPlatform
    // This runs server-side so we use client credentials for service account access
    const response = await fetch(
      `${baseUrl}/tables/Applications?$select=Route&$filter=Is_Active=true AND Requires_Authentication=false`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceToken}`,
        },
      }
    );

    if (!response.ok) {
      // If query fails (e.g., columns don't exist), return empty set
      console.log('Middleware: Applications table query failed with status', response.status);
      return new Set();
    }

    const apps = await response.json();
    const routes = new Set(apps.map((app: { Route: string }) => app.Route));

    console.log('Middleware: Found public routes:', Array.from(routes));

    // Update cache
    publicAppRoutesCache.routes = routes;
    publicAppRoutesCache.timestamp = Date.now();

    return routes;
  } catch (error) {
    // Silently return empty set on error
    console.error('Middleware: Error fetching public routes:', error);
    return new Set();
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // console.log(`Middleware: Processing ${pathname}`);

  // Early returns for public paths
  if (pathname.startsWith('/api') || pathname === '/signin' || pathname === '/') {
    console.log(`Middleware: Allowing public path ${pathname}`);
    return NextResponse.next();
  }

  // Hardcoded public routes (simpler than database lookup)
  const hardcodedPublicRoutes = ['/prayer'];
  if (hardcodedPublicRoutes.includes(pathname)) {
    console.log(`Middleware: Allowing public app ${pathname}`);
    return NextResponse.next();
  }

  // Check if this route is for a public app (from database)
  // Disabled for now due to OAuth client credentials configuration requirements
  // const publicRoutes = await getPublicAppRoutes();
  // if (publicRoutes.has(pathname)) {
  //   console.log(`Middleware: Allowing public app ${pathname}`);
  //   return NextResponse.next();
  // }

  try {
    // Use getToken with more explicit configuration
    let token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: '__Secure-next-auth.session-token'
    });

    // If secure cookie doesn't work, try the regular one
    if (!token) {
      token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token'
      });
    }

    // console.log('Middleware: Token exists:', !!token);
    // console.log('Middleware: Available cookies:', request.cookies.getAll().map(c => c.name));

    // console.log('Middleware: Token exp:', token?.exp);

    if (!token) {
      console.log("Middleware: Redirecting to home - no token");
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Don't check token expiration here - let NextAuth's JWT callback handle token refresh
    // If the token is expired, the JWT callback will attempt to refresh it automatically
    // Only redirect if there's truly no valid session (handled by NextAuth)

    console.log(`Middleware: Allowing request to ${pathname}`);
    return NextResponse.next();

  } catch (error) {
    console.error('Middleware: Error getting token:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|manifest.json|favicon.ico|assets/).*)',
  ],
};