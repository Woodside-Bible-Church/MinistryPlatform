import { NextRequest, NextResponse } from 'next/server';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';
import type { GroupFinderData } from '@/types/groupFinder';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mp = ministryPlatformProvider.getInstance();

    // Build stored procedure parameters from query string
    const params: Record<string, string> = {};

    // Map allowed filter params
    const allowedParams = [
      'CongregationID', 'DaysOfWeek', 'Cities', 'Leaders',
      'GroupIDs', 'Search', 'LifeStageID',
      'FamilyAccommodationID', 'IntendedAudienceID', 'KidsWelcome', 'GenderID',
    ];

    for (const key of allowedParams) {
      // Check both with and without @ prefix
      const value = searchParams.get(key) || searchParams.get(`@${key}`);
      if (value) {
        params[`@${key}`] = value;
      }
    }

    // Check for auth token to pass user context
    const authorization = request.headers.get('authorization');
    if (authorization) {
      // If user token provided, we could pass @UserName but the SP
      // handles this via the client credentials flow
    }

    const result = await mp.executeProcedure(
      'api_custom_GroupFinderWidget_JSON',
      params
    );

    // Stored procedure returns: [[{"JsonResult": "{...}"}]]
    const firstResultSet = result[0] as Record<string, string>[];
    if (!firstResultSet || firstResultSet.length === 0) {
      return NextResponse.json(
        { error: 'No data returned from stored procedure' },
        { status: 500 }
      );
    }

    const jsonResultRow = firstResultSet[0];
    const jsonString = jsonResultRow.JsonResult ||
      Object.values(jsonResultRow).find(v => typeof v === 'string');

    if (!jsonString) {
      return NextResponse.json(
        { error: 'Invalid response format from stored procedure' },
        { status: 500 }
      );
    }

    const data: GroupFinderData = JSON.parse(jsonString);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('GroupFinder API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups', details: String(error) },
      { status: 500 }
    );
  }
}
