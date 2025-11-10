import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { appSimulations } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Disable permission simulation for a specific application
 * POST /api/admin/simulation/app/disable
 * Body: { applicationId: number }
 */
export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const session = await auth();
    if (!session?.user?.email || !session.roles?.includes('Administrators')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId is required' },
        { status: 400 }
      );
    }

    // Find and disable simulation for this user/app
    const existing = await db.query.appSimulations.findFirst({
      where: and(
        eq(appSimulations.userEmail, session.user.email),
        eq(appSimulations.applicationId, applicationId)
      ),
    });

    if (existing) {
      await db
        .update(appSimulations)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(appSimulations.id, existing.id));
    }

    return NextResponse.json({
      success: true,
      message: 'Permission simulation disabled',
    });
  } catch (error) {
    console.error('Error disabling app simulation:', error);
    return NextResponse.json(
      { error: 'Failed to disable simulation' },
      { status: 500 }
    );
  }
}
