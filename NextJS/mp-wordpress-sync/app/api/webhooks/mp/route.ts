/**
 * MinistryPlatform Webhook Endpoint
 * Receives real-time updates from MinistryPlatform
 */

import { NextRequest, NextResponse } from 'next/server';
import { CampusSyncService } from '@/lib/services/campus-sync';
import { MPWebhookPayload } from '@/lib/types/campus';

export const maxDuration = 60; // 60 second timeout for webhook processing

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = request.headers.get('x-mp-webhook-secret');
    if (process.env.MP_WEBHOOK_SECRET && webhookSecret !== process.env.MP_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload: MPWebhookPayload = await request.json();

    console.log('Received MP webhook:', {
      eventType: payload.eventType,
      tableName: payload.tableName,
      recordId: payload.recordId,
    });

    // Handle different table types
    if (payload.tableName === 'Congregations') {
      return await handleCongregationWebhook(payload);
    }

    // Add more handlers for other tables here
    // else if (payload.tableName === 'Events') { ... }

    return NextResponse.json({
      success: true,
      message: `Webhook received for ${payload.tableName} but no handler configured`,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle Congregation (Campus) webhooks
 */
async function handleCongregationWebhook(payload: MPWebhookPayload) {
  const syncService = new CampusSyncService();

  try {
    if (payload.eventType === 'insert' || payload.eventType === 'update') {
      // Sync the specific campus
      const result = await syncService.syncCampusById(payload.recordId);

      return NextResponse.json({
        success: true,
        message: `Campus ${payload.recordId} synced successfully`,
        wp_post_id: result.id,
      });
    }

    if (payload.eventType === 'delete') {
      // Handle deletion (optional - you may want to keep WP posts even if MP record deleted)
      return NextResponse.json({
        success: true,
        message: `Campus ${payload.recordId} deletion noted (not removing from WordPress)`,
      });
    }

    return NextResponse.json({
      success: false,
      message: `Unknown event type: ${payload.eventType}`,
    });

  } catch (error) {
    console.error('Congregation sync error:', error);
    throw error;
  }
}
