import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

// GET /api/projects/[id]/purchase-requests
// Get all purchase requests for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const filterByMe = searchParams.get("filterByMe") === "true";

    // Get current user's contact ID
    const contactId = session.contactId ? parseInt(session.contactId) : null;

    // Get purchase requests
    const mp = new MPHelper();
    const result = await mp.executeProcedureWithBody(
      "api_Custom_GetProjectPurchaseRequests_JSON",
      {
        "@ProjectID": parseInt(projectId),
        "@RequestedByContactID": filterByMe && contactId ? contactId : null,
      }
    ) as unknown as Array<Array<{ JsonResult: string }>>;

    if (!result || result.length === 0) {
      return NextResponse.json([]);
    }

    const jsonResult = result[0][0]?.JsonResult;
    if (!jsonResult) {
      return NextResponse.json([]);
    }

    const purchaseRequests = JSON.parse(jsonResult);
    return NextResponse.json(purchaseRequests);
  } catch (error: any) {
    console.error("Error fetching purchase requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch purchase requests" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/purchase-requests
// Create a new purchase request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();

    const {
      lineItemId,
      amount,
      description,
      vendorName,
    } = body;

    if (!lineItemId || !amount) {
      return NextResponse.json(
        { error: "Line item ID and amount are required" },
        { status: 400 }
      );
    }

    // Get User_ID for audit logging and data
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

    // Create purchase request in database
    const insertResult = await mp.createTableRecords(
      "Project_Budget_Purchase_Requests",
      [{
        Project_ID: parseInt(projectId),
        Project_Budget_Expense_Line_Item_ID: parseInt(lineItemId),
        Requested_By_User_ID: userId,
        Amount: parseFloat(amount),
        Description: description || null,
        Vendor_Name: vendorName || null,
        Approval_Status: "Pending",
        Domain_ID: 1,
      }],
      {
        $userId: userId,
      }
    );

    if (!insertResult || insertResult.length === 0) {
      throw new Error("Failed to create purchase request");
    }

    const purchaseRequestId = insertResult[0].Purchase_Request_ID;

    // Fetch the newly created purchase request
    const result = await mp.executeProcedureWithBody(
      "api_Custom_GetPurchaseRequestDetails_JSON",
      {
        "@PurchaseRequestID": purchaseRequestId,
      }
    ) as unknown as Array<Array<{ JsonResult: string }>>;

    if (!result || result.length === 0) {
      throw new Error("Failed to fetch created purchase request");
    }

    const jsonResult = result[0][0]?.JsonResult;
    if (!jsonResult) {
      throw new Error("Failed to parse purchase request result");
    }

    const purchaseRequest = JSON.parse(jsonResult);
    return NextResponse.json(purchaseRequest, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create purchase request" },
      { status: 500 }
    );
  }
}
