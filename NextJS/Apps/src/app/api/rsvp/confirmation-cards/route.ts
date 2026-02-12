import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { checkRsvpAppAccess } from "@/lib/mpAuth";
import { getUserIdFromSession } from "@/utils/auth";

/**
 * POST /api/rsvp/confirmation-cards
 * Create a new confirmation card with default configuration
 *
 * Expected body:
 * {
 *   "projectId": 123,
 *   "congregationId": 456
 * }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { projectId, congregationId } = body;

    if (!projectId || !congregationId) {
      return NextResponse.json(
        { error: "projectId and congregationId are required" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Get existing cards to calculate next Display_Order
    const existingCards = await mp.get<Array<{ Project_Confirmation_Card_ID: number; Display_Order: number }>>(
      "/tables/Project_Confirmation_Cards",
      {
        $filter: `Project_ID = ${projectId} AND (Congregation_ID = ${congregationId} OR Congregation_ID IS NULL)`,
        $select: "Project_Confirmation_Card_ID, Display_Order",
        $orderby: "Display_Order DESC",
        $top: "1",
      }
    );

    const nextDisplayOrder =
      existingCards && existingCards.length > 0
        ? (existingCards[0].Display_Order || 0) + 1
        : 1;

    // Create the confirmation card with default config
    const defaultConfig = JSON.stringify({
      title: "What to Expect",
      bullets: [],
    });

    const result = await mp.post<Array<{ Project_Confirmation_Card_ID: number }>>(
      "/tables/Project_Confirmation_Cards",
      [
        {
          Project_ID: projectId,
          Card_Type_ID: 1,
          Display_Order: nextDisplayOrder,
          Congregation_ID: congregationId,
          Card_Configuration: defaultConfig,
        },
      ],
      { $userId: userId }
    );

    const cardId = result?.[0]?.Project_Confirmation_Card_ID;

    console.log(`Successfully created confirmation card ${cardId} for project ${projectId}, campus ${congregationId}`);

    return NextResponse.json({ success: true, cardId }, { status: 201 });
  } catch (error) {
    console.error("Error creating confirmation card:", error);
    return NextResponse.json(
      { error: "Failed to create confirmation card" },
      { status: 500 }
    );
  }
}
