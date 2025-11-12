// ===================================================================
// API Route: GET /api/household
// ===================================================================
// Fetches household members for the authenticated user
// Returns the logged-in user plus their household members
// ===================================================================

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';

interface HouseholdMember {
  Contact_ID: number;
  Display_Name: string;
  Nickname: string | null;
  First_Name: string;
  Last_Name: string;
  Email_Address: string | null;
  Mobile_Phone: string | null;
  Household_ID: number;
  Household_Position_ID: number;
  Image_GUID: string | null;
  Web_Congregation_ID: number | null;
}

export async function GET() {
  try {
    // Get the authenticated session
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Contact_ID from session (stored as user.id as string)
    console.log('[Household API] session.user.id:', session.user.id);
    console.log('[Household API] Full session.user:', JSON.stringify(session.user, null, 2));

    const contactId = parseInt(session.user.id, 10);

    if (isNaN(contactId)) {
      console.error('[Household API] Failed to parse Contact ID:', session.user.id);
      return NextResponse.json(
        { error: 'Invalid Contact ID in session', sessionUserId: session.user.id },
        { status: 400 }
      );
    }

    console.log('[Household API] Parsed contactId:', contactId);

    // Get MP provider singleton instance
    const mp = ministryPlatformProvider.getInstance();

    // First, get the current user's household ID
    const currentUser = await mp.getTableRecords<HouseholdMember>('Contacts', {
      $filter: `Contact_ID = ${contactId}`,
      $select: 'Contact_ID,Display_Name,Nickname,First_Name,Last_Name,Email_Address,Mobile_Phone,Household_ID,Household_Position_ID,dp_fileUniqueId AS Image_GUID,Web_Congregation_ID',
    });

    if (!currentUser || currentUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = currentUser[0];
    const householdId = user.Household_ID;

    // If no household, just return the user
    if (!householdId) {
      return NextResponse.json({
        user,
        householdMembers: [],
      });
    }

    // Get all household members (excluding the current user)
    const householdMembers = await mp.getTableRecords<HouseholdMember>('Contacts', {
      $filter: `Household_ID = ${householdId} AND Contact_ID != ${contactId}`,
      $select: 'Contact_ID,Display_Name,Nickname,First_Name,Last_Name,Email_Address,Mobile_Phone,Household_ID,Household_Position_ID,dp_fileUniqueId AS Image_GUID',
      $orderby: 'Household_Position_ID,First_Name',
    });

    return NextResponse.json({
      user,
      householdMembers: householdMembers || [],
    });
  } catch (error) {
    console.error('Error fetching household members:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch household members',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
