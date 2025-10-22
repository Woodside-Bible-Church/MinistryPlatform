/**
 * API Route: /api/prayers/[id]/approve
 * Handles approving prayer requests (staff only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, isStaff } from '@/lib/mpWidgetAuth';
import { PrayerService } from '@/services/prayerService';

/**
 * POST /api/prayers/[id]/approve
 * Approve a prayer request (staff only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, token } = await authenticateRequest();

    // Check if user is staff
    if (!isStaff(user)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only staff members can approve prayers' },
        { status: 403 }
      );
    }

    const prayerService = new PrayerService(token);

    // Check if prayer exists
    const existingPrayer = await prayerService.getPrayerById(parseInt(id));

    if (!existingPrayer) {
      return NextResponse.json(
        { error: 'Prayer not found' },
        { status: 404 }
      );
    }

    // Approve the prayer
    const approvedPrayer = await prayerService.approvePrayer(parseInt(id));

    return NextResponse.json(approvedPrayer);
  } catch (error) {
    console.error(`POST /api/prayers/${(await params).id}/approve error:`, error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to approve prayer', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
