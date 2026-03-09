import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { getUserIdFromSession } from "@/utils/auth";
import { checkRsvpAppAccess } from "@/lib/mpAuth";

/**
 * PATCH /api/rsvp/opportunities/[opportunityId]
 * Update opportunity fields (RSVP_Carousel_Name)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ opportunityId: string }> }
) {
  try {
    const { hasAccess, canEdit } = await checkRsvpAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to edit in the RSVP app" },
        { status: 403 }
      );
    }

    const { opportunityId: id } = await params;
    const opportunityId = parseInt(id, 10);

    if (isNaN(opportunityId)) {
      return NextResponse.json(
        { error: "Invalid opportunity ID" },
        { status: 400 }
      );
    }

    const userId = await getUserIdFromSession();

    const body = await request.json();
    const { RSVP_Carousel_Name } = body;

    const updatePayload: Record<string, any> = {
      Opportunity_ID: opportunityId,
    };

    if (RSVP_Carousel_Name !== undefined) {
      updatePayload.RSVP_Carousel_Name = RSVP_Carousel_Name;
    }

    if (Object.keys(updatePayload).length === 1) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    const queryParams = userId ? { $userID: userId } : {};
    await mp.put(`/tables/Opportunities`, [updatePayload], queryParams);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating opportunity:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}
