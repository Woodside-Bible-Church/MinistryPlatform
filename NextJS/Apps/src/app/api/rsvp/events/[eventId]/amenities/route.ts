import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import { getUserIdFromSession } from "@/utils/auth";

type EventAmenity = {
  Event_Amenity_ID?: number;
  Event_ID: number;
  Amenity_ID: number;
};

/**
 * GET /api/rsvp/events/[eventId]/amenities
 * Get all amenities for a specific event
 */
export async function GET(
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

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    const tableService = new TableService(mp);

    // Step 1: Get amenity IDs for this event (without join to avoid SQL ambiguity)
    // NOTE: Qualify Amenity_ID with table name to avoid ambiguity with auto-joined tables
    const eventAmenityLinks = await tableService.getTableRecords<{ Event_Amenity_ID: number; Amenity_ID: number }>(
      "Event_Amenities",
      {
        $filter: `Event_ID = ${eventId}`,
        $select: "Event_Amenity_ID, Event_Amenities.Amenity_ID",
      }
    );

    if (eventAmenityLinks.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: Fetch full amenity details for those IDs
    const amenityIds = eventAmenityLinks.map(ea => ea.Amenity_ID);
    const amenities = await tableService.getTableRecords<any>(
      "Amenities",
      {
        $filter: `Amenity_ID IN (${amenityIds.join(',')})`,
        $select: "Amenity_ID, Amenity_Name, Amenity_Description, Icon_Name, Icon_Color, Display_Order",
        $orderby: "Display_Order, Amenity_Name",
      }
    );

    return NextResponse.json(amenities);
  } catch (error) {
    console.error("Error fetching event amenities:", error);
    return NextResponse.json(
      { error: "Failed to fetch event amenities" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rsvp/events/[eventId]/amenities
 * Set amenities for an event (replaces all existing amenities)
 */
export async function PUT(
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

    // Get User_ID for auditing
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amenityIds } = body as { amenityIds: number[] };

    if (!Array.isArray(amenityIds)) {
      return NextResponse.json(
        { error: "amenityIds must be an array" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    const tableService = new TableService(mp);

    // Step 1: Get all existing amenities for this event
    const existing = await tableService.getTableRecords<EventAmenity>(
      "Event_Amenities",
      {
        $filter: `Event_ID = ${eventId}`,
        $select: "Event_Amenity_ID, Event_ID, Amenity_ID",
      }
    );

    const existingIds = existing.map((ea) => ea.Amenity_ID);

    // Step 2: Determine which to add and which to remove
    const toAdd = amenityIds.filter((id) => !existingIds.includes(id));
    const toRemove = existing.filter(
      (ea) => !amenityIds.includes(ea.Amenity_ID)
    );

    // Step 3: Remove amenities that are no longer selected
    if (toRemove.length > 0) {
      const idsToRemove = toRemove.map((ea) => ea.Event_Amenity_ID!);
      await tableService.deleteTableRecords(
        "Event_Amenities",
        idsToRemove,
        { $userId: userId }
      );
      console.log(`Removed ${toRemove.length} amenities from event ${eventId}`);
    }

    // Step 4: Add new amenities
    if (toAdd.length > 0) {
      const newRecords: EventAmenity[] = toAdd.map((amenityId) => ({
        Event_ID: eventId,
        Amenity_ID: amenityId,
      }));

      await tableService.createTableRecords(
        "Event_Amenities",
        newRecords,
        { $userId: userId }
      );
      console.log(`Added ${toAdd.length} amenities to event ${eventId}`);
    }

    return NextResponse.json({
      success: true,
      added: toAdd.length,
      removed: toRemove.length,
    });
  } catch (error) {
    console.error("Error updating event amenities:", error);
    return NextResponse.json(
      { error: "Failed to update event amenities" },
      { status: 500 }
    );
  }
}
