import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, categoryId } = await params;
    const projectId = parseInt(id, 10);
    const budgetCategoryId = parseInt(categoryId, 10);

    if (isNaN(projectId) || isNaN(budgetCategoryId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { name, vendor, estimatedAmount, description, status } = body;

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

    // Get the max sort order for the category
    const existingLineItems = await mp.getTableRecords<{ Sort_Order: number }>({
      table: 'Project_Budget_Expense_Line_Items',
      select: 'Sort_Order',
      filter: `Project_Budget_Category_ID=${budgetCategoryId}`,
      orderby: 'Sort_Order DESC',
      top: 1,
    });

    const nextSortOrder = existingLineItems.length > 0
      ? (existingLineItems[0].Sort_Order || 0) + 1
      : 1;

    // Create the line item
    const newLineItem = {
      Project_Budget_Category_ID: budgetCategoryId,
      Item_Name: name,
      Item_Description: description || null,
      Vendor_Name: vendor || null,
      Estimated_Amount: estimatedAmount || 0,
      Status: status || 'pending',
      Sort_Order: nextSortOrder,
    };

    const createdLineItems = await mp.createTableRecords(
      'Project_Budget_Expense_Line_Items',
      [newLineItem],
      {
        $userId: userId,
        $select: 'Project_Budget_Expense_Line_Item_ID,Item_Name,Vendor_Name,Estimated_Amount,Status,Item_Description,Sort_Order',
      }
    );

    if (createdLineItems.length === 0) {
      return NextResponse.json(
        { error: "Failed to create line item" },
        { status: 500 }
      );
    }

    const created = createdLineItems[0];

    // Return in the format expected by the frontend
    return NextResponse.json({
      lineItemId: created.Project_Budget_Expense_Line_Item_ID,
      name: created.Item_Name,
      vendor: created.Vendor_Name,
      estimated: created.Estimated_Amount || 0,
      actual: 0,
      status: created.Status,
      description: created.Item_Description,
      sortOrder: created.Sort_Order,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
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
    const { lineItemId, name, vendor, estimatedAmount, description, status } = body;

    if (!lineItemId) {
      return NextResponse.json(
        { error: "Line item ID is required" },
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
      Project_Budget_Expense_Line_Item_ID: parseInt(lineItemId, 10),
    };

    if (name !== undefined) updateData.Item_Name = name;
    if (vendor !== undefined) updateData.Vendor_Name = vendor;
    if (estimatedAmount !== undefined) updateData.Estimated_Amount = estimatedAmount;
    if (description !== undefined) updateData.Item_Description = description;
    if (status !== undefined) updateData.Status = status;

    // Update the line item
    const updatedLineItems = await mp.updateTableRecords(
      'Project_Budget_Expense_Line_Items',
      [updateData],
      {
        $userId: userId,
        $select: 'Project_Budget_Expense_Line_Item_ID,Item_Name,Vendor_Name,Estimated_Amount,Status,Item_Description',
      }
    );

    if (updatedLineItems.length === 0) {
      return NextResponse.json(
        { error: "Line item not found or update failed" },
        { status: 404 }
      );
    }

    const updated = updatedLineItems[0];

    // Return in the format expected by the frontend
    return NextResponse.json({
      lineItemId: updated.Project_Budget_Expense_Line_Item_ID,
      name: updated.Item_Name,
      vendor: updated.Vendor_Name,
      estimated: updated.Estimated_Amount,
      status: updated.Status,
      description: updated.Item_Description,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
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

    // Get lineItemId from query params
    const url = new URL(request.url);
    const lineItemId = url.searchParams.get('lineItemId');

    if (!lineItemId) {
      return NextResponse.json(
        { error: "Line item ID is required" },
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

    // Check if line item has transactions
    const transactions = await mp.getTableRecords<{ Project_Budget_Transaction_ID: number }>({
      table: 'Project_Budget_Transactions',
      select: 'Project_Budget_Transaction_ID',
      filter: `Project_Budget_Expense_Line_Item_ID=${lineItemId}`,
      top: 1,
    });

    if (transactions.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete line item with transactions. Please delete all transactions first." },
        { status: 400 }
      );
    }

    // Delete the line item
    await mp.deleteTableRecords(
      'Project_Budget_Expense_Line_Items',
      [parseInt(lineItemId, 10)],
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
