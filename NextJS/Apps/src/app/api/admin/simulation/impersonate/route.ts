import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const session = await auth();

    // Check if user is an administrator
    if (!session?.user?.email || !session.roles?.includes('Administrators')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    // Store impersonation in a cookie
    const cookieStore = await cookies();
    cookieStore.set('admin-simulation', JSON.stringify({
      type: 'impersonate',
      contactId,
      adminUserId: session.user.id,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 4, // 4 hours
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json({ error: 'Failed to start impersonation' }, { status: 500 });
  }
}
