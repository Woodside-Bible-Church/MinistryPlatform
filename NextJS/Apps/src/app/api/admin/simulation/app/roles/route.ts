import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { appPermissions } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/admin/simulation/app/roles?applicationId=X
 * Returns: { roles: Array<{ roleName: string, canView: boolean, canEdit: boolean }> }
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.roles?.includes('Administrators')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
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

    // Fetch all roles for this application
    const roles = await db
      .select({
        roleName: appPermissions.roleName,
        canView: appPermissions.canView,
        canEdit: appPermissions.canEdit,
      })
      .from(appPermissions)
      .where(eq(appPermissions.applicationId, parseInt(applicationId)));

    // Remove duplicate role names and combine permissions
    const uniqueRoles = roles.reduce((acc, role) => {
      const existing = acc.find((r) => r.roleName === role.roleName);
      if (existing) {
        // Combine permissions (if any permission is true, keep it true)
        existing.canView = existing.canView || role.canView;
        existing.canEdit = existing.canEdit || role.canEdit;
      } else {
        acc.push({ ...role });
      }
      return acc;
    }, [] as Array<{ roleName: string; canView: boolean; canEdit: boolean }>);

    return NextResponse.json({ roles: uniqueRoles });
  } catch (error) {
    console.error('Error fetching app roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
