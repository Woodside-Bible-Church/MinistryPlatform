import { NextResponse } from "next/server";
import { getProjectRSVPService } from "@/services/projectRsvpService";
import { UpdateProjectSchema } from "@/providers/MinistryPlatform/entities/ProjectSchema";

/**
 * GET /api/rsvp/projects/[projectId]
 * Get a specific project by ID
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
    const project = await service.getProjectById(id);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rsvp/projects/[projectId]
 * Update a project's RSVP configuration
 */
export async function PATCH(
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

    const body = await request.json();

    // Validate request body
    const validated = UpdateProjectSchema.parse({
      ...body,
      Project_ID: id,
    });

    const service = await getProjectRSVPService();
    const updated = await service.updateProject(validated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating project:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}
