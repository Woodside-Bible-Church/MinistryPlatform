import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";

/**
 * PATCH /api/rsvp/events/[eventId]
 * Update event fields (Meeting_Instructions, RSVP_Capacity, RSVP_Capacity_Modifier)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId: id } = await params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { Meeting_Instructions, RSVP_Capacity, RSVP_Capacity_Modifier } = body;

    // Build update payload with only provided fields
    // MUST include the Event_ID (primary key) in the payload
    const updatePayload: Record<string, any> = {
      Event_ID: eventId
    };

    if (Meeting_Instructions !== undefined) {
      updatePayload.Meeting_Instructions = Meeting_Instructions;
    }

    if (RSVP_Capacity !== undefined) {
      updatePayload.RSVP_Capacity = RSVP_Capacity;
    }

    if (RSVP_Capacity_Modifier !== undefined) {
      updatePayload.RSVP_Capacity_Modifier = RSVP_Capacity_Modifier;
    }

    if (Object.keys(updatePayload).length === 1) {
      // Only Event_ID, no actual fields to update
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Update the event - MinistryPlatform expects an array with primary key included
    await mp.put(`/tables/Events`, [updatePayload]);

    console.log(`Successfully updated event ${eventId}:`, updatePayload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
