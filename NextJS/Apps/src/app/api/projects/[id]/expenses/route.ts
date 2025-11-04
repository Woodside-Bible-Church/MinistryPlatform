import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProjectsService } from "@/services/projectsService";
import { ProjectExpense, CreateProjectExpenseInput } from "@/types/projects";

// GET /api/projects/[id]/expenses - Get all expenses for a project
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
    const expenses = await projectsService.getProjectExpenses(projectId);

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/expenses - Create a new expense
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
    const userContactId = session.user?.contact_id;

    if (!userContactId) {
      return NextResponse.json(
        { error: "User contact ID not found" },
        { status: 400 }
      );
    }

    const body: CreateProjectExpenseInput = await request.json();
    const projectsService = new ProjectsService();

    // Verify user has permission to add expenses to this project
    const isAdmin = session.user?.security_role === "Admin";
    const project = await projectsService.getProjectById(projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isCoordinator = project.Project_Coordinator_ID === userContactId;

    if (!isAdmin && !isCoordinator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create expense with current user as requester
    const expenseData: Omit<CreateProjectExpenseInput, "Project_Expense_ID"> = {
      Project_ID: projectId,
      Project_Budget_ID: body.Project_Budget_ID,
      Expense_Title: body.Expense_Title,
      Requested_By_Contact_ID: userContactId,
      Paid_To: body.Paid_To,
      Expense_Date: body.Expense_Date,
      Expense_Amount: body.Expense_Amount,
      // Only admins can mark as approved on creation
      Expense_Approved: isAdmin ? body.Expense_Approved : false,
      ...(body.Event_ID && { Event_ID: body.Event_ID }),
    };

    const newExpenseId = await projectsService.createProjectExpense(expenseData);

    // Fetch the created expense with related data
    const expenses = await projectsService.getProjectExpenses(projectId);
    const expense = expenses.find(e => e.Project_Expense_ID === Number(newExpenseId));

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
