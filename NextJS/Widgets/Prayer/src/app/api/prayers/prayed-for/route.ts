/**
 * API Route: /api/prayers/prayed-for
 * Get prayers that the authenticated user has prayed for
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { PrayerService } from '@/services/prayerService';

/**
 * GET /api/prayers/prayed-for
 * Get list of prayers the current user has prayed for
 */
export async function GET() {
  try {
    const { user, token } = await authenticateRequest();
    const prayerService = new PrayerService(token);

    const prayers = await prayerService.getPrayersUserPrayedFor(user.contactId);

    // Get actual prayer counts from Feedback_Entry_User_Responses
    const prayersArray = Array.isArray(prayers) ? prayers : [];
    const prayerIds = prayersArray.map((p: any) => p.Feedback_Entry_ID).filter(Boolean);

    let actualCounts: Record<number, number> = {};
    if (prayerIds.length > 0) {
      const counts = await prayerService.getPrayerCounts(prayerIds);
      actualCounts = counts;
    }

    // Add contactImageUrl and actual prayer count
    const prayersWithPhotos = prayersArray.map((prayer: any) => ({
      ...prayer,
      Prayer_Count: actualCounts[prayer.Feedback_Entry_ID] ?? 0,
      contactImageUrl: null, // TODO: Find a way to get contact photos from MP
    }));

    return NextResponse.json(prayersWithPhotos);
  } catch (error) {
    console.error('GET /api/prayers/prayed-for error:', error);

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
