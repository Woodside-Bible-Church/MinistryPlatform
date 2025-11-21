import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Debug endpoint to inspect session data
 * Helps diagnose authentication issues
 */
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  // Return all session data for debugging
  return NextResponse.json({
    user: {
      id: session.user?.id,
      email: session.email,
      name: session.user?.name,
      firstName: session.firstName,
      lastName: session.lastName,
    },
    contactId: session.contactId,
    sub: session.sub,
    roles: session.roles,
    roleCount: session.roles?.length || 0,
    simulation: session.simulation || null,
  }, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
