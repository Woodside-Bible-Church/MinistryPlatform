// ===================================================================
// API Route: GET /api/rsvp/project
// ===================================================================
// Fetches project RSVP data including events, questions, and cards
// Calls stored procedure: api_Custom_RSVP_Project_Data_JSON
// ===================================================================

import { NextRequest, NextResponse } from 'next/server';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';
import type { ProjectRSVPDataResponse } from '@/types/rsvp';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectRsvpId = searchParams.get('projectRsvpId');
    const congregationId = searchParams.get('congregationId');
    const campusSlug = searchParams.get('campusSlug');

    // Validate required parameters
    if (!projectRsvpId) {
      return NextResponse.json(
        { error: 'projectRsvpId is required' },
        { status: 400 }
      );
    }

    // Get MP provider singleton instance
    const mp = ministryPlatformProvider.getInstance();

    // Build stored procedure parameters
    const params: Record<string, string> = {
      '@Project_RSVP_ID': projectRsvpId,
    };

    // Priority: campus slug over congregation ID
    if (campusSlug) {
      params['@Campus_Slug'] = campusSlug;
    } else if (congregationId) {
      params['@Congregation_ID'] = congregationId;
    }

    // Execute stored procedure
    const result = await mp.executeProcedure(
      'api_Custom_RSVP_Project_Data_JSON',
      params
    );

    // Stored procedure returns nested array with JsonResult
    // Format: [[{"JsonResult": "{...}"}]]
    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json(
        { error: 'No data returned from stored procedure' },
        { status: 404 }
      );
    }

    const firstRow = result[0];
    if (!Array.isArray(firstRow) || firstRow.length === 0) {
      return NextResponse.json(
        { error: 'Invalid data format from stored procedure' },
        { status: 500 }
      );
    }

    const jsonResultRow = firstRow[0] as { JsonResult?: string };
    if (!jsonResultRow.JsonResult) {
      return NextResponse.json(
        { error: 'No JsonResult field in response' },
        { status: 500 }
      );
    }

    // Parse the JSON string
    const data: ProjectRSVPDataResponse = JSON.parse(jsonResultRow.JsonResult);

    // Return the parsed data
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching project RSVP data:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch project RSVP data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
