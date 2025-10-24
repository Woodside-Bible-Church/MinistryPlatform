/**
 * API Route: /api/prayers/widget-data
 * Fetches ALL prayer widget data in a single call
 * Uses the api_Custom_Prayer_Widget_Data_JSON stored procedure
 *
 * This unified endpoint replaces multiple separate API calls:
 * - /api/prayers (my requests)
 * - /api/prayers?approved=true (community needs)
 * - /api/prayers/prayed-for (prayer partners)
 * - /api/prayers/stats (user stats)
 * - Configuration and labels
 */

import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/mpWidgetAuth';
import { MinistryPlatformClient } from '@/providers/MinistryPlatform/core/ministryPlatformClient';

/**
 * Recursively parses JSON strings in an object
 * SQL Server's FOR JSON PATH returns nested objects as JSON strings
 * This function walks the object tree and parses any string values that are valid JSON
 */
function deepParseJson(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // If it's a string, try to parse it as JSON
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj);
      // Recursively parse the result in case it has nested JSON strings
      return deepParseJson(parsed);
    } catch {
      // Not valid JSON, return as-is
      return obj;
    }
  }

  // If it's an array, recursively parse each element
  if (Array.isArray(obj)) {
    return obj.map(item => deepParseJson(item));
  }

  // If it's an object, recursively parse each property
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = deepParseJson((obj as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  // For primitive types (number, boolean), return as-is
  return obj;
}

/**
 * GET /api/prayers/widget-data
 * Get all prayer widget data (authenticated or public)
 * Returns nested JSON with:
 * - Widget_Title, Widget_Subtitle
 * - Configuration (frontend settings)
 * - User_Stats (total prayers, streak, today) - null if not authenticated
 * - My_Requests (user's own prayer requests) - empty if not authenticated
 * - Prayer_Partners (prayers user has prayed for) - empty if not authenticated
 * - Community_Needs (all other approved prayers) - always available
 */
export async function GET() {
  try {
    // Try to authenticate, but don't fail if token is missing/expired
    let user = null;
    let token = null;
    let contactId = null;

    try {
      const authResult = await authenticateRequest();
      user = authResult.user;
      token = authResult.token;
      contactId = user.contactId;
      console.log('[Widget Data API] Authenticated user, contact:', contactId);
    } catch {
      console.log('[Widget Data API] No valid authentication, fetching public data only');
      // For unauthenticated users, we still call the stored procedure but with ContactID = NULL
      // This will return:
      // - Public prayers (Visibility_Level_ID >= 4) in Community_Needs
      // - Empty My_Requests and Prayer_Partners
      // - Null User_Stats and User_Info
    }

    // Create MP client with user token (if authenticated) or app-level token (if not)
    // When token is undefined, MinistryPlatformClient will automatically use client credentials OAuth
    const mpClient = new MinistryPlatformClient(token || undefined);

    console.log('[Widget Data API] Fetching unified widget data for contact:', contactId || 'unauthenticated (public prayers only)');

    // Call the unified stored procedure
    // Stored proc uses JsonResult pattern: returns [[{"JsonResult": {...}}]]
    const result = await mpClient.callStoredProcedure<Array<Array<{ JsonResult: string }>>>(
      'api_Custom_Prayer_Widget_Data_JSON',
      {
        '@ContactID': contactId,
        '@DomainID': 1,
      }
    );

    console.log('[Widget Data API] Received data from stored procedure');

    // MinistryPlatform returns double-nested arrays: [[{"JsonResult": "..."}]]
    // Need to access result[0][0].JsonResult
    if (!result || result.length === 0 || !result[0] || !Array.isArray(result[0]) || result[0].length === 0 || !result[0][0] || !result[0][0].JsonResult) {
      console.log('[Widget Data API] No valid data from stored procedure');
      return NextResponse.json(
        { error: 'No data returned from stored procedure' },
        { status: 500 }
      );
    }

    // Extract the JsonResult from the double-nested array wrapper
    const widgetData = result[0][0].JsonResult;
    console.log('[Widget Data API] Extracted JsonResult:', typeof widgetData);

    // JsonResult is always a JSON string from the stored procedure
    // First parse the outer JSON string
    let parsedData = typeof widgetData === 'string' ? JSON.parse(widgetData) : widgetData;

    // Then recursively parse any nested JSON strings
    // (SQL Server FOR JSON PATH returns nested objects as JSON strings)
    parsedData = deepParseJson(parsedData);

    console.log('[Widget Data API] Parsed widget data sections:', Object.keys(parsedData));

    // User_Info (including profile image) is now included in the stored procedure response
    // No need to fetch it separately via REST API (which had permission issues)

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('GET /api/prayers/widget-data error:', error);

    // If stored procedure doesn't exist yet (SQL not run), provide helpful error
    if (error instanceof Error && error.message.includes('Could not find stored procedure')) {
      return NextResponse.json(
        {
          error: 'Stored procedure not found',
          message: 'Please run the unified-prayer-widget-proc.sql script to create api_Custom_Prayer_Widget_Data_JSON',
          details: error.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch widget data', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
