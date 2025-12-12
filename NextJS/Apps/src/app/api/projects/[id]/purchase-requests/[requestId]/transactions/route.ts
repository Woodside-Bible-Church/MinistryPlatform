import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

// POST /api/projects/[id]/purchase-requests/[requestId]/transactions
// Add a transaction to a purchase request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, requestId } = await params;
    const body = await request.json();

    const {
      amount,
      transactionDate,
      description,
      paymentMethodId,
      vendorName,
    } = body;

    if (!amount || !transactionDate) {
      return NextResponse.json(
        { error: "Amount and transaction date are required" },
        { status: 400 }
      );
    }

    // Get the purchase request to verify it's approved and get line item ID
    const mp = new MPHelper();
    const prResult = await mp.executeProcedureWithBody(
      "api_Custom_GetPurchaseRequestDetails_JSON",
      {
        "@PurchaseRequestID": parseInt(requestId),
      }
    ) as unknown as Array<Array<{ JsonResult: string }>>;

    if (!prResult || prResult.length === 0) {
      return NextResponse.json(
        { error: "Purchase request not found" },
        { status: 404 }
      );
    }

    const jsonResult = prResult[0][0]?.JsonResult;
    if (!jsonResult) {
      throw new Error("Failed to parse purchase request result");
    }

    const purchaseRequest = JSON.parse(jsonResult);

    // Check if purchase request is approved
    if (purchaseRequest.approvalStatus !== "Approved") {
      return NextResponse.json(
        { error: "Cannot add transactions to an unapproved purchase request" },
        { status: 400 }
      );
    }

    // Create transaction
    const insertResult = await mp.createTableRecords(
      "Project_Budget_Transactions",
      [{
        Project_ID: parseInt(projectId),
        Transaction_Type: "Expense",
        Transaction_Date: transactionDate,
        Amount: parseFloat(amount),
        Description: description || null,
        Payee_Name: vendorName || purchaseRequest.vendorName || null,
        Payment_Method_ID: paymentMethodId ? parseInt(paymentMethodId) : null,
        Project_Budget_Expense_Line_Item_ID: purchaseRequest.lineItemId,
        Purchase_Request_ID: parseInt(requestId),
        Domain_ID: 1,
      }]
    );

    if (!insertResult || insertResult.length === 0) {
      throw new Error("Failed to create transaction");
    }

    const transactionId = insertResult[0].Project_Budget_Transaction_ID;

    // Fetch updated purchase request with new transaction
    const updatedResult = await mp.executeProcedureWithBody(
      "api_Custom_GetPurchaseRequestDetails_JSON",
      {
        "@PurchaseRequestID": parseInt(requestId),
      }
    ) as unknown as Array<Array<{ JsonResult: string }>>;

    if (!updatedResult || updatedResult.length === 0) {
      throw new Error("Failed to fetch updated purchase request");
    }

    const updatedJsonResult = updatedResult[0][0]?.JsonResult;
    if (!updatedJsonResult) {
      throw new Error("Failed to parse updated purchase request");
    }

    const updatedPurchaseRequest = JSON.parse(updatedJsonResult);
    return NextResponse.json(
      {
        transactionId,
        purchaseRequest: updatedPurchaseRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding transaction to purchase request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add transaction" },
      { status: 500 }
    );
  }
}
