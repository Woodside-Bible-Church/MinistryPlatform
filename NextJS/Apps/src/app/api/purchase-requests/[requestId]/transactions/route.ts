import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

// POST /api/purchase-requests/[requestId]/transactions
// Create a new transaction for a purchase request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();

    const {
      amount,
      description,
      transactionDate,
      paymentMethod,
    } = body;

    if (!amount || !transactionDate || !paymentMethod) {
      return NextResponse.json(
        { error: "Amount, transaction date, and payment method are required" },
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

    // Get purchase request to find the Line_Item_ID and Project_ID
    const purchaseRequests = await mp.getTableRecords<{
      Line_Item_ID: number;
      Project_ID: number;
    }>({
      table: 'Project_Budget_Purchase_Requests',
      select: 'Line_Item_ID, Project_ID',
      filter: `Purchase_Request_ID=${requestId}`,
      top: 1,
    });

    if (purchaseRequests.length === 0) {
      return NextResponse.json(
        { error: "Purchase request not found" },
        { status: 404 }
      );
    }

    const { Line_Item_ID, Project_ID } = purchaseRequests[0];

    // Create transaction in database
    const insertResult = await mp.createTableRecords(
      "Project_Budget_Transactions",
      [{
        Purchase_Request_ID: parseInt(requestId),
        Line_Item_ID,
        Project_ID,
        Transaction_Date: transactionDate,
        Transaction_Amount: parseFloat(amount),
        Transaction_Description: description || null,
        Payment_Method: paymentMethod,
        Domain_ID: 1,
      }],
      {
        $userId: userId,
      }
    ) as unknown as Array<{ Transaction_ID: number }>;

    if (!insertResult || insertResult.length === 0) {
      throw new Error("Failed to create transaction");
    }

    const transactionId = insertResult[0].Transaction_ID;

    return NextResponse.json({
      transactionId,
      success: true,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create transaction" },
      { status: 500 }
    );
  }
}
