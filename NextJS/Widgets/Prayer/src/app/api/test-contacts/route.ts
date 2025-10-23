/**
 * Test API endpoint to verify MP API access with Contacts table
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { MinistryPlatformClient } from '@/providers/MinistryPlatform/core/ministryPlatformClient';
import { TableService } from '@/providers/MinistryPlatform/services/tableService';

export async function GET() {
  try {
    // Authenticate the request
    const { token } = await authenticateRequest();

    // Create MP client
    const client = new MinistryPlatformClient(
      process.env.MINISTRY_PLATFORM_BASE_URL!,
      () => token
    );

    const tableService = new TableService(client);

    console.log('Testing Contacts table access...');

    // Try to fetch just a few contacts with basic fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contacts = await tableService.getTableRecords<any>(
      'Contacts',
      {
        $select: 'Contact_ID,Display_Name,Email_Address',
        $top: 5,
      }
    );

    console.log(`Successfully fetched ${contacts.length} contacts:`, contacts);

    return NextResponse.json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error('Test contacts error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
