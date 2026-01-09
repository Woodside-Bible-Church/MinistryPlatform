import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnnouncementsService } from "@/services/announcementsService";

// GET /api/announcements/events?q=search - Search events for dropdown
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
    const query = searchParams.get("q") || "";

    const service = new AnnouncementsService();
    const events = await service.searchEvents(query);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error searching events:", error);
    return NextResponse.json(
      { error: "Failed to search events" },
      { status: 500 }
    );
  }
}
