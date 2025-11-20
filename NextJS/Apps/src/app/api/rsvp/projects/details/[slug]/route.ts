import { NextRequest, NextResponse } from "next/server";
import { getProjectRSVPService } from "@/services/projectRsvpService";

/**
 * GET /api/rsvp/projects/details/[slug]
 * Fetch complete project details including events and RSVPs using stored procedure
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const service = await getProjectRSVPService();
    const details = await service.getProjectDetails(slug);

    if (!details) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(details);
  } catch (error) {
    console.error("Error fetching project details:", error);
    return NextResponse.json(
      { error: "Failed to fetch project details" },
      { status: 500 }
    );
  }
}
