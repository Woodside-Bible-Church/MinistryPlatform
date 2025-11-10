import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { MPHelper } from '@/providers/MinistryPlatform/mpHelper';

export async function GET() {
  try {
    const session = await auth();

    // Check if user is an administrator OR is currently in simulation mode
    // When simulating, session.simulation will exist even though roles may be overridden
    const isAdmin = session?.roles?.includes('Administrators');
    const isSimulating = session?.simulation != null;

    if (!session?.user?.email || (!isAdmin && !isSimulating)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const cookieStore = await cookies();
    const simulationCookie = cookieStore.get('admin-simulation');

    if (!simulationCookie) {
      return NextResponse.json({ active: false });
    }

    const simulation = JSON.parse(simulationCookie.value);

    // If impersonating, fetch the user details
    if (simulation.type === 'impersonate') {
      const mp = new MPHelper();
      const contact = await mp.getTableRecords({
        table: 'Contacts',
        select: 'Contact_ID, Display_Name, Email_Address, Nickname, First_Name, Last_Name, dp_fileUniqueId as Image_GUID',
        filter: `Contact_ID=${simulation.contactId}`,
      });

      if (contact.length > 0) {
        return NextResponse.json({
          active: true,
          type: 'impersonate',
          user: contact[0],
        });
      }
    }

    // If simulating roles
    if (simulation.type === 'roles') {
      return NextResponse.json({
        active: true,
        type: 'roles',
        roles: simulation.roles,
      });
    }

    return NextResponse.json({ active: false });
  } catch (error) {
    console.error('Error getting simulation status:', error);
    return NextResponse.json({ error: 'Failed to get simulation status' }, { status: 500 });
  }
}
