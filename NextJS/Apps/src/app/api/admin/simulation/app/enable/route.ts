import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { appSimulations, applications } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Enable permission simulation for a specific application
 * POST /api/admin/simulation/app/enable
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

    // Verify application exists
    const app = await db.query.applications.findFirst({
      where: eq(applications.id, applicationId),
    });

    if (!app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if simulation already exists for this user/app
    const existing = await db.query.appSimulations.findFirst({
      where: and(
        eq(appSimulations.userEmail, session.user.email),
        eq(appSimulations.applicationId, applicationId)
      ),
    });

    if (existing) {
      // Update existing simulation to active
      await db
        .update(appSimulations)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(appSimulations.id, existing.id));
    } else {
      // Create new simulation
      await db.insert(appSimulations).values({
        applicationId,
        userEmail: session.user.email,
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Permission simulation enabled for ${app.name}`,
    });
  } catch (error) {
    console.error('Error enabling app simulation:', error);
    return NextResponse.json(
      { error: 'Failed to enable simulation' },
      { status: 500 }
    );
  }
}
