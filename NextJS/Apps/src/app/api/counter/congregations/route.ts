import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CounterService } from "@/services/counterService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const counterService = new CounterService(session.accessToken);
    const congregations = await counterService.getCongregations();

    return NextResponse.json(congregations);
  } catch (error) {
    console.error("Error fetching congregations:", error);
    return NextResponse.json(
      { error: "Failed to fetch congregations" },
      { status: 500 }
    );
  }
}
