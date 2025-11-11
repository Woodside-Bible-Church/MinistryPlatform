import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

/**
 * Enable/disable permission simulation for a specific application
 * POST /api/admin/simulation/app
 * Body: { applicationId: number, roles: string[] } - enable simulation for app with selected roles
 * Body: { applicationId: null } - disable simulation
 *
 * GET /api/admin/simulation/app
 * Returns: { active: boolean, applicationId: number | null, roles: string[] | null }
 */

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.roles?.includes('Administrators')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    const simulationCookie = cookieStore.get('admin-app-simulation');

    if (simulationCookie) {
      try {
        const data = JSON.parse(simulationCookie.value);
        return NextResponse.json({
          active: true,
          applicationId: data.applicationId,
          roles: data.roles || [],
        });
      } catch {
        return NextResponse.json({
          active: false,
          applicationId: null,
          roles: null,
        });
      }
    }

    return NextResponse.json({
      active: false,
      applicationId: null,
      roles: null,
    });
  } catch (error) {
    console.error('Error getting app simulation status:', error);
    return NextResponse.json(
      { error: 'Failed to get simulation status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.roles?.includes('Administrators')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { applicationId, roles } = await request.json();
    const cookieStore = await cookies();

    if (applicationId === null || applicationId === undefined) {
      // Disable simulation
      cookieStore.delete('admin-app-simulation');
      return NextResponse.json({
        success: true,
        message: 'Permission simulation disabled',
      });
    }

    // Validate that roles array is provided
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: 'At least one role must be selected' },
        { status: 400 }
      );
    }

    // Enable simulation for this app with selected roles
    cookieStore.set('admin-app-simulation', JSON.stringify({ applicationId, roles }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Permission simulation enabled',
    });
  } catch (error) {
    console.error('Error toggling app simulation:', error);
    return NextResponse.json(
      { error: 'Failed to toggle simulation' },
      { status: 500 }
    );
  }
}
