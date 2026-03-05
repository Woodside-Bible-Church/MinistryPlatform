import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkProjectsAppAccess } from "@/lib/mpAuth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { ProjectEvent } from "@/types/projectManagement";

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

    const events = await mp.getTableRecords<ProjectEvent>({
      table: "Events",
      select:
        "Event_ID, Event_Title, Event_Start_Date, Event_End_Date, Congregation_ID_Table.Congregation_Name AS Congregation_Name, Project_ID, Include_Registrations_In_Project_Budgets, Include_In_RSVP",
      filter: `Project_ID=${projectId}`,
      orderBy: "Event_Start_Date DESC",
    });

    return NextResponse.json(events, {
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

export async function PUT(
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
    const eventId = body.Event_ID;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event_ID is required" },
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
      Event_ID: eventId,
    };

    // Link/unlink project
    if (body.action === "unlink") {
      updateData.Project_ID = null;
    } else if (body.action === "link") {
      updateData.Project_ID = projectId;
    }

    // Update toggleable fields if provided
    if (body.Include_Registrations_In_Project_Budgets !== undefined) {
      updateData.Include_Registrations_In_Project_Budgets =
        body.Include_Registrations_In_Project_Budgets;
    }
    if (body.Include_In_RSVP !== undefined) {
      updateData.Include_In_RSVP = body.Include_In_RSVP;
    }

    const updated = await mp.updateTableRecords(
      "Events",
      [updateData],
      {
        $userId: userId,
        $select:
          "Event_ID, Event_Title, Project_ID, Include_Registrations_In_Project_Budgets, Include_In_RSVP",
      }
    );

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Event not found or update failed" },
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
