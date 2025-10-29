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

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const congregationId = searchParams.get("congregationId");

    if (!date || !congregationId) {
      return NextResponse.json(
        { error: "Missing required parameters: date and congregationId" },
        { status: 400 }
      );
    }

    const counterService = new CounterService(session.accessToken);
    const events = await counterService.getEvents(date, parseInt(congregationId));

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
