import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkProjectsAppAccess } from "@/lib/mpAuth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { ProjectCampus } from "@/types/projectManagement";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess } = await checkProjectsAppAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const mp = new MPHelper();

    const campuses = await mp.getTableRecords<ProjectCampus>({
      table: "Project_Campuses",
      select:
        "Project_Campus_ID, Project_ID, Project_Campuses.Congregation_ID, Congregation_ID_Table.Congregation_Name AS Campus_Name, Is_Active, Display_Order",
      filter: `Project_ID=${projectId}`,
      orderBy: "Display_Order",
    });

    return NextResponse.json(campuses, {
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, canEdit } = await checkProjectsAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
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
      "Project_Campuses",
      [
        {
          Project_ID: projectId,
          Congregation_ID: body.Congregation_ID,
          Is_Active: body.Is_Active ?? true,
          Display_Order: body.Display_Order || null,
        },
      ],
      {
        $userId: userId,
        $select:
          "Project_Campus_ID, Project_ID, Congregation_ID, Is_Active, Display_Order",
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess, canDelete } = await checkProjectsAppAccess();
    if (!hasAccess || !canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await params; // consume params to avoid Next.js warning

    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get("campusId");

    if (!campusId) {
      return NextResponse.json(
        { error: "campusId query parameter is required" },
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

    await mp.deleteTableRecords(
      "Project_Campuses",
      [parseInt(campusId, 10)],
      { $userId: userId }
    );

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
