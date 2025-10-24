/**
 * API Route: /api/prayers
 * Handles listing and creating prayer requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { PrayerService } from '@/services/prayerService';
import { CreateFeedbackSchema } from '@/providers/MinistryPlatform/entities/FeedbackSchema';
import { z } from 'zod';

/**
 * GET /api/prayers
 * Get prayer requests with optional filtering
 * Public endpoint for approved prayers, requires auth for "mine" filter
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const myPrayers = searchParams.get('mine') === 'true';
    const search = searchParams.get('search');

    // "My Prayers" requires authentication
    if (myPrayers) {
      const { user, token } = await authenticateRequest();
      const prayerService = new PrayerService(token);
      const prayers = await prayerService.getMyPrayers(user.contactId);

      // Get actual prayer counts from Feedback_Entry_User_Responses
      const prayerIds = prayers.map(p => p.Feedback_Entry_ID).filter(Boolean);
      let actualCounts: Record<number, number> = {};
      if (prayerIds.length > 0) {
        actualCounts = await prayerService.getPrayerCounts(prayerIds);
      }

      // Add user's imageUrl and actual prayer count to each prayer
      const prayersWithImage = prayers.map(prayer => ({
        ...prayer,
        Prayer_Count: actualCounts[prayer.Feedback_Entry_ID] ?? 0,
        userImageUrl: user.imageUrl,
      }));

      return NextResponse.json(prayersWithImage);
    }

    // Public access for approved prayers
    // Create a PrayerService without user token (will use OAuth)
    const prayerService = new PrayerService('');

    // TEMPORARY: Use regular table query instead of stored procedure to debug
    // TODO: Switch back to getPrayersWithCounts once SP is working
    const prayers = await prayerService.getPrayers({
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      onlyApproved: true, // Force approved for public access
      search: search || undefined,
    });

    console.error('[GET /api/prayers] Table query response count:', prayers.length);

    return NextResponse.json(prayers);
  } catch (error) {
    console.error('GET /api/prayers error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch prayers', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prayers
 * Create a new prayer request
 */
export async function POST(request: NextRequest) {
  try {
    const { user, token } = await authenticateRequest();
    const prayerService = new PrayerService(token);

    // Parse and validate request body
    const body = await request.json();
    console.error('[POST /api/prayers] Request body:', JSON.stringify(body, null, 2));

    const prayerData = CreateFeedbackSchema.parse({
      Contact_ID: user.contactId, // Always use the authenticated user's contact ID
      Feedback_Type_ID: body.Feedback_Type_ID,
      Description: body.Description,
      Entry_Title: body.Entry_Title,
      Ongoing_Need: body.Ongoing_Need ?? false,
      Approved: false, // New prayers always start unapproved
    });

    console.error('[POST /api/prayers] Prayer data after schema parse:', JSON.stringify(prayerData, null, 2));
    console.error('[POST /api/prayers] User contact ID:', user.contactId);

    const newPrayer = await prayerService.submitPrayer(prayerData);

    return NextResponse.json(newPrayer, { status: 201 });
  } catch (error) {
    console.error('POST /api/prayers error:', error);

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
      { error: 'Failed to create prayer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
