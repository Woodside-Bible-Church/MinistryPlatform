// ===================================================================
// API Route: GET /api/household
// ===================================================================
// Fetches household members for the authenticated user
// Returns the logged-in user plus their household members
// ===================================================================

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';
import { getTokenFromRequest, validateMPWidgetToken } from '@/lib/mpWidgetAuth';

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
    let contactId: number;

    // Try MP widget authentication first (for embedded widget mode)
    const mpToken = await getTokenFromRequest();

    if (mpToken) {
      console.log('[Household API] MP widget token found, validating...');
      try {
        const mpUser = await validateMPWidgetToken(mpToken);
        contactId = mpUser.contactId;
        console.log('[Household API] MP auth successful, contactId:', contactId);
      } catch (error) {
        console.error('[Household API] MP token validation failed:', error);
        return NextResponse.json(
          { error: 'Invalid or expired authentication token' },
          { status: 401 }
        );
      }
    } else {
      // Fall back to NextAuth session (for Next.js dev mode)
      console.log('[Household API] No MP token, checking NextAuth session...');
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

      contactId = parseInt(session.user.id, 10);

      if (isNaN(contactId)) {
        console.error('[Household API] Failed to parse Contact ID:', session.user.id);
        return NextResponse.json(
          { error: 'Invalid Contact ID in session', sessionUserId: session.user.id },
          { status: 400 }
        );
      }

      console.log('[Household API] NextAuth contactId:', contactId);
    }

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
