import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnnouncementsService } from "@/services/announcementsService";

// GET /api/announcements/congregations - Get congregations for dropdown
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const service = new AnnouncementsService();
    const congregations = await service.getCongregations();

    return NextResponse.json(congregations);
  } catch (error) {
    console.error("Error fetching congregations:", error);
    return NextResponse.json(
      { error: "Failed to fetch congregations" },
      { status: 500 }
    );
  }
}
