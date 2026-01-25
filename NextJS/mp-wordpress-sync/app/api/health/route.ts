/**
 * Health Check and Test Endpoint
 * Tests connections to both MinistryPlatform and WordPress
 */

import { NextRequest, NextResponse } from 'next/server';
import { CampusSyncService } from '@/lib/services/campus-sync';

export async function GET(request: NextRequest) {
  try {
    const syncService = new CampusSyncService();

    // Test connections
    const connections = await syncService.testConnections();

    const allHealthy = connections.mp && connections.wp;

    return NextResponse.json(
      {
        status: allHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        connections: {
          ministryplatform: connections.mp ? 'connected' : 'failed',
          wordpress: connections.wp ? 'connected' : 'failed',
        },
        environment: {
          mp_url: process.env.MINISTRY_PLATFORM_BASE_URL,
          wp_url: process.env.WORDPRESS_URL,
          has_mp_credentials: !!(process.env.MINISTRY_PLATFORM_CLIENT_ID && process.env.MINISTRY_PLATFORM_CLIENT_SECRET),
          has_wp_credentials: !!(process.env.WORDPRESS_USERNAME && process.env.WORDPRESS_APP_PASSWORD),
        },
      },
      { status: allHealthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
