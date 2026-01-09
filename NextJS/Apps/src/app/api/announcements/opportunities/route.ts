import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { AnnouncementsService } from "@/services/announcementsService";

// GET /api/announcements/opportunities?q=search - Search opportunities for dropdown
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
    const opportunities = await service.searchOpportunities(query);

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Error searching opportunities:", error);
    return NextResponse.json(
      { error: "Failed to search opportunities" },
      { status: 500 }
    );
  }
}
