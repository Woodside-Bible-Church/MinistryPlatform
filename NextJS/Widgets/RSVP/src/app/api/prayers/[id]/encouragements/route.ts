/**
 * API Route: /api/prayers/[id]/encouragements
 * Get encouraging messages left by people who prayed for this prayer
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { MinistryPlatformClient } from '@/providers/MinistryPlatform/core/ministryPlatformClient';

/**
 * GET /api/prayers/[id]/encouragements
 * Get all encouraging messages for a specific prayer request
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token } = await authenticateRequest();
    const mpClient = new MinistryPlatformClient(token);

    const { id } = await params;
    const prayerId = parseInt(id);

    if (isNaN(prayerId)) {
      return NextResponse.json(
        { error: 'Invalid prayer ID' },
        { status: 400 }
      );
    }

    // Get all responses with messages for this prayer
    const responses = await mpClient.get('Feedback_Entry_User_Responses', {
      $filter: `Feedback_Entry_ID = ${prayerId} AND Response_Type_ID = 1 AND Response_Text IS NOT NULL AND Response_Text != ''`,
      $select: 'Feedback_Entry_User_Response_ID,Response_Date,Response_Text,Contact_ID_Table.Display_Name,Contact_ID_Table.First_Name',
      $orderby: 'Response_Date DESC',
    });

    return NextResponse.json(responses || []);
  } catch (error) {
    console.error('GET /api/prayers/[id]/encouragements error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch encouragements', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
