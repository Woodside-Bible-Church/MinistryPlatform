/**
 * API Route: /api/categories
 * Handles fetching prayer categories (Feedback Types)
 */

import { NextResponse } from 'next/server';
import { PrayerService } from '@/services/prayerService';

/**
 * GET /api/categories
 * Get all prayer categories (public endpoint)
 */
export async function GET() {
  try {
    console.log('[Categories API] Starting request');

    // Public access - use OAuth client credentials
    const prayerService = new PrayerService('');

    const categories = await prayerService.getCategories();
    console.log('[Categories API] Fetched categories:', categories.length);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET /api/categories error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch categories', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
