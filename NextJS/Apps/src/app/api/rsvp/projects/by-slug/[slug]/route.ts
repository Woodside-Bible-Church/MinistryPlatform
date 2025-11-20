import { NextResponse } from "next/server";
import { getProjectRSVPService } from "@/services/projectRsvpService";

/**
 * GET /api/rsvp/projects/by-slug/[slug]
 * Get a single RSVP project by slug
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug is required" },
        { status: 400 }
      );
    }

    const service = await getProjectRSVPService();
    const project = await service.getProjectBySlug(slug);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project by slug:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
