/**
 * API Route: /api/prayers/[id]/pray
 * Handles tracking prayer responses using Feedback_Entry_User_Responses table
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { MinistryPlatformClient } from '@/providers/MinistryPlatform/core/ministryPlatformClient';

/**
 * POST /api/prayers/[id]/pray
 * Record that a user prayed for a specific prayer request
 * Creates a record in Feedback_Entry_User_Responses table
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, token } = await authenticateRequest();
    const mpClient = new MinistryPlatformClient(token);

    const { id } = await params;
    const prayerId = parseInt(id);

    if (isNaN(prayerId)) {
      return NextResponse.json(
        { error: 'Invalid prayer ID' },
        { status: 400 }
      );
    }

    // Parse optional encouraging message from request body
    const body = await request.json().catch(() => ({}));
    const encouragingMessage = body.message?.trim() || null;

    // Check if user already prayed for this request
    const existingResponse = await mpClient.get('Feedback_Entry_User_Responses', {
      $filter: `Feedback_Entry_ID = ${prayerId} AND Contact_ID = ${user.contactId} AND Response_Type_ID = 1`,
      $top: 1,
    });

    if (existingResponse && existingResponse.length > 0) {
      // User already prayed for this - get current count
      const countResponse = await mpClient.get('Feedback_Entry_User_Responses', {
        $filter: `Feedback_Entry_ID = ${prayerId} AND Response_Type_ID = 1`,
        $select: 'Feedback_Entry_User_Response_ID',
      });

      return NextResponse.json({
        success: true,
        already_prayed: true,
        prayer_count: countResponse?.length ?? 0,
      });
    }

    // Create new prayer response record
    // Response_Type_ID = 1 is "Prayed" (from Feedback_Response_Types table)
    await mpClient.post('Feedback_Entry_User_Responses', [{
      Feedback_Entry_ID: prayerId,
      Contact_ID: user.contactId,
      Response_Type_ID: 1, // "Prayed"
      Response_Date: new Date().toISOString(),
      Response_Text: encouragingMessage, // Optional encouraging message
      Domain_ID: 1, // Default domain
    }]);

    // Get updated prayer count (total number of "Prayed" responses for this entry)
    const countResponse = await mpClient.get('Feedback_Entry_User_Responses', {
      $filter: `Feedback_Entry_ID = ${prayerId} AND Response_Type_ID = 1`,
      $select: 'Feedback_Entry_User_Response_ID',
    });

    return NextResponse.json({
      success: true,
      already_prayed: false,
      prayer_count: countResponse?.length ?? 1,
    });
  } catch (error) {
    console.error('POST /api/prayers/[id]/pray error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    // If table doesn't exist yet (SQL not run), provide helpful error
    if (error instanceof Error && error.message.includes('Invalid object name')) {
      return NextResponse.json(
        {
          error: 'Database table not found',
          message: 'Please run the SQL schema script (/database/schema.sql) first to create Feedback_Entry_User_Responses table',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record prayer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
