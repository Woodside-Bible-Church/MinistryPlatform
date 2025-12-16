import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { name, isRevenue } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Get User_ID for audit logging
    const mp = new MPHelper();
    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: 'dp_Users',
      select: 'User_ID',
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = users[0].User_ID;

    // Check if category type already exists
    const existingTypes = await mp.getTableRecords<{ Project_Category_Type_ID: number }>({
      table: 'Project_Category_Types',
      select: 'Project_Category_Type_ID',
      filter: `Project_Category_Type='${name.replace(/'/g, "''")}' AND Is_Revenue=${isRevenue ? 1 : 0}`,
      top: 1,
    });

    if (existingTypes.length > 0) {
      return NextResponse.json(
        { error: "A category type with this name already exists" },
        { status: 409 }
      );
    }

    // Get the max sort order
    const existingSortOrders = await mp.getTableRecords<{ Sort_Order: number }>({
      table: 'Project_Category_Types',
      select: 'Sort_Order',
      filter: `Is_Revenue=${isRevenue ? 1 : 0}`,
      orderBy: 'Sort_Order DESC',
      top: 1,
    });

    const nextSortOrder = existingSortOrders.length > 0
      ? (existingSortOrders[0].Sort_Order || 0) + 1
      : 1;

    // Create the new category type
    const newCategoryType = {
      Project_Category_Type: name,
      Is_Revenue: isRevenue === true,
      Sort_Order: nextSortOrder,
      Discontinued: false,
      Domain_ID: 1, // Woodside Bible Church domain
    };

    const createdTypes = await mp.createTableRecords(
      'Project_Category_Types',
      [newCategoryType],
      {
        $userId: userId,
        $select: 'Project_Category_Type_ID,Project_Category_Type,Is_Revenue,Sort_Order,Discontinued',
      }
    ) as unknown as {
      Project_Category_Type_ID: number;
      Project_Category_Type: string;
      Is_Revenue: boolean;
      Sort_Order: number;
      Discontinued: boolean;
    }[];

    if (createdTypes.length === 0) {
      return NextResponse.json(
        { error: "Failed to create category type" },
        { status: 500 }
      );
    }

    // Return the created category type
    return NextResponse.json(createdTypes[0]);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
