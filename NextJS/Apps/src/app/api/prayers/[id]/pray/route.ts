import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrayerService } from "@/services/prayerService";
import { UserService } from "@/services/userService";

// POST /api/prayers/[id]/pray - Record that user prayed for this prayer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const feedbackEntryId = parseInt(id);

    if (isNaN(feedbackEntryId)) {
      return NextResponse.json(
        { error: "Invalid prayer ID" },
        { status: 400 }
      );
    }

    // Get optional encouraging message from request body
    const body = await request.json().catch(() => ({}));
    const { message } = body;

    // Get user's Contact_ID
    const userService = await UserService.getInstance();
    const userProfile = await userService.getUserProfile(session.user.id);
    const contactId = userProfile.Contact_ID;

    const prayerService = new PrayerService(session.accessToken);

    // Record the prayer
    await prayerService.recordPrayer({
      Feedback_Entry_ID: feedbackEntryId,
      Contact_ID: contactId,
      Response_Type_ID: 1, // 1 = Prayed
      Response_Date: new Date().toISOString(),
      Response_Text: message || null,
    });

    // Get updated prayer count
    const prayerCount = await prayerService.getPrayerCount(feedbackEntryId);

    return NextResponse.json({
      success: true,
      prayerCount,
    });
  } catch (error) {
    console.error("Error recording prayer:", error);
    return NextResponse.json(
      { error: "Failed to record prayer" },
      { status: 500 }
    );
  }
}
