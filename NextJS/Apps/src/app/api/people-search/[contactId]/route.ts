import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PeopleSearchService } from "@/services/peopleSearchService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { contactId } = await params;
    const peopleSearchService = new PeopleSearchService(session.accessToken);
    const contact = await peopleSearchService.getContactById(parseInt(contactId));

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}
