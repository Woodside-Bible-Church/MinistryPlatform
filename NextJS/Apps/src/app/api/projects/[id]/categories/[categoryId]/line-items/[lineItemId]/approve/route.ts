import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string; lineItemId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, lineItemId } = await params;
    const projectId = parseInt(id, 10);
    const expenseLineItemId = parseInt(lineItemId, 10);

    if (isNaN(projectId) || isNaN(expenseLineItemId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Convert status string to bit value
    // "Approved" = 1, "Rejected" = 0, "Pending" = NULL
    let approvedValue: boolean | null;
    switch (status.toLowerCase()) {
      case 'approved':
        approvedValue = true;
        break;
      case 'rejected':
        approvedValue = false;
        break;
      case 'pending':
        approvedValue = null;
        break;
      default:
        return NextResponse.json(
          { error: `Invalid status: ${status}. Must be Approved, Rejected, or Pending` },
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

    // Update the line item approval status
    const updateData: any = {
      Project_Budget_Expense_Line_Item_ID: expenseLineItemId,
    };

    if (approvedValue !== null) {
      updateData.Approved = approvedValue;
    } else {
      // To set NULL, we need to explicitly pass null
      updateData.Approved = null;
    }

    const updatedLineItems = await mp.updateTableRecords(
      'Project_Budget_Expense_Line_Items',
      [updateData],
      {
        $userId: userId,
        $select: 'Project_Budget_Expense_Line_Item_ID,Approved',
      }
    );

    if (updatedLineItems.length === 0) {
      return NextResponse.json(
        { error: "Line item not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lineItemId: expenseLineItemId,
      status,
    });
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
