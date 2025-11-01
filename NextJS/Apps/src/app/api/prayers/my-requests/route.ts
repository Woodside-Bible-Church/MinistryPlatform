import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrayerService } from "@/services/prayerService";
import { UserService } from "@/services/userService";

// GET /api/prayers/my-requests - Get current user's submitted prayers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's Contact_ID
    const userService = await UserService.getInstance();
    const userProfile = await userService.getUserProfile(session.user.id);
    const contactId = userProfile.Contact_ID;

    const prayerService = new PrayerService(session.accessToken);

    // Get user's prayers
    const prayers = await prayerService.getPrayersByContactId(contactId);

    // Get prayer counts for all prayers
    const prayerIds = prayers.map(p => p.Feedback_Entry_ID);
    const countsMap = await prayerService.getPrayerCounts(prayerIds);

    // Transform to simpler format for frontend with counts
    const transformedPrayers = prayers.map((prayer) => ({
      id: prayer.Feedback_Entry_ID,
      title: prayer.Entry_Title || "Prayer Request",
      description: prayer.Description,
      dateSubmitted: prayer.Date_Submitted,
      approved: prayer.Approved,
      ongoing: prayer.Ongoing_Need,
      categoryId: prayer.Feedback_Type_ID,
      prayerCount: countsMap.get(prayer.Feedback_Entry_ID) || 0,
    }));

    return NextResponse.json(transformedPrayers);
  } catch (error) {
    console.error("Error fetching my prayers:", error);
    return NextResponse.json(
      { error: "Failed to fetch my prayers" },
      { status: 500 }
    );
  }
}
