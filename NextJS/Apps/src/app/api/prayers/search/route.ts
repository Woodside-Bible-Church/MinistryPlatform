import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrayerService } from "@/services/prayerService";

/**
 * GET /api/prayers/search?q=<query>&limit=<number>
 * Search prayers by title and description
 * Returns results formatted for global search integration
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : 6; // Default to 6 (global search requests 6 to detect "more")

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const session = await auth();

    // Use service account token for public prayer searching
    // or user token if authenticated
    const token = session?.accessToken || process.env.MINISTRY_PLATFORM_SERVICE_ACCOUNT_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "No authentication token available" },
        { status: 500 }
      );
    }

    const prayerService = new PrayerService(token);
    const prayers = await prayerService.searchPrayers(query, limit);

    // Transform to global search result format
    const searchResults = prayers.map((prayer) => ({
      id: prayer.Feedback_Entry_ID.toString(),
      title: prayer.Entry_Title || "Prayer Request",
      // Truncate description for preview
      description: prayer.Description?.length > 100
        ? prayer.Description.substring(0, 100) + "..."
        : prayer.Description || "",
      route: `/prayer?highlight=${prayer.Feedback_Entry_ID}`, // Deep link to specific prayer
    }));

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Error searching prayers:", error);
    return NextResponse.json(
      { error: "Failed to search prayers" },
      { status: 500 }
    );
  }
}
