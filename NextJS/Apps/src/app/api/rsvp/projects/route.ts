import { NextResponse } from "next/server";
import { getProjectRSVPService } from "@/services/projectRsvpService";

/**
 * GET /api/rsvp/projects
 * Get all active RSVP projects
 */
export async function GET() {
  try {
    const service = await getProjectRSVPService();
    const projects = await service.getActiveRSVPProjects();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching RSVP projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVP projects" },
      { status: 500 }
    );
  }
}
