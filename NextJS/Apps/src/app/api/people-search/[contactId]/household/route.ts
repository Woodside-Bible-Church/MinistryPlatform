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
      console.error("Household API: No access token");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { contactId } = await params;
    console.log(`Household API: Fetching for contact ID ${contactId}`);

    const peopleSearchService = new PeopleSearchService(session.accessToken);

    // Get contact to find household ID
    console.log("Household API: Getting contact details");
    const contact = await peopleSearchService.getContactById(parseInt(contactId));

    if (!contact) {
      console.error("Household API: Contact not found");
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    console.log(`Household API: Contact found, Household_ID: ${contact.Household_ID}`);

    if (!contact.Household_ID) {
      console.log("Household API: No household ID, returning empty");
      return NextResponse.json({
        Household: null,
        Members: []
      });
    }

    // Get household with all members using stored procedure
    console.log(`Household API: Fetching household ${contact.Household_ID} via stored procedure`);
    const result = await peopleSearchService.getHouseholdWithMembers(
      contact.Household_ID,
      parseInt(contactId)
    );

    if (!result) {
      console.error("Household API: No data returned from stored procedure");
      return NextResponse.json(
        { error: "Household not found" },
        { status: 404 }
      );
    }

    console.log(`Household API: Success - household: ${result.Household?.Household_Name}, members: ${result.Members?.length || 0}`);

    // Debug: Log member data to see Gender_ID and Relationship_ID
    if (result.Members) {
      result.Members.forEach((member, index) => {
        console.log(`Member ${index + 1}:`, {
          Contact_ID: member.Contact_ID,
          Display_Name: member.Display_Name,
          Gender_ID: member.Gender_ID,
          Gender: member.Gender,
          Relationship_ID: member.Relationship_ID,
          Relationship_Name: member.Relationship_Name,
        });
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching household:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.json(
      { error: "Failed to fetch household", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
