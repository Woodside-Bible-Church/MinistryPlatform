import { NextResponse } from "next/server";
import { getProjectRSVPService } from "@/services/projectRsvpService";

/**
 * GET /api/rsvp/projects/[projectId]/rsvps
 * Get all RSVP submissions for a project
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
    const rsvps = await service.getProjectRSVPs(id);

    return NextResponse.json(rsvps);
  } catch (error) {
    console.error("Error fetching project RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}
