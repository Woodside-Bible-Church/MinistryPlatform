import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();

    // Get User_ID for audit logging
    const mp = new MPHelper();
    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: 'dp_Users',
      select: 'User_ID',
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = users[0].User_ID;

    // Build update object with only the fields provided
    const updateData: any = {
      Project_ID: projectId,
    };

    // Add fields from body if present
    if (body.Expected_Registration_Revenue !== undefined) {
      updateData.Expected_Registration_Revenue = body.Expected_Registration_Revenue;
    }
    if (body.Expected_Discounts_Budget !== undefined) {
      updateData.Expected_Discounts_Budget = body.Expected_Discounts_Budget;
    }

    // Update the project record
    const updatedProjects = await mp.updateTableRecords(
      'Projects',
      [updateData],
      {
        $userId: userId,
        $select: 'Project_ID,Expected_Registration_Revenue,Expected_Discounts_Budget',
      }
    );

    if (updatedProjects.length === 0) {
      return NextResponse.json(
        { error: "Project not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProjects[0]);
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
