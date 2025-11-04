import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProjectsService } from "@/services/projectsService";
import { ProjectBudget, CreateProjectBudgetInput } from "@/types/projects";

// GET /api/projects/[id]/budgets - Get all budgets for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const projectsService = new ProjectsService();
    const budgets = await projectsService.getProjectBudgets(projectId);

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/budgets - Create a new budget category
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    const body: CreateProjectBudgetInput = await request.json();
    const projectsService = new ProjectsService();

    // TODO: Add proper permission checks later
    // For now, allow all authenticated users to create budgets

    // Create budget
    const budgetData: Omit<CreateProjectBudgetInput, "Project_Budget_ID"> = {
      Project_ID: projectId,
      Project_Category_Type_ID: body.Project_Category_Type_ID,
      Budget_Name: body.Budget_Name,
      Budget_Amount: body.Budget_Amount,
    };

    const newBudgetId = await projectsService.createProjectBudget(budgetData);

    // Return success with the new budget ID
    return NextResponse.json({ Project_Budget_ID: newBudgetId, ...budgetData }, { status: 201 });
  } catch (error) {
    console.error("Error creating budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}
