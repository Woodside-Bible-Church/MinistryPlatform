import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { appSimulations } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Get simulation status for a specific application
 * GET /api/admin/simulation/app/status?applicationId=1
 */
export async function GET(request: Request) {
  try {
    // Check if user is authenticated and is an admin
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
        { error: 'applicationId query parameter is required' },
        { status: 400 }
      );
    }

    // Find simulation for this user/app
    const simulation = await db.query.appSimulations.findFirst({
      where: and(
        eq(appSimulations.userEmail, session.user.email),
        eq(appSimulations.applicationId, parseInt(applicationId)),
        eq(appSimulations.isActive, true)
      ),
    });

    return NextResponse.json({
      active: !!simulation,
      simulation: simulation || null,
    });
  } catch (error) {
    console.error('Error getting app simulation status:', error);
    return NextResponse.json(
      { error: 'Failed to get simulation status' },
      { status: 500 }
    );
  }
}
