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

    // Add contactImageUrl field (null for now - TODO: implement photo lookup)
    const prayersWithPhotos = prayers.map(prayer => ({
      ...prayer,
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
