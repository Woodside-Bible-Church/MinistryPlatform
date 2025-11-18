// ===================================================================
// API Route: GET /api/rsvp/projects
// ===================================================================
// Fetches list of available RSVP projects for dev mode dropdown
// Returns array of {value, label} for select dropdown
// ===================================================================

import { NextResponse } from 'next/server';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';

interface Project {
  Project_ID: number;
  RSVP_Title: string;
  RSVP_Slug: string | null;
  RSVP_Is_Active: boolean;
}

export async function GET(request: Request) {
  try {
    // Check for cache bypass parameter
    const { searchParams } = new URL(request.url);
    const bypassCache = searchParams.get('cache') === 'no';

    // Get MP provider singleton instance
    const mp = ministryPlatformProvider.getInstance();

    // Fetch all active Projects with RSVP functionality
    const projects = await mp.getTableRecords<Project>('Projects', {
      $select: 'Project_ID, RSVP_Title, RSVP_Slug, RSVP_Is_Active',
      $filter: 'RSVP_Is_Active = 1 AND RSVP_Slug IS NOT NULL',
      $orderby: 'RSVP_Title',
    });

    // Transform to dropdown options format
    // Use slug if available, otherwise use numeric ID
    const options = projects.map((project) => ({
      value: project.RSVP_Slug || project.Project_ID.toString(),
      label: `${project.RSVP_Title} (${project.RSVP_Slug || `ID: ${project.Project_ID}`})`,
    }));

    return NextResponse.json(options, {
      headers: {
        'Cache-Control': bypassCache
          ? 'no-cache, no-store, must-revalidate'
          : 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch projects',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
