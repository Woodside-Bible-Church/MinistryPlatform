// ===================================================================
// API Route: GET /api/rsvp/projects
// ===================================================================
// Fetches list of available RSVP projects for dev mode dropdown
// Returns array of {value, label} for select dropdown
// ===================================================================

import { NextResponse } from 'next/server';
import { ministryPlatformProvider } from '@/providers/MinistryPlatform/ministryPlatformProvider';

interface ProjectRSVP {
  Project_RSVP_ID: number;
  RSVP_Title: string;
  RSVP_Slug: string | null;
  Is_Active: boolean;
}

export async function GET() {
  try {
    // Get MP provider singleton instance
    const mp = ministryPlatformProvider.getInstance();

    // Fetch all active Project_RSVPs
    const projects = await mp.getTableRecords<ProjectRSVP>('Project_RSVPs', {
      $select: 'Project_RSVP_ID, RSVP_Title, RSVP_Slug, Is_Active',
      $filter: 'Is_Active = 1',
      $orderby: 'RSVP_Title',
    });

    // Transform to dropdown options format
    // Use slug if available, otherwise use numeric ID
    const options = projects.map((project) => ({
      value: project.RSVP_Slug || project.Project_RSVP_ID.toString(),
      label: `${project.RSVP_Title} (${project.RSVP_Slug || `ID: ${project.Project_RSVP_ID}`})`,
    }));

    return NextResponse.json(options, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
