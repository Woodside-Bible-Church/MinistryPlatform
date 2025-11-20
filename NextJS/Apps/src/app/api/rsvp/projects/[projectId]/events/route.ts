import { NextResponse } from "next/server";
import { getProjectRSVPService } from "@/services/projectRsvpService";

/**
 * GET /api/rsvp/projects/[projectId]/events
 * Get all events for a project with RSVP statistics
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const id = parseInt(projectId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const service = await getProjectRSVPService();
    const events = await service.getProjectEvents(id);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching project events:", error);
    return NextResponse.json(
      { error: "Failed to fetch project events" },
      { status: 500 }
    );
  }
}
