import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineItemId } = await params;

    // Get line item details with category info, purchase requests, transactions, and files
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    const mpUrl = `${baseUrl}/procs/api_Custom_GetLineItemDetails_JSON?@LineItemID=${lineItemId}`;

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MP API error:", response.status, response.statusText);
      console.error("Error response body:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch line item details", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle the JsonResult format from the stored procedure
    // MP returns: [[{ "JsonResult": "{...}" }]]
    if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0]) {
      const row = data[0][0];

      // Check for error in JsonResult
      if (row.error) {
        return NextResponse.json({ error: row.error }, { status: 404 });
      }

      // Parse the JsonResult column
      if (row.JsonResult) {
        try {
          const lineItem = JSON.parse(row.JsonResult);
          // Files are now included in the stored procedure response
          return NextResponse.json(lineItem);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("JsonResult:", row.JsonResult);
          return NextResponse.json(
            { error: "Failed to parse line item data" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Line item not found" },
      { status: 404 }
    );
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lineItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineItemId } = await params;
    const body = await request.json();

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

    // Build update object with Project_Budget_Line_Item_ID
    const updateData = {
      Project_Budget_Line_Item_ID: parseInt(lineItemId),
      ...body
    };

    // Update line item using MPHelper
    await mp.updateTableRecords(
      "Project_Budget_Line_Items",
      [updateData],
      {
        $userId: userId,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error updating line item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update line item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lineItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineItemId } = await params;

    // Check if there are any purchase requests or transactions linked
    const mp = new MPHelper();
    const purchaseRequests = await mp.getTableRecords({
      table: "Project_Budget_Purchase_Requests",
      filter: `Line_Item_ID=${lineItemId}`,
    });

    if (purchaseRequests && purchaseRequests.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete line item with existing purchase requests" },
        { status: 400 }
      );
    }

    // Delete the line item using MPHelper
    await mp.deleteTableRecords(
      "Project_Budget_Line_Items",
      [parseInt(lineItemId)]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting line item:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete line item" },
      { status: 500 }
    );
  }
}
