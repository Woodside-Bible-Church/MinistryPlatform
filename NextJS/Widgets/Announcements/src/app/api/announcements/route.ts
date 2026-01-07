import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build parameters for the stored procedure
    const params = new URLSearchParams();

    // Map query params to stored procedure params
    const paramMap: Record<string, string> = {
      CongregationID: '@CongregationID',
      GroupID: '@GroupID',
      EventID: '@EventID',
      Search: '@Search',
      AnnouncementIDs: '@AnnouncementIDs',
      Page: '@Page',
      NumPerPage: '@NumPerPage',
      UserName: '@UserName',
      DomainID: '@DomainID',
    };

    Object.entries(paramMap).forEach(([queryParam, spParam]) => {
      const value = searchParams.get(spParam) || searchParams.get(queryParam);
      if (value) {
        params.append(spParam, value);
      }
    });

    // Get MinistryPlatform base URL from environment
    // Should be like: https://my.woodsidebible.org/ministryplatformapi
    const mpBaseUrl = process.env.MINISTRY_PLATFORM_BASE_URL || 'https://my.woodsidebible.org/ministryplatformapi';

    // Extract root URL (everything before /ministryplatformapi)
    const mpRootUrl = mpBaseUrl.replace(/\/ministryplatformapi\/?$/, '');

    // Step 1: Get OAuth access token
    const tokenUrl = `${mpRootUrl}/ministryplatformapi/oauth/connect/token`;
    console.log('Getting OAuth token from:', tokenUrl);

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
        client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
        scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('OAuth token error:', tokenResponse.status, errorText);
      throw new Error(`Failed to get OAuth token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Call stored procedure with Bearer token
    const storedProcUrl = `${mpRootUrl}/ministryplatformapi/procs/api_custom_AnnouncementsWidget_JSON${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('Calling stored procedure:', storedProcUrl);

    const response = await fetch(storedProcUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stored procedure error:', response.status, errorText);
      throw new Error(`Failed to fetch announcements: ${response.status}`);
    }

    const rawData = await response.json();

    console.log('Raw stored procedure response:', JSON.stringify(rawData, null, 2));

    // MinistryPlatform stored procedures return data in JsonResult format:
    // [[{"JsonResult": "{...}"}]]
    // We need to parse the JsonResult string
    const jsonResult = rawData[0][0].JsonResult;
    const data = JSON.parse(jsonResult);

    console.log('Parsed data:', JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
