import { NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";

type Amenity = {
  Amenity_ID: number;
  Amenity_Name: string;
  Amenity_Description: string | null;
  Icon_Name: string | null;
  Icon_Color: string | null;
  Display_Order: number;
};

/**
 * GET /api/rsvp/amenities
 * Get all available amenities for events
 */
export async function GET() {
  try {
    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Fetch all amenities from the Amenities table
    const amenities = await mp.get<Amenity[]>("/tables/Amenities", {
      $select: "Amenity_ID, Amenity_Name, Amenity_Description, Icon_Name, Icon_Color, Display_Order",
      $orderby: "Display_Order, Amenity_Name",
    });

    return NextResponse.json(amenities);
  } catch (error) {
    console.error("Error fetching amenities:", error);
    return NextResponse.json(
      { error: "Failed to fetch amenities" },
      { status: 500 }
    );
  }
}
