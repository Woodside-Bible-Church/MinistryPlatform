/**
 * Test endpoint to sync Lake Orion specifically
 * Hard-coded IDs: MP Congregation_ID=9, WP Page_ID=323
 */

import { NextRequest, NextResponse } from 'next/server';
import { CampusSyncService } from '@/lib/services/campus-sync';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting Lake Orion Sync Test ===');

    const syncService = new CampusSyncService();

    // Test connections first
    console.log('Testing connections...');
    const connections = await syncService.testConnections();

    if (!connections.mp) {
      return NextResponse.json(
        { error: 'MinistryPlatform connection failed. Check MP credentials in .env.local' },
        { status: 500 }
      );
    }

    if (!connections.wp) {
      return NextResponse.json(
        { error: 'WordPress connection failed. Check WP credentials in .env.local' },
        { status: 500 }
      );
    }

    console.log('✓ Connections OK');

    // Sync Lake Orion
    // MP: Congregation_ID = 9
    // WP: Page_ID = 323
    console.log('Syncing Lake Orion (MP ID: 9 → WP Page: 323)...');

    // Get dry_run parameter from query string (defaults to true for safety)
    const dryRun = request.nextUrl.searchParams.get('dry_run') !== 'false';

    const result = await syncService.syncCampusById(9, 323, dryRun);

    console.log('✓ Sync complete!');

    return NextResponse.json({
      success: true,
      message: 'Lake Orion synced successfully!',
      connections,
      sync_result: result,
    });

  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      {
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
