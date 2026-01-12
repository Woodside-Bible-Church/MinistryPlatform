import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnnouncementsService } from "@/services/announcementsService";
import { checkAnnouncementsPermissions } from "@/lib/announcementsPermissions";

/**
 * GET /api/announcements/labels
 * Get all application labels for the announcements widget
 * Only accessible by IT Team Group and Communications
 */
export async function GET() {
  const session = await auth();

  console.log("Labels API - Session:", {
    hasSession: !!session,
    hasAccessToken: !!session?.accessToken,
  });

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permissions
  const permissions = checkAnnouncementsPermissions(session);
  if (!permissions.canEditLabels) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to view labels" },
      { status: 403 }
    );
  }

  try {
    const service = new AnnouncementsService(session.accessToken);
    const labels = await service.getApplicationLabels();

    return NextResponse.json(labels);
  } catch (error) {
    console.error("Error fetching application labels:", error);
    return NextResponse.json(
      { error: "Failed to fetch application labels" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/announcements/labels
 * Update an application label
 * Only accessible by IT Team Group and Communications
 */
export async function PUT(request: NextRequest) {
  const session = await auth();

  if (!session?.userId || !session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permissions
  const permissions = checkAnnouncementsPermissions(session);
  if (!permissions.canEditLabels) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to edit labels" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, english } = body;

    if (!id || !english) {
      return NextResponse.json(
        { error: "ID and English text are required" },
        { status: 400 }
      );
    }

    const service = new AnnouncementsService(session.accessToken);
    await service.updateApplicationLabel(
      id,
      english,
      parseInt(session.userId)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating application label:", error);
    return NextResponse.json(
      { error: "Failed to update application label" },
      { status: 500 }
    );
  }
}
