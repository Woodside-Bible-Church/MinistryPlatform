import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import { getMPAccessToken, getMPBaseUrl, checkBudgetAppAccess } from "@/lib/mpAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to access the Budget app
    const { hasAccess } = await checkBudgetAppAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access the Budget app" },
        { status: 403 }
      );
    }

    const { requestId } = await params;

    // Get OAuth token using client credentials (app credentials, not user token)
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    // Get purchase request details
    const mpUrl = `${baseUrl}/procs/api_Custom_GetPurchaseRequestDetails_JSON?@PurchaseRequestID=${requestId}`;

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MP API error:", response.status, response.statusText);
      console.error("Error response body:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch purchase request details", details: errorText },
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
          const purchaseRequest = JSON.parse(row.JsonResult);

          // Validate that we got actual purchase request data
          if (!purchaseRequest || !purchaseRequest.purchaseRequestId) {
            return NextResponse.json(
              { error: "Purchase request not found" },
              { status: 404 }
            );
          }

          // Parse nested JSON fields if they're strings (SQL Server returns nested JSON as strings)
          if (purchaseRequest.transactions && typeof purchaseRequest.transactions === 'string') {
            purchaseRequest.transactions = JSON.parse(purchaseRequest.transactions);
          }
          if (purchaseRequest.files && typeof purchaseRequest.files === 'string') {
            purchaseRequest.files = JSON.parse(purchaseRequest.files);
          }

          return NextResponse.json(purchaseRequest);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("JsonResult:", row.JsonResult);
          return NextResponse.json(
            { error: "Failed to parse purchase request data" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Purchase request not found" },
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
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to edit in the Budget app
    const { hasAccess, canEdit } = await checkBudgetAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to edit in the Budget app" },
        { status: 403 }
      );
    }

    const { requestId } = await params;
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

    // Update purchase request via MPHelper
    await mp.updateTableRecords(
      "Project_Budget_Purchase_Requests",
      [{
        Purchase_Request_ID: parseInt(requestId),
        ...body,
      }],
      {
        $userId: userId,
      }
    );

    return NextResponse.json({ success: true });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to delete in the Budget app
    const { hasAccess, canDelete } = await checkBudgetAppAccess();
    if (!hasAccess || !canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to delete in the Budget app" },
        { status: 403 }
      );
    }

    const { requestId } = await params;

    // Get OAuth token using client credentials (app credentials, not user token)
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    // Delete purchase request via MinistryPlatform API
    const mpUrl = `${baseUrl}/tables/Project_Budget_Purchase_Requests/${requestId}`;

    const response = await fetch(mpUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MP API error:", response.status, response.statusText);
      console.error("Error response body:", errorText);
      return NextResponse.json(
        { error: "Failed to delete purchase request", details: errorText },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
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
