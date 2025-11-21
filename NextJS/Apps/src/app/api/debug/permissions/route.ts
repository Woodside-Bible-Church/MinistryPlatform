import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { applications, appPermissions } from '@/db/schema';
import { eq, inArray, or, and } from 'drizzle-orm';

/**
 * Debug endpoint to check user permissions for all apps
 * Helps diagnose why users can't access certain apps
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  const userEmail = session.email || '';
  const userRoles = session.roles || [];

  // Get all applications
  const allApps = await db.query.applications.findMany({
    where: eq(applications.isActive, true),
  });

  // Check permissions for each app
  const appAccessResults = await Promise.all(
    allApps.map(async (app) => {
      // Check if user is admin
      const isAdmin = userRoles.includes('Administrators');

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

      const matchingRoles = userPermissions
        .filter(p => p.roleName)
        .map(p => p.roleName);

      const hasAccess = isAdmin || (userPermissions.length > 0 && userPermissions.some(p => p.canView));

      return {
        app: {
          id: app.id,
          name: app.name,
          route: app.route,
          requiresAuth: app.requiresAuth,
        },
        hasAccess,
        isAdmin,
        matchingPermissions: userPermissions.length,
        matchingRoles,
      };
    })
  );

  // Get all permissions configured in the database
  const allPermissions = await db.query.appPermissions.findMany();
  const allConfiguredRoles = [...new Set(allPermissions.map(p => p.roleName).filter(Boolean))];

  return NextResponse.json({
    user: {
      email: userEmail,
      roles: userRoles,
      roleCount: userRoles.length,
    },
    appAccess: appAccessResults,
    allConfiguredRolesInNeon: allConfiguredRoles,
    userRolesNotInNeon: userRoles.filter(role => !allConfiguredRoles.includes(role)),
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
