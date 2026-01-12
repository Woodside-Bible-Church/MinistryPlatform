import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnnouncementsService } from "@/services/announcementsService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { AnnouncementFormData } from "@/types/announcements";
import { checkAnnouncementsPermissions } from "@/lib/announcementsPermissions";

// GET /api/announcements/[id] - Get single announcement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    const service = new AnnouncementsService();
    const announcement = await service.getAnnouncementById(id);

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Error fetching announcement:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

// PUT /api/announcements/[id] - Update announcement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    const body: AnnouncementFormData = await request.json();

    // Validate required fields
    if (!body.title || !body.startDate || !body.endDate || !body.congregationID) {
      return NextResponse.json(
        { error: "Missing required fields: title, startDate, endDate, congregationID" },
        { status: 400 }
      );
    }

    // Check permissions for church-wide announcements
    const permissions = checkAnnouncementsPermissions(session);
    if (body.congregationID === 1 && !permissions.canEditChurchWide) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to edit church-wide announcements" },
        { status: 403 }
      );
    }

    // Validate mutually exclusive relationship
    if (body.eventID && body.opportunityID) {
      return NextResponse.json(
        { error: "Cannot select both Event and Opportunity" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (endDate < startDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

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

    const service = new AnnouncementsService();
    await service.updateAnnouncement(id, body, userId);

    // Fetch and return updated announcement
    const updated = await service.getAnnouncementById(id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE /api/announcements/[id] - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid announcement ID" },
        { status: 400 }
      );
    }

    // Fetch the announcement to check its congregation
    const service = new AnnouncementsService();
    const existingAnnouncement = await service.getAnnouncementById(id);

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    // Check permissions for church-wide announcements
    const permissions = checkAnnouncementsPermissions(session);
    if (existingAnnouncement.CongregationID === 1 && !permissions.canDeleteChurchWide) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to delete church-wide announcements" },
        { status: 403 }
      );
    }

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

    await service.deleteAnnouncement(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
