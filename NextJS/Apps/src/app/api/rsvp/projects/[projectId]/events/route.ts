import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";

/**
 * GET /api/rsvp/projects/[projectId]/events
 * Fetch all events for a project, optionally filtered by campus
 * Used for carousel event selection (includes all events, not just RSVP events)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId: id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Get optional campus filter from query params
    const searchParams = request.nextUrl.searchParams;
    const campusId = searchParams.get("campusId");

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Build filter for events
    let filter = `Project_ID=${projectId}`;
    if (campusId) {
      filter += ` AND Congregation_ID=${campusId}`;
    }

    // Fetch all events for this project/campus
    const events = await mp.get("/tables/Events", {
      $select: "Event_ID, Event_Title, Event_Start_Date, Event_End_Date, Congregation_ID, RSVP_Carousel_Name, Include_In_RSVP",
      $filter: filter,
      $orderby: "Event_Start_Date ASC",
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching project events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
