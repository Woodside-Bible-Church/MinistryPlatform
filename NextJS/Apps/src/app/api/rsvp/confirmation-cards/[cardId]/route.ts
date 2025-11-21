import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";

/**
 * PATCH /api/rsvp/confirmation-cards/[cardId]
 * Update confirmation card configuration
 *
 * Expected body:
 * {
 *   "title": "What to Expect",
 *   "bullets": [
 *     {"icon": "Clock", "text": "Arrive early to find parking"},
 *     {"icon": "Baby", "text": "Kids programming available"}
 *   ]
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId: id } = await params;
    const cardId = parseInt(id, 10);

    if (isNaN(cardId)) {
      return NextResponse.json(
        { error: "Invalid card ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, bullets } = body;

    if (!title && !bullets) {
      return NextResponse.json(
        { error: "No configuration provided" },
        { status: 400 }
      );
    }

    // Build configuration object
    const configuration: { title?: string; bullets?: Array<{ icon?: string; text?: string }> } = {};

    if (title) {
      configuration.title = title;
    }

    if (bullets && Array.isArray(bullets)) {
      configuration.bullets = bullets;
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Update the confirmation card - MUST include primary key
    await mp.put(`/tables/Project_Confirmation_Cards`, [
      {
        Project_Confirmation_Card_ID: cardId,
        Card_Configuration: JSON.stringify(configuration)
      }
    ]);

    console.log(`Successfully updated confirmation card ${cardId}:`, configuration);

    return NextResponse.json({ success: true, configuration });
  } catch (error) {
    console.error("Error updating confirmation card:", error);
    return NextResponse.json(
      { error: "Failed to update confirmation card" },
      { status: 500 }
    );
  }
}
