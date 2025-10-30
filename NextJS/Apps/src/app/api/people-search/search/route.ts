import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PeopleSearchService } from "@/services/peopleSearchService";

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
    const query = searchParams.get("q");
    const skip = searchParams.get("skip");

    if (!query) {
      return NextResponse.json([]);
    }

    const peopleSearchService = new PeopleSearchService(session.accessToken);
    const contacts = await peopleSearchService.searchContacts(
      query,
      skip ? parseInt(skip) : 0
    );

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error searching contacts:", error);
    return NextResponse.json(
      { error: "Failed to search contacts" },
      { status: 500 }
    );
  }
}
