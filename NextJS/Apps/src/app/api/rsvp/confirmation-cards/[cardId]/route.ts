import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { checkRsvpAppAccess } from "@/lib/mpAuth";
import { getUserIdFromSession } from "@/utils/auth";

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
    // Check if user has permission to edit
    const { hasAccess, canEdit } = await checkRsvpAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to edit in the RSVP app" },
        { status: 403 }
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
    ], { $userId: userId });

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
