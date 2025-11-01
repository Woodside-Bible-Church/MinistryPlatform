import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CounterService } from "@/services/counterService";
import { UserService } from "@/services/userService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Fetch congregations using MP client credentials (public data)
    const counterService = new CounterService();
    const congregations = await counterService.getCongregations();

    // If authenticated, get user's Web Congregation preference
    let userWebCongregation: number | null = null;
    if (session?.user?.id) {
      try {
        const userService = await UserService.getInstance();
        const userProfile = await userService.getUserProfile(session.user.id);
        userWebCongregation = userProfile.Web_Congregation_ID;
      } catch (error) {
        console.error("Error fetching user Web Congregation:", error);
        // Continue without user preference if error occurs
      }
    }

    return NextResponse.json({
      congregations,
      userWebCongregation,
    });
  } catch (error) {
    console.error("Error fetching congregations:", error);
    return NextResponse.json(
      { error: "Failed to fetch congregations" },
      { status: 500 }
    );
  }
}
