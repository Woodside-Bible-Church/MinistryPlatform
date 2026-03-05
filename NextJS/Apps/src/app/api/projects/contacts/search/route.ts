import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkProjectsAppAccess } from "@/lib/mpAuth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess } = await checkProjectsAppAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const query = request.nextUrl.searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const mp = new MPHelper();

    const safeQuery = query.replace(/'/g, "''");

    const users = await mp.getTableRecords<{
      User_ID: number;
      Display_Name: string;
      Email_Address: string;
    }>({
      table: "dp_Users",
      select: "User_ID, Contact_ID_Table.Display_Name AS Display_Name, Contact_ID_Table.Email_Address AS Email_Address",
      filter: `(Contact_ID_Table.Display_Name LIKE '%${safeQuery}%' OR Contact_ID_Table.Email_Address LIKE '%${safeQuery}%')`,
      orderBy: "Contact_ID_Table.Last_Name, Contact_ID_Table.First_Name",
      top: 25,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Contact search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
