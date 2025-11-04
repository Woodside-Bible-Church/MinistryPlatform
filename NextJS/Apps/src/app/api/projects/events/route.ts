import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProjectsService } from "@/services/projectsService";

// GET /api/projects/events - Get events with optional search
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || undefined;

    const projectsService = new ProjectsService();
    const events = await projectsService.getEvents(search);

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
