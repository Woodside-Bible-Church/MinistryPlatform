import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { appPermissions } from '@/db/schema';
import { eq, or, and, inArray } from 'drizzle-orm';
import { cookies } from 'next/headers';

/**
 * GET /api/permissions?applicationId=X
 * Returns: { canView: boolean, canEdit: boolean }
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId parameter required' },
        { status: 400 }
      );
    }

    const userEmail = session.user.email;
    let userRoles = session.roles || [];

    // Check for app-specific permission simulation (same logic as middleware)
    const isAdmin = userRoles.includes('Administrators');
    if (isAdmin) {
      const cookieStore = await cookies();
      const simulationCookie = cookieStore.get('admin-app-simulation');
      if (simulationCookie) {
        try {
          const simulation = JSON.parse(simulationCookie.value);
          // If simulation is active for this app, replace admin role with simulated roles
          if (simulation.applicationId === parseInt(applicationId) && simulation.roles && Array.isArray(simulation.roles)) {
            userRoles = simulation.roles;
            console.log(`Permissions API: App simulation active for applicationId ${applicationId}`);
            console.log(`Permissions API: Simulating roles:`, userRoles);
          }
        } catch (error) {
          console.error('Permissions API: Error parsing app simulation cookie:', error);
        }
      }
    }

    // Admins have all permissions (unless simulation is active, in which case userRoles was replaced above)
    if (userRoles.includes('Administrators')) {
      return NextResponse.json({
        canView: true,
        canEdit: true,
      });
    }

    // Check permissions for user's roles
    const permissions = await db
      .select({
        canView: appPermissions.canView,
        canEdit: appPermissions.canEdit,
      })
      .from(appPermissions)
      .where(
        and(
          eq(appPermissions.applicationId, parseInt(applicationId)),
          or(
            inArray(appPermissions.roleName, userRoles),
            eq(appPermissions.userEmail, userEmail)
          )
        )
      );

    // Aggregate permissions (if ANY permission grants it, user has it)
    const canView = permissions.some((p) => p.canView);
    const canEdit = permissions.some((p) => p.canEdit);

    return NextResponse.json({ canView, canEdit });
  } catch (error) {
    console.error('Error checking permissions:', error);
    return NextResponse.json(
      { error: 'Failed to check permissions' },
      { status: 500 }
    );
  }
}
