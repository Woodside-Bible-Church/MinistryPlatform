import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db } from '@/db';
import { applications, appPermissions } from '@/db/schema';
import { eq, inArray, or, and } from 'drizzle-orm';

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

async function checkUserHasAccessToRoute(
  pathname: string,
  userEmail: string,
  userRoles: string[]
): Promise<boolean> {
  try {
    // Find the application with this route
    const app = await db.query.applications.findFirst({
      where: eq(applications.route, pathname),
    });

    // If no app found for this route, allow access (might be a dynamic route or other page)
    if (!app) {
      console.log(`Middleware: No app found for route ${pathname}, allowing access`);
      return true;
    }

    // Check if app requires authentication
    if (!app.requiresAuth) {
      console.log(`Middleware: App ${app.name} does not require auth`);
      return true;
    }

    // Check if app is active
    if (!app.isActive) {
      console.log(`Middleware: App ${app.name} is not active`);
      return false;
    }

    // If user has no roles, deny access
    if (!userRoles || userRoles.length === 0) {
      console.log(`Middleware: User has no roles, denying access to ${app.name}`);
      return false;
    }

    // Check if user is an administrator (admins have access to everything)
    if (userRoles.includes('Administrators')) {
      console.log(`Middleware: User is admin, allowing access to ${app.name}`);
      return true;
    }

    // Find permissions that match the user's roles or email
    const userPermissions = await db.query.appPermissions.findMany({
      where: and(
        eq(appPermissions.applicationId, app.id),
        or(
          inArray(appPermissions.roleName, userRoles),
          eq(appPermissions.userEmail, userEmail)
        )
      ),
    });

    const hasAccess = userPermissions.length > 0 && userPermissions.some(p => p.canView);

    if (hasAccess) {
      console.log(`Middleware: User has permission to access ${app.name}`);
    } else {
      console.log(`Middleware: User does NOT have permission to access ${app.name}`);
    }

    return hasAccess;
  } catch (error) {
    console.error('Middleware: Error checking user access:', error);
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const apps = await response.json() as Array<{ Route: string }>;
    const routes = new Set(apps.map((app) => app.Route));

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
  if (pathname.startsWith('/api') || pathname === '/signin' || pathname === '/' || pathname === '/403') {
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

    // Check if user has permission to access this route
    const userEmail = token.email as string;
    let userRoles = (token.roles as string[]) || [];

    // Check for admin simulation/impersonation
    const isAdmin = userRoles.includes('Administrators');
    if (isAdmin) {
      const simulationCookie = request.cookies.get('admin-simulation');
      if (simulationCookie) {
        try {
          const simulation = JSON.parse(simulationCookie.value);

          if (simulation.type === 'impersonate' && simulation.contactId) {
            // For impersonation, fetch the actual user's roles (both User Groups and Security Roles)
            try {
              const { MPHelper } = await import('@/providers/MinistryPlatform/mpHelper');
              const mp = new MPHelper();

              // Get the user's User_ID from their Contact_ID
              const users = await mp.getTableRecords<{ User_ID: number }>({
                table: 'dp_Users',
                select: 'User_ID',
                filter: `Contact_ID=${simulation.contactId}`,
                top: 1,
              });

              if (users.length > 0) {
                const userId = users[0].User_ID;
                userRoles = [];

                // Fetch User Groups
                const userGroupLinks = await mp.getTableRecords<{ User_Group_ID: number }>({
                  table: 'dp_User_User_Groups',
                  select: 'User_Group_ID',
                  filter: `User_ID=${userId}`,
                });

                const groupIds = userGroupLinks.map(g => g.User_Group_ID).filter(Boolean);

                if (groupIds.length > 0) {
                  // Use IN() clause for cleaner query
                  const groupIdList = groupIds.join(',');
                  const userGroups = await mp.getTableRecords<{ User_Group_Name: string }>({
                    table: 'dp_User_Groups',
                    select: 'User_Group_Name',
                    filter: `User_Group_ID IN (${groupIdList})`,
                  });

                  userRoles.push(...userGroups.map(g => g.User_Group_Name).filter(Boolean));
                }

                // Fetch Security Roles
                // Note: Security Roles come from OAuth, but we fetch them here for impersonation
                // If the API user doesn't have access to these tables, we skip this step
                try {
                  const securityRoleLinks = await mp.getTableRecords<{ Role_ID: number }>({
                    table: 'dp_User_Security_Roles',
                    select: 'Role_ID',
                    filter: `User_ID=${userId}`,
                  });

                  const roleIds = securityRoleLinks.map(r => r.Role_ID).filter(Boolean);

                  if (roleIds.length > 0) {
                    // Use IN() clause for cleaner query
                    const roleIdList = roleIds.join(',');
                    const securityRoles = await mp.getTableRecords<{ Role_Name: string }>({
                      table: 'dp_Security_Roles',
                      select: 'Role_Name',
                      filter: `Role_ID IN (${roleIdList})`,
                    });

                    userRoles.push(...securityRoles.map(r => r.Role_Name).filter(Boolean));
                  }
                } catch (securityRoleError) {
                  console.log('Middleware: Could not fetch Security Roles (API user may not have access). Security Roles are included from OAuth token.');
                }

                console.log(`Middleware: Impersonation active - using roles (User Groups + Security Roles):`, userRoles);
              } else {
                // User has no MP account, so no roles
                userRoles = [];
                console.log(`Middleware: Impersonation active - user has no MP account, no roles`);
              }
            } catch (error) {
              console.error('Middleware: Error fetching impersonated user roles:', error);
              // On error, clear roles for safety
              userRoles = [];
            }
          } else if (simulation.type === 'roles' && Array.isArray(simulation.roles)) {
            // Override with simulated roles
            userRoles = simulation.roles;
            console.log(`Middleware: Role simulation active - using roles:`, userRoles);
          }
        } catch (error) {
          console.error('Middleware: Error parsing simulation cookie:', error);
        }
      }
    }

    const hasAccess = await checkUserHasAccessToRoute(pathname, userEmail, userRoles);

    if (!hasAccess) {
      console.log(`Middleware: User does not have access to ${pathname}, showing 403 page`);
      const url = new URL('/403', request.url);
      url.searchParams.set('path', pathname);
      return NextResponse.redirect(url);
    }

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