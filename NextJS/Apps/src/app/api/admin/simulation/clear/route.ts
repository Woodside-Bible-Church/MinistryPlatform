import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const session = await auth();

    // Check if user is an administrator OR is currently in simulation mode
    // When simulating, session.simulation will exist even though roles may be overridden
    const isAdmin = session?.roles?.includes('Administrators');
    const isSimulating = session?.simulation != null;

    if (!session?.user?.email || (!isAdmin && !isSimulating)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Clear the simulation cookie
    const cookieStore = await cookies();
    cookieStore.delete('admin-simulation');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing simulation:', error);
    return NextResponse.json({ error: 'Failed to clear simulation' }, { status: 500 });
  }
}
