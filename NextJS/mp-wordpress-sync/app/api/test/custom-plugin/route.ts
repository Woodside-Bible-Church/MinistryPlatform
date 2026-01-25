/**
 * Test the custom WordPress plugin endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { WordPressCustomService } from '@/lib/services/wordpress-custom';

export async function POST(request: NextRequest) {
  try {
    const wpService = new WordPressCustomService();

    // Test updating Lake Orion's service times
    const result = await wpService.updateLocation(323, {
      location_info_services: 'SUN 8:30AM, 10AM & 11:30AM!',
    });

    // Verify it worked by fetching the data back
    const verifyData = await wpService.getLocation(323);

    return NextResponse.json({
      success: true,
      message: 'Custom plugin test successful!',
      update_result: result,
      verified_data: verifyData,
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        note: 'Make sure the Woodside MP Sync plugin is installed and activated in WordPress',
      },
      { status: 500 }
    );
  }
}
