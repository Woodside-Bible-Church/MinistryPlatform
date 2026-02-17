import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnnouncementsService } from "@/services/announcementsService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

// POST /api/announcements/reorder - Bulk update sort order
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { updates, field = 'sort' } = body as {
      updates: Array<{ id: number; sort: number }>;
      field?: 'sort' | 'carouselSort';
    };

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
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
    if (field === 'carouselSort') {
      await service.bulkUpdateCarouselSortOrder(updates, userId);
    } else {
      await service.bulkUpdateSortOrder(updates, userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering announcements:", error);
    return NextResponse.json(
      { error: "Failed to reorder announcements" },
      { status: 500 }
    );
  }
}
