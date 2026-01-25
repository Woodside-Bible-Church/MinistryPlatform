/**
 * Cron Job Endpoint for Scheduled Syncs
 * Triggered by Vercel Cron on a schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { CampusSyncService } from '@/lib/services/campus-sync';

export const maxDuration = 300; // 5 minute timeout for cron jobs

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (IMPORTANT: prevents unauthorized triggers)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting scheduled sync job...');
    const startTime = Date.now();

    const syncService = new CampusSyncService();

    // Sync all campuses
    const results = await syncService.syncAllCampuses();

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    console.log(`Sync job completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results,
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Sync job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Allow POST as well (for manual testing)
export async function POST(request: NextRequest) {
  return GET(request);
}
