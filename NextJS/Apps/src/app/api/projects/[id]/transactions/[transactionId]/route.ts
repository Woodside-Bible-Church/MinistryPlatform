import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMinistryPlatformClient } from "@/providers/MinistryPlatform/ministryPlatformProvider";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, transactionId } = await params;
    const mpClient = getMinistryPlatformClient(session);

    // Get transaction details
    const transactionResult = await mpClient.tables.getRecords(
      "Project_Budget_Transactions",
      `$filter=Project_Budget_Transaction_ID=${transactionId}&$select=Project_Budget_Transaction_ID,Transaction_Date,Amount,Description,Payee_Name,Transaction_Type,Payment_Method_ID,Project_Budget_Expense_Line_Item_ID,Project_Budget_Income_Line_Item_ID,Purchase_Request_ID,Project_ID`
    );

    if (!transactionResult || transactionResult.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const transaction = transactionResult[0];

    // Get payment method if present
    if (transaction.Payment_Method_ID) {
      const paymentMethods = await mpClient.tables.getRecords(
        "Project_Budget_Payment_Methods",
        `$filter=Payment_Method_ID=${transaction.Payment_Method_ID}`
      );
      if (paymentMethods.length > 0) {
        transaction.Payment_Method_Name = paymentMethods[0].Payment_Method_Name;
      }
    }

    // Get files attached to this transaction
    try {
      const files = await mpClient.files.getFilesByRecord(
        "Project_Budget_Transactions",
        parseInt(transactionId)
      );
      transaction.files = files.map(file => ({
        ...file,
        // Build public URL for file viewing/sharing
        publicUrl: `${process.env.MINISTRY_PLATFORM_BASE_URL}/ministryplatformapi/files/${file.UniqueFileId}`
      }));
    } catch (error) {
      transaction.files = [];
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction details" },
      { status: 500 }
    );
  }
}
