import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { getUserIdFromSession } from "@/utils/auth";

/**
 * PATCH /api/rsvp/events/[eventId]
 * Update event fields (Meeting_Instructions, RSVP_Capacity, RSVP_Capacity_Modifier, RSVP_Carousel_Name)
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

    // Get User_ID for auditing (optional for now to avoid breaking existing functionality)
    const userId = await getUserIdFromSession();
    console.log(`PATCH /api/rsvp/events/${eventId} - User_ID for auditing:`, userId);

    if (!userId) {
      console.warn(`Event update without user session - Event ID: ${eventId}`);
    }

    const body = await request.json();
    const { Meeting_Instructions, RSVP_Capacity, RSVP_Capacity_Modifier, RSVP_Carousel_Name } = body;

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

    if (RSVP_Carousel_Name !== undefined) {
      updatePayload.RSVP_Carousel_Name = RSVP_Carousel_Name;
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
    // Pass $userID for MP auditing
    const queryParams = userId ? { $userID: userId } : {};
    console.log(`Calling MP API with queryParams:`, queryParams);
    console.log(`Update payload:`, updatePayload);

    await mp.put(`/tables/Events`, [updatePayload], queryParams);

    console.log(`Successfully updated event ${eventId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
