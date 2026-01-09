import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnnouncementsService } from "@/services/announcementsService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { AnnouncementFormData } from "@/types/announcements";

// GET /api/announcements - List announcements with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get("active");
    const congregationID = searchParams.get("congregationID");
    const search = searchParams.get("search");

    const service = new AnnouncementsService();

    const announcements = await service.getAnnouncements({
      active: active ? active === "true" : undefined,
      congregationID: congregationID ? parseInt(congregationID) : undefined,
      search: search || undefined,
    });

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST /api/announcements - Create new announcement
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
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
    const newAnnouncement = await service.createAnnouncement(body, userId);

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
