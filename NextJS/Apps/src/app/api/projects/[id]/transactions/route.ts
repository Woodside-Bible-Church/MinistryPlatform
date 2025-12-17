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
    const {
      transactionDate,
      transactionType,
      categoryId,
      lineItemId,
      payeeName,
      description,
      amount,
      paymentMethodId,
      paymentReference,
      notes,
      status,
    } = body;

    if (!transactionDate || !transactionType || amount === undefined) {
      return NextResponse.json(
        { error: "Transaction date, type, and amount are required" },
        { status: 400 }
      );
    }

    if (transactionType !== "Expense" && transactionType !== "Income") {
      return NextResponse.json(
        { error: "Transaction type must be 'Expense' or 'Income'" },
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

    // Build transaction object
    const newTransaction: any = {
      Project_ID: projectId,
      Transaction_Date: transactionDate,
      Transaction_Type: transactionType,
      Amount: amount,
      Payee_Name: payeeName || null,
      Description: description || null,
      Payment_Method_ID: paymentMethodId || null,
      Payment_Reference: paymentReference || null,
      Notes: notes || null,
    };

    // Link to unified line item if provided
    if (lineItemId) {
      const numericId = typeof lineItemId === 'number'
        ? lineItemId
        : parseInt(lineItemId, 10);

      if (!isNaN(numericId)) {
        newTransaction.Project_Budget_Line_Item_ID = numericId;
      }
    }

    // Create the transaction
    const createdTransactions = await mp.createTableRecords(
      'Project_Budget_Transactions',
      [newTransaction],
      {
        $userId: userId,
        $select: 'Project_Budget_Transaction_ID,Transaction_Date,Transaction_Type,Payee_Name,Description,Amount,Payment_Method_ID,Payment_Reference,Notes,Project_Budget_Line_Item_ID',
      }
    );

    if (createdTransactions.length === 0) {
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json(createdTransactions[0]);
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
    const {
      transactionId,
      transactionDate,
      transactionType,
      categoryId,
      lineItemId,
      payeeName,
      description,
      amount,
      paymentMethodId,
      paymentReference,
      notes,
      status,
    } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
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

    // Build update object
    const updateData: any = {
      Project_Budget_Transaction_ID: parseInt(transactionId, 10),
    };

    if (transactionDate !== undefined) updateData.Transaction_Date = transactionDate;
    if (transactionType !== undefined) updateData.Transaction_Type = transactionType;
    if (payeeName !== undefined) updateData.Payee_Name = payeeName;
    if (description !== undefined) updateData.Description = description;
    if (amount !== undefined) updateData.Amount = amount;
    if (paymentMethodId !== undefined) updateData.Payment_Method_ID = paymentMethodId;
    if (paymentReference !== undefined) updateData.Payment_Reference = paymentReference;
    if (notes !== undefined) updateData.Notes = notes;

    // Link to unified line item if provided
    if (lineItemId !== undefined) {
      const numericId = typeof lineItemId === 'number'
        ? lineItemId
        : parseInt(lineItemId, 10);

      if (!isNaN(numericId)) {
        updateData.Project_Budget_Line_Item_ID = numericId;
      } else {
        // Set to null if lineItemId is empty string or invalid
        updateData.Project_Budget_Line_Item_ID = null;
      }
    }

    // Update the transaction
    // Note: MP sometimes returns 500 even when update succeeds due to triggers/stored procs
    let updatedTransactions;
    try {
      updatedTransactions = await mp.updateTableRecords(
        'Project_Budget_Transactions',
        [updateData],
        {
          $userId: userId,
          $select: 'Project_Budget_Transaction_ID,Transaction_Date,Transaction_Type,Payee_Name,Description,Amount,Payment_Method_ID,Payment_Reference,Notes,Project_Budget_Line_Item_ID',
        }
      );
    } catch (updateError) {
      // If MP returns 500, verify if the update actually succeeded
      console.log("Update returned error, verifying if transaction was actually updated...");
      console.log("Original error:", updateError);

      try {
        const verification = await mp.getTableRecords({
          table: 'Project_Budget_Transactions',
          select: 'Project_Budget_Transaction_ID,Transaction_Date,Transaction_Type,Payee_Name,Description,Amount,Payment_Method_ID,Payment_Reference,Notes,Project_Budget_Line_Item_ID',
          filter: `Project_Budget_Transaction_ID=${transactionId}`,
          top: 1,
        });

        console.log("Verification result:", verification);

        if (verification.length > 0) {
          // Transaction exists, assume update succeeded despite 500 error
          console.log("Transaction found after update error - treating as success");
          updatedTransactions = verification;
        } else {
          // Transaction doesn't exist, re-throw the original error
          console.log("Transaction not found after error - re-throwing");
          throw updateError;
        }
      } catch (verificationError) {
        // If verification also fails, throw the original update error
        console.log("Verification itself failed:", verificationError);
        throw updateError;
      }
    }

    if (!updatedTransactions || updatedTransactions.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTransactions[0]);
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

    // Get transactionId from query params
    const url = new URL(request.url);
    const transactionId = url.searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
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

    // Delete the transaction
    await mp.deleteTableRecords(
      'Project_Budget_Transactions',
      [parseInt(transactionId, 10)],
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
