/**
 * API Route: /api/prayers/stats
 * Fetches prayer statistics for the current user
 * Uses the api_Custom_User_Response_Stats_JSON stored procedure
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { MinistryPlatformClient } from '@/providers/MinistryPlatform/core/ministryPlatformClient';

interface PrayerStats {
  Contact_ID: number;
  Response_Type_ID: number;
  Response_Type_Name: string;
  Total_Responses: number;
  Responses_Today: number;
  Current_Streak: number;
  Last_Response_Date: string | null;
  Unique_Entries_Responded: number;
}

/**
 * GET /api/prayers/stats
 * Get prayer statistics for the authenticated user
 * Returns total prayers, current streak, prayers today, etc.
 */
export async function GET() {
  try {
    const { user, token } = await authenticateRequest();
    const mpClient = new MinistryPlatformClient(token);

    // Call the stored procedure to get user prayer stats
    // ResponseTypeID defaults to 1 ("Prayed")
    // Stored proc uses JsonResult pattern: returns [{"JsonResult": {...}}]
    const result = await mpClient.callStoredProcedure<{ JsonResult: PrayerStats }>(
      'api_Custom_User_Response_Stats_JSON',
      {
        '@ContactID': user.contactId,
        '@ResponseTypeID': 1, // "Prayed" response type
      }
    );

    console.log('[Stats API] Raw result from MP:', JSON.stringify(result, null, 2));

    // MinistryPlatform returns double-nested arrays: [[{"JsonResult": "..."}]]
    // Need to access result[0][0].JsonResult
    if (!result || result.length === 0 || !result[0] || !Array.isArray(result[0]) || result[0].length === 0 || !result[0][0] || !result[0][0].JsonResult) {
      // User hasn't prayed for anything yet OR stored procedure returned empty - return zeros
      console.log('[Stats API] No valid data from stored procedure, returning zeros');
      return NextResponse.json({
        Contact_ID: user.contactId,
        Response_Type_ID: 1,
        Response_Type_Name: 'Prayed',
        Total_Responses: 0,
        Responses_Today: 0,
        Current_Streak: 0,
        Last_Response_Date: null,
        Unique_Entries_Responded: 0,
      });
    }

    // Extract the JsonResult from the double-nested array wrapper
    const stats = result[0][0].JsonResult;
    console.log('[Stats API] Extracted JsonResult:', typeof stats, stats);

    // JsonResult is always a JSON string from the stored procedure
    const parsedStats = typeof stats === 'string' ? JSON.parse(stats) : stats;
    console.log('[Stats API] Parsed stats:', parsedStats);

    return NextResponse.json(parsedStats);
  } catch (error) {
    console.error('GET /api/prayers/stats error:', error);

    if (error instanceof Error && error.message.includes('authentication')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error.message },
        { status: 401 }
      );
    }

    // If stored procedure doesn't exist yet (SQL not run), provide helpful error
    if (error instanceof Error && error.message.includes('Could not find stored procedure')) {
      return NextResponse.json(
        {
          error: 'Stored procedure not found',
          message: 'Please run the SQL schema script (/database/schema.sql) first to create api_Custom_User_Response_Stats_JSON',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch prayer stats', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
