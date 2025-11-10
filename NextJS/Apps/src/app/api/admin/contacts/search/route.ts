import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { MPHelper } from '@/providers/MinistryPlatform/mpHelper';

export async function GET(request: Request) {
  try {
    const session = await auth();

    // Check if user is an administrator
    if (!session?.user?.email || !session.roles?.includes('Administrators')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
    }

    const mp = new MPHelper();

    // Search contacts by name or email (only those with User_Account)
    const contacts = await mp.getTableRecords({
      table: 'Contacts',
      select: 'Contact_ID, Display_Name, Email_Address, User_Account, dp_fileUniqueId as Image_GUID',
      filter: `(Display_Name LIKE '%${query}%' OR Email_Address LIKE '%${query}%') AND User_Account IS NOT NULL`,
      orderBy: 'Display_Name',
      top: 20,
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json({ error: 'Failed to search contacts' }, { status: 500 });
  }
}
