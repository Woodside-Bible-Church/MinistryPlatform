import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrayerService } from "@/services/prayerService";
import { UserService } from "@/services/userService";

// GET /api/prayers - List prayers
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Allow unauthenticated access to view approved prayers
    // If authenticated, user can see their own unapproved prayers too

    // Use service account token for public prayer viewing
    // or user token if authenticated
    const token = session?.accessToken || process.env.MINISTRY_PLATFORM_SERVICE_ACCOUNT_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token available" },
        { status: 500 }
      );
    }

    const prayerService = new PrayerService(token);

    // Get prayers with prayer counts
    const prayers = await prayerService.getPrayersWithCounts();

    // Transform to simpler format for frontend
    const transformedPrayers = prayers.map((prayer) => ({
      id: prayer.Feedback_Entry_ID,
      title: prayer.Entry_Title || "Prayer Request",
      description: prayer.Description,
      dateSubmitted: prayer.Date_Submitted,
      approved: prayer.Approved,
      ongoing: prayer.Ongoing_Need,
      categoryId: prayer.Feedback_Type_ID,
      prayerCount: prayer.Prayer_Count || 0,
    }));

    return NextResponse.json(transformedPrayers);
  } catch (error) {
    console.error("Error fetching prayers:", error);
    return NextResponse.json(
      { error: "Failed to fetch prayers" },
      { status: 500 }
    );
  }
}

// POST /api/prayers - Create new prayer
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, categoryId, ongoing } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const prayerService = new PrayerService(session.accessToken);

    // Get user's Contact_ID from their User_ID
    const userService = await UserService.getInstance();
    const userProfile = await userService.getUserProfile(session.user.id);
    const contactId = userProfile.Contact_ID;

    const newPrayer = await prayerService.createPrayer({
      Contact_ID: contactId,
      Entry_Title: title || "Prayer Request",
      Description: description,
      Feedback_Type_ID: categoryId || 1, // Default category
      Date_Submitted: new Date().toISOString(),
      Approved: false, // Requires staff approval
      Ongoing_Need: ongoing || false,
    });

    return NextResponse.json({
      id: newPrayer.Feedback_Entry_ID,
      title: newPrayer.Entry_Title,
      description: newPrayer.Description,
      dateSubmitted: newPrayer.Date_Submitted,
      approved: newPrayer.Approved,
    });
  } catch (error) {
    console.error("Error creating prayer:", error);
    return NextResponse.json(
      { error: "Failed to create prayer" },
      { status: 500 }
    );
  }
}
