import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/projects/budgets
 * Fetch project budget data from MinistryPlatform
 *
 * Query params:
 *   - projectId: (optional) specific project ID or slug to fetch
 *
 * Returns JSON array of projects with budget information
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectIdOrSlug = searchParams.get('projectId');

    // Get OAuth token for MinistryPlatform API
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    const clientId = process.env.MINISTRY_PLATFORM_CLIENT_ID;
    const clientSecret = process.env.MINISTRY_PLATFORM_CLIENT_SECRET;

    if (!baseUrl || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'MinistryPlatform configuration missing' },
        { status: 500 }
      );
    }

    // Get OAuth token
    const tokenResponse = await fetch(`${baseUrl}/oauth/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'http://www.thinkministry.com/dataplatform/scopes/all',
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Failed to get OAuth token:', await tokenResponse.text());
      return NextResponse.json(
        { error: 'Failed to authenticate with MinistryPlatform' },
        { status: 500 }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Call the stored procedure using POST for better handling of large responses
    const procUrl = `${baseUrl}/procs/api_Custom_GetProjectBudgets_JSON`;
    const procParams: Record<string, string> = {};
    if (projectIdOrSlug) {
      // Check if it's a numeric ID or a slug
      const isNumeric = /^\d+$/.test(projectIdOrSlug);
      if (isNumeric) {
        procParams['@ProjectID'] = projectIdOrSlug;
      } else {
        procParams['@Slug'] = projectIdOrSlug;
      }
    }

    const procResponse = await fetch(procUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(procParams),
    });

    if (!procResponse.ok) {
      const errorText = await procResponse.text();
      console.error('Stored procedure error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch project budgets', details: errorText },
        { status: procResponse.status }
      );
    }

    // The stored procedure returns JSON wrapped by MinistryPlatform
    const data = await procResponse.json();

    // Our stored procedure returns: [[{ "JsonResult": "[{...}]" }]]
    let projects = [];

    if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      const firstRow = data[0][0];

      if (firstRow && firstRow.JsonResult) {
        try {
          // Parse the JSON string inside
          const jsonString = firstRow.JsonResult;
          projects = JSON.parse(jsonString);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          console.error('Problematic JSON string:', firstRow.JsonResult);
          throw parseError;
        }
      }
    }

    return NextResponse.json(projects, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
