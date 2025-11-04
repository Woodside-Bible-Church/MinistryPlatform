import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProjectsService } from "@/services/projectsService";
import { CreateProjectInput, Project } from "@/types/projects";

// GET /api/projects - List all projects with nested budgets and expenses
export async function GET(request: NextRequest) {
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

    // Use stored procedure to get projects with nested data efficiently
    // Admin status is checked within the stored procedure for security
    const projectsService = new ProjectsService();
    const projects = await projectsService.getProjectsWithNested(userName);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session as any).roles?.includes("Administrators") ?? false;
    const userContactId = session.contactId;

    if (!userContactId) {
      return NextResponse.json(
        { error: "User contact ID not found" },
        { status: 400 }
      );
    }

    const body: CreateProjectInput = await request.json();

    // Validate dates
    const startDate = new Date(body.Project_Start);
    const endDate = new Date(body.Project_End);
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create project with current user as coordinator
    const projectData = {
      Project_Title: body.Project_Title,
      Project_Coordinator: parseInt(userContactId),
      Project_Start: body.Project_Start,
      Project_End: body.Project_End,
      Project_Group: body.Project_Group || undefined,
      // Only admins can mark as approved on creation
      Project_Approved: isAdmin ? body.Project_Approved : false,
    };

    const projectsService = new ProjectsService();
    const newProjectId = await projectsService.createProject(projectData);

    // Fetch the created project with related data
    const project = await projectsService.getProjectById(newProjectId);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
