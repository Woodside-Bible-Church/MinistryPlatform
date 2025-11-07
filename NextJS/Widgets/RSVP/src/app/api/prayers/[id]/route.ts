/**
 * API Route: /api/prayers/[id]
 * Handles updating and deleting individual prayer requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isStaff } from '@/lib/mpWidgetAuth';
import { PrayerService } from '@/services/prayerService';
import { UpdateFeedbackSchema } from '@/providers/MinistryPlatform/entities/FeedbackSchema';
import { z } from 'zod';

/**
 * GET /api/prayers/[id]
 * Get a single prayer request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { token } = await authenticateRequest();
    const prayerService = new PrayerService(token);

    const prayer = await prayerService.getPrayerById(parseInt(id));

    if (!prayer) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prayer);
  } catch (error) {
    console.error('GET /api/prayers/[id] error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch prayer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/prayers/[id]
 * Update a prayer request (only by owner or staff)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, token } = await authenticateRequest();
    const prayerService = new PrayerService(token);

    // Get the existing prayer
    const existingPrayer = await prayerService.getPrayerById(parseInt(id));

    if (!existingPrayer) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    // Check authorization: must be the owner or staff
    const isOwner = existingPrayer.Contact_ID === user.contactId;
    const isStaffMember = isStaff(user);

    if (!isOwner && !isStaffMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only edit your own prayers' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Non-staff users cannot approve prayers
    if (body.Approved !== undefined && !isStaffMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only staff can approve prayers' },
        { status: 403 }
      );
    }

    const updateData = UpdateFeedbackSchema.parse({
      Feedback_Entry_ID: parseInt(id),
      Description: body.Description,
      Feedback_Type_ID: body.Feedback_Type_ID,
      Ongoing_Need: body.Ongoing_Need,
      Approved: body.Approved,
      Entry_Title: body.Entry_Title,
      Target_Date: body.Target_Date || undefined,
    });

    const updatedPrayer = await prayerService.updatePrayer(updateData);

    return NextResponse.json(updatedPrayer);
  } catch (error) {
    console.error('PATCH /api/prayers/[id] error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update prayer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/prayers/[id]
 * Delete a prayer request (only by owner or staff)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, token } = await authenticateRequest();
    const prayerService = new PrayerService(token);

    // Get the existing prayer
    const existingPrayer = await prayerService.getPrayerById(parseInt(id));

    if (!existingPrayer) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    // Check authorization: must be the owner or staff
    const isOwner = existingPrayer.Contact_ID === user.contactId;
    const isStaffMember = isStaff(user);

    if (!isOwner && !isStaffMember) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only delete your own prayers' },
        { status: 403 }
      );
    }

    await prayerService.deletePrayer(parseInt(id));

    return NextResponse.json({ success: true, message: 'Prayer deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/prayers/[id] error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete prayer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
