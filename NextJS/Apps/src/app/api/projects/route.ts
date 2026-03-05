import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkProjectsAppAccess } from "@/lib/mpAuth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { ProjectRecord } from "@/types/projectManagement";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess } = await checkProjectsAppAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden: You do not have access to the Projects app" },
        { status: 403 }
      );
    }

    const mp = new MPHelper();

    const projects = await mp.getTableRecords<ProjectRecord>({
      table: "Projects",
      select:
        "Project_ID, Project_Title, Project_Coordinator, Project_Coordinator_Table.Display_Name AS Coordinator_Name, Project_Start, Project_End, Project_Approved, Projects.Project_Type_ID, Project_Type_ID_Table.Project_Type AS Project_Type_Name, Slug, Budgets_Enabled, Budget_Status_ID, Budget_Locked, Expected_Registration_Revenue, Expected_Discounts_Budget, RSVP_Title, RSVP_Description, RSVP_URL, RSVP_Start_Date, RSVP_End_Date, RSVP_Is_Active, RSVP_Slug, RSVP_Confirmation_Email_Template_ID, RSVP_Reminder_Email_Template_ID, RSVP_Days_To_Remind, RSVP_Primary_Color, RSVP_Secondary_Color, RSVP_Accent_Color, RSVP_Background_Color",
      orderBy: "Project_Start DESC",
    });

    return NextResponse.json(projects, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, canEdit } = await checkProjectsAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to create projects" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const mp = new MPHelper();

    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      select: "User_ID",
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].User_ID;

    const created = await mp.createTableRecords(
      "Projects",
      [
        {
          Project_Title: body.Project_Title,
          Project_Coordinator: body.Project_Coordinator,
          Project_Start: body.Project_Start,
          Project_End: body.Project_End,
          Project_Approved: body.Project_Approved ?? false,
          Project_Type_ID: body.Project_Type_ID,
          Slug: body.Slug,
        },
      ],
      {
        $userId: userId,
        $select:
          "Project_ID, Project_Title, Project_Coordinator, Project_Start, Project_End, Project_Approved, Project_Type_ID, Slug",
      }
    );

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, canEdit } = await checkProjectsAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit projects" },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.Project_ID) {
      return NextResponse.json(
        { error: "Project_ID is required" },
        { status: 400 }
      );
    }

    const mp = new MPHelper();

    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      select: "User_ID",
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].User_ID;

    const updateData: Record<string, unknown> = {
      Project_ID: body.Project_ID,
    };

    const allowedFields = [
      "Project_Title", "Project_Coordinator", "Project_Start", "Project_End",
      "Project_Approved", "Project_Type_ID", "Slug",
      "Budgets_Enabled", "Budget_Status_ID", "Budget_Locked",
      "Expected_Registration_Revenue", "Expected_Discounts_Budget",
      "RSVP_Title", "RSVP_Description", "RSVP_URL", "RSVP_Start_Date",
      "RSVP_End_Date", "RSVP_Is_Active", "RSVP_Slug",
      "RSVP_Confirmation_Email_Template_ID", "RSVP_Reminder_Email_Template_ID",
      "RSVP_Days_To_Remind",
      "RSVP_Primary_Color", "RSVP_Secondary_Color",
      "RSVP_Accent_Color", "RSVP_Background_Color",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updated = await mp.updateTableRecords("Projects", [updateData], {
      $userId: userId,
      $select:
        "Project_ID, Project_Title, Project_Coordinator, Project_Start, Project_End, Project_Approved, Project_Type_ID, Slug, Budgets_Enabled, Budget_Status_ID, Budget_Locked, Expected_Registration_Revenue, Expected_Discounts_Budget, RSVP_Title, RSVP_Description, RSVP_URL, RSVP_Start_Date, RSVP_End_Date, RSVP_Is_Active, RSVP_Slug, RSVP_Primary_Color, RSVP_Secondary_Color, RSVP_Accent_Color, RSVP_Background_Color",
    });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Project not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, canDelete } = await checkProjectsAppAccess();
    if (!hasAccess || !canDelete) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete projects" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const mp = new MPHelper();

    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      select: "User_ID",
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].User_ID;

    await mp.deleteTableRecords("Projects", [parseInt(projectId, 10)], {
      $userId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
