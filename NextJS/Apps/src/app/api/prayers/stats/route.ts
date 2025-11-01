import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrayerService } from "@/services/prayerService";
import { UserService } from "@/services/userService";

// GET /api/prayers/stats - Get user prayer statistics
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

    // Get user prayer stats
    const stats = await prayerService.getUserPrayerStats(contactId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching prayer stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch prayer stats" },
      { status: 500 }
    );
  }
}
