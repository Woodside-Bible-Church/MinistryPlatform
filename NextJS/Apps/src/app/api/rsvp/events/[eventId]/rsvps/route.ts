import { NextResponse } from "next/server";
import { getRSVPService } from "@/services/rsvpService";

/**
 * GET /api/rsvp/events/[eventId]/rsvps
 * Get all RSVPs for a specific event
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const id = parseInt(eventId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const service = await getRSVPService();
    const rsvps = await service.getRSVPsForEvent(id);

    return NextResponse.json(rsvps);
  } catch (error) {
    console.error("Error fetching RSVPs:", error);
    return NextResponse.json(
      { error: "Failed to fetch RSVPs" },
      { status: 500 }
    );
  }
}
