import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { mpHelper } from "@/providers/MinistryPlatform/mpHelper";

// PATCH /api/projects/[id]/purchase-requests/[requestId]
// Update a purchase request (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();

    const { approvalStatus, rejectionReason } = body;

    if (!approvalStatus || !["Approved", "Rejected", "Pending"].includes(approvalStatus)) {
      return NextResponse.json(
        { error: "Invalid approval status" },
        { status: 400 }
      );
    }

    // Get current user's contact ID
    const contactId = session.user.contactId;

    // Build update object
    const updateData: any = {
      Approval_Status: approvalStatus,
    };

    if (approvalStatus === "Approved") {
      updateData.Approved_By_Contact_ID = contactId;
      updateData.Approved_Date = new Date().toISOString();
      updateData.Rejection_Reason = null;
    } else if (approvalStatus === "Rejected") {
      updateData.Approved_By_Contact_ID = contactId;
      updateData.Approved_Date = new Date().toISOString();
      updateData.Rejection_Reason = rejectionReason || null;
    } else if (approvalStatus === "Pending") {
      // Reset approval
      updateData.Approved_By_Contact_ID = null;
      updateData.Approved_Date = null;
      updateData.Rejection_Reason = null;
    }

    // Update purchase request
    await mpHelper.updateRecord(
      "Project_Budget_Purchase_Requests",
      parseInt(requestId),
      updateData
    );

    // Fetch the updated purchase request
    const result = await mpHelper.executeProcedureWithBody(
      "api_Custom_GetPurchaseRequestDetails_JSON",
      {
        "@PurchaseRequestID": parseInt(requestId),
      }
    );

    if (!result || result.length === 0) {
      throw new Error("Failed to fetch updated purchase request");
    }

    const jsonResult = result[0][0]?.JsonResult;
    if (!jsonResult) {
      throw new Error("Failed to parse purchase request result");
    }

    const purchaseRequest = JSON.parse(jsonResult);
    return NextResponse.json(purchaseRequest);
  } catch (error: any) {
    console.error("Error updating purchase request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update purchase request" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/purchase-requests/[requestId]
// Delete a purchase request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;

    // Check if there are any transactions linked to this purchase request
    const transactions = await mpHelper.getRecords("Project_Budget_Transactions", {
      filter: `Purchase_Request_ID=${requestId}`,
    });

    if (transactions && transactions.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete purchase request with existing transactions" },
        { status: 400 }
      );
    }

    // Delete the purchase request
    await mpHelper.deleteRecord(
      "Project_Budget_Purchase_Requests",
      parseInt(requestId)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting purchase request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete purchase request" },
      { status: 500 }
    );
  }
}
