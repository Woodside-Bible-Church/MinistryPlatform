import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkBudgetAppAccess, getMPAccessToken, getMPBaseUrl } from '@/lib/mpAuth';

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
    // Check if user is authenticated
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to access the Budget app
    const { hasAccess } = await checkBudgetAppAccess();

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden - You don\'t have permission to access the Budget app' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const projectIdOrSlug = searchParams.get('projectId');

    // Get OAuth token for MinistryPlatform API using client credentials
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

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
        'Authorization': `Bearer ${accessToken}`,
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
