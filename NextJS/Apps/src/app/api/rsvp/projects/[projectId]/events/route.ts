import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";

/**
 * GET /api/rsvp/projects/[projectId]/events
 * Fetch all events AND opportunities for a project, optionally filtered by campus
 * Used for carousel event/opportunity selection
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

    const searchParams = request.nextUrl.searchParams;
    const campusId = searchParams.get("campusId");

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Fetch events for this project/campus
    let eventFilter = `Project_ID=${projectId}`;
    if (campusId) {
      eventFilter += ` AND Congregation_ID=${campusId}`;
    }

    const eventsPromise = mp.get("/tables/Events", {
      $select: "Event_ID, Event_Title, Event_Start_Date, Event_End_Date, Congregation_ID, RSVP_Carousel_Name, Include_In_RSVP",
      $filter: eventFilter,
      $orderby: "Event_Start_Date ASC",
    });

    // Fetch opportunities for this project
    // Opportunities get campus via Program_ID -> Programs.Congregation_ID
    let oppFilter = `Project_ID=${projectId}`;
    if (campusId) {
      oppFilter += ` AND Program_ID_Table.Congregation_ID=${campusId}`;
    }

    const opportunitiesPromise = mp.get("/tables/Opportunities", {
      $select: "Opportunity_ID, Opportunity_Title, Program_ID_Table.Congregation_ID, RSVP_Carousel_Name",
      $filter: oppFilter,
      $orderby: "Opportunity_Title ASC",
    });

    const [events, opportunities] = await Promise.all([eventsPromise, opportunitiesPromise]) as [any[], any[]];

    // Normalize into a combined list with Item_Type
    const normalizedEvents = (events || []).map((e: any) => ({
      Item_Type: "Event" as const,
      Event_ID: e.Event_ID,
      Opportunity_ID: null,
      Event_Title: e.Event_Title,
      Event_Start_Date: e.Event_Start_Date,
      Congregation_ID: e.Congregation_ID,
      RSVP_Carousel_Name: e.RSVP_Carousel_Name,
      Include_In_RSVP: e.Include_In_RSVP,
    }));

    const normalizedOpportunities = (opportunities || []).map((o: any) => ({
      Item_Type: "Opportunity" as const,
      Event_ID: null,
      Opportunity_ID: o.Opportunity_ID,
      Event_Title: o.Opportunity_Title,
      Event_Start_Date: null,
      Congregation_ID: o.Congregation_ID,
      RSVP_Carousel_Name: o.RSVP_Carousel_Name,
      Include_In_RSVP: false,
    }));

    return NextResponse.json([...normalizedEvents, ...normalizedOpportunities]);
  } catch (error) {
    console.error("Error fetching project events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
