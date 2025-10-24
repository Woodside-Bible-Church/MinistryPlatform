/**
 * API Route: /api/prayers/[id]/updates
 * Manages prayer updates/testimonies
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { MinistryPlatformClient } from '@/providers/MinistryPlatform/core/ministryPlatformClient';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const { user, token } = await authenticateRequest();
    const mpClient = new MinistryPlatformClient(token);

    const prayerId = parseInt(params.id);
    const body = await request.json();

    const { updateText, isAnswered } = body;

    if (!updateText || updateText.trim() === '') {
      return NextResponse.json(
        { error: 'Update text is required' },
        { status: 400 }
      );
    }

    // Verify the prayer exists and user owns it
    const prayer = await mpClient.get('Feedback_Entries', {
      $filter: `Feedback_Entry_ID = ${prayerId}`,
      $select: 'Feedback_Entry_ID,Contact_ID'
    }) as unknown as Array<{ Feedback_Entry_ID: number; Contact_ID: number }>;

    if (!prayer || prayer.length === 0) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    if (prayer[0].Contact_ID !== user.contactId) {
      return NextResponse.json(
        { error: 'You can only add updates to your own prayers' },
        { status: 403 }
      );
    }

    // Create the update
    const updateData = {
      Feedback_Entry_ID: prayerId,
      Contact_ID: user.contactId,
      Update_Text: updateText.trim(),
      Update_Date: new Date().toISOString(),
      Is_Answered: isAnswered || false,
      Domain_ID: 1,
    };

    const result = await mpClient.post('Feedback_Entry_Updates', [updateData]);

    // If marking as answered, also update the Care_Outcome_ID on the prayer
    if (isAnswered) {
      // Care_Outcome_ID values vary by MP instance, but typically 3 = "Answered"
      // You may need to adjust this value based on your Care_Outcomes table
      await mpClient.post(`Feedback_Entries/${prayerId}`, {
        Care_Outcome_ID: 3, // Adjust as needed
      });
    }

    return NextResponse.json({
      success: true,
      update: result,
      message: isAnswered
        ? 'Prayer marked as answered!'
        : 'Update added successfully!'
    });
  } catch (error) {
    console.error('POST /api/prayers/[id]/updates error:', error);
    return NextResponse.json(
      {
        error: 'Failed to add update',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
