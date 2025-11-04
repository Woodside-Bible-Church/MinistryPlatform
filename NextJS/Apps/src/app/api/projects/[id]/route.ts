import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProjectsService } from "@/services/projectsService";
import { Project } from "@/types/projects";

// GET /api/projects/[id] - Get a single project with nested budgets and expenses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userName = session.user?.email;
    if (!userName) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const projectsService = new ProjectsService();

    // Use stored procedure to get project with nested budgets and expenses
    // Security is handled within the stored procedure
    const projects = await projectsService.getProjectsWithNested(userName, 1, projectId);

    if (!projects || projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(projects[0]);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}
