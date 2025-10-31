import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CounterService } from "@/services/counterService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const congregationId = searchParams.get("congregationId");

    if (!date || !congregationId) {
      return NextResponse.json(
        { error: "Missing required parameters: date and congregationId" },
        { status: 400 }
      );
    }

    const counterService = new CounterService(session.accessToken);

    // Fetch all events with Event_Type_ID 28 or 29
    const allEvents = await counterService.getEvents(date, parseInt(congregationId));

    // Fetch programs with Ministry_ID = 127
    const programs = await counterService.getProgramsByMinistryId(127);
    const validProgramIds = new Set(programs.map(p => p.Program_ID));

    // Filter events to only include those with valid Program_IDs
    const filteredEvents = allEvents.filter(event =>
      event.Program_ID && validProgramIds.has(event.Program_ID)
    );

    return NextResponse.json(filteredEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
