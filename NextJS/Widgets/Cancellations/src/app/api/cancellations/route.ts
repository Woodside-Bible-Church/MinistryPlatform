import { NextRequest, NextResponse } from 'next/server';

const MP_BASE_URL = process.env.MINISTRY_PLATFORM_BASE_URL || 'https://my.woodsidebible.org';
const MP_CLIENT_ID = process.env.MINISTRY_PLATFORM_CLIENT_ID;
const MP_CLIENT_SECRET = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

// CORS headers for widget embedding
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Token cache for client credentials flow
let tokenCache: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth token using client credentials flow
 */
async function getClientCredentialsToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  if (!MP_CLIENT_ID || !MP_CLIENT_SECRET) {
    throw new Error('Missing MinistryPlatform client credentials');
  }

  const tokenUrl = `${MP_BASE_URL}/oauth/connect/token`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
      client_id: MP_CLIENT_ID,
      client_secret: MP_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Token error:', error);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const data = await response.json();

  // Cache the token
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return data.access_token;
}

/**
 * Handle CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * GET /api/cancellations
 *
 * Query params:
 * - @CongregationID or CongregationID: Filter by specific campus ID
 * - @Campus or Campus: Filter by campus slug (e.g., 'troy', 'farmington-hills')
 * - @DomainID or DomainID: Multi-tenant domain (defaults to 1)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Build stored procedure parameters
    // Support both @ParamName and ParamName formats
    const spParams = new URLSearchParams();

    ['CongregationID', 'Campus', 'DomainID'].forEach((key) => {
      const value = searchParams.get(`@${key}`) || searchParams.get(key);
      if (value) {
        spParams.append(`@${key}`, value);
      }
    });

    // Get OAuth token
    const token = await getClientCredentialsToken();

    // Call the stored procedure
    const storedProcUrl = `${MP_BASE_URL}/procs/api_custom_CancellationsWidget_JSON?${spParams.toString()}`;

    const response = await fetch(storedProcUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      // Don't cache - we want fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stored procedure error:', response.status, errorText);

      // Return fallback data structure on error
      return NextResponse.json(
        getFallbackData(),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    const result = await response.json();

    // MinistryPlatform returns nested arrays: [[{"JsonResult": "..."}]]
    // Need to unwrap to get to the actual data
    let data;

    // Handle nested array structure from MP stored procs
    let innerResult = result;
    while (Array.isArray(innerResult) && innerResult.length > 0 && Array.isArray(innerResult[0])) {
      innerResult = innerResult[0];
    }

    if (Array.isArray(innerResult) && innerResult.length > 0) {
      const jsonString = innerResult[0]?.JsonResult;
      if (jsonString) {
        data = JSON.parse(jsonString);
      } else {
        data = getFallbackData();
      }
    } else {
      data = getFallbackData();
    }

    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Error fetching cancellations:', error);

    // Return fallback data on any error
    return NextResponse.json(
      getFallbackData(),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  }
}

/**
 * Returns fallback data when the API is unavailable
 */
function getFallbackData() {
  return {
    Information: {
      alertTitle: 'Weather Advisory',
      mainTitle: 'Cancellations',
      alertMessage: 'Due to hazardous conditions, several church activities have been affected. Please check your campus status below before traveling.',
      autoRefreshMessage: 'This page refreshes automatically. Check back for the latest updates.',
      lastUpdatedPrefix: 'Last updated:',
      openStatusMessage: 'All activities are proceeding as scheduled',
      openStatusSubtext: 'No cancellations or modifications at this time',
    },
    LastUpdated: new Date().toISOString(),
    Campuses: [],
  };
}
