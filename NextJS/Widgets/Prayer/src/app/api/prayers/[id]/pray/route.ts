/**
 * API Route: /api/prayers/[id]/pray
 * Handles incrementing the prayer count when someone prays for a request
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { PrayerService } from '@/services/prayerService';

/**
 * POST /api/prayers/[id]/pray
 * Increment the prayer count for a specific prayer request
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { token } = await authenticateRequest();
    const prayerService = new PrayerService(token);

    const { id } = await params;
    const prayerId = parseInt(id);

    if (isNaN(prayerId)) {
      return NextResponse.json(
        { error: 'Invalid prayer ID' },
        { status: 400 }
      );
    }

    // Get current prayer to retrieve current count
    const currentPrayer = await prayerService.getPrayerById(prayerId);

    if (!currentPrayer) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    // Increment the prayer count
    const newCount = (currentPrayer.Prayer_Count ?? 0) + 1;

    const updatedPrayer = await prayerService.updatePrayer({
      Feedback_Entry_ID: prayerId,
      Prayer_Count: newCount,
    });

    return NextResponse.json({
      success: true,
      prayer_count: updatedPrayer.Prayer_Count,
    });
  } catch (error) {
    console.error('POST /api/prayers/[id]/pray error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update prayer count', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
