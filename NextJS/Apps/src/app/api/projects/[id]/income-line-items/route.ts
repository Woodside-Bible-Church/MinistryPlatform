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
    const { name, expectedAmount, description } = body;

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

    // Get the max sort order for the project
    const existingLineItems = await mp.getTableRecords<{ Sort_Order: number }>({
      table: 'Project_Budget_Income_Line_Items',
      select: 'Sort_Order',
      filter: `Project_ID=${projectId}`,
      orderBy: 'Sort_Order DESC',
      top: 1,
    });

    const nextSortOrder = existingLineItems.length > 0
      ? (existingLineItems[0].Sort_Order || 0) + 1
      : 1;

    // Create the income line item
    const newLineItem = {
      Project_ID: projectId,
      Income_Source_Name: name,
      Description: description || null,
      Expected_Amount: expectedAmount || 0,
      Sort_Order: nextSortOrder,
    };

    const createdLineItems = await mp.createTableRecords(
      'Project_Budget_Income_Line_Items',
      [newLineItem],
      {
        $userId: userId,
        $select: 'Project_Budget_Income_Line_Item_ID,Income_Source_Name,Description,Expected_Amount,Sort_Order',
      }
    );

    if (createdLineItems.length === 0) {
      return NextResponse.json(
        { error: "Failed to create income line item" },
        { status: 500 }
      );
    }

    const created = createdLineItems[0];

    // Return in the format expected by the frontend
    // Income line items ARE categories in the frontend
    return NextResponse.json({
      categoryId: `income-${created.Project_Budget_Income_Line_Item_ID}`,
      name: created.Income_Source_Name,
      type: 'revenue',
      description: created.Description,
      estimated: created.Expected_Amount || 0,
      actual: 0,
      sortOrder: created.Sort_Order,
      lineItems: [{
        lineItemId: `income-line-${created.Project_Budget_Income_Line_Item_ID}`,
        name: created.Income_Source_Name,
        description: created.Description,
        estimated: created.Expected_Amount || 0,
        actual: 0,
        vendor: null,
        status: 'received',
        sortOrder: created.Sort_Order,
      }],
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
    const { lineItemId, name, expectedAmount, description } = body;

    if (!lineItemId) {
      return NextResponse.json(
        { error: "Line item ID is required" },
        { status: 400 }
      );
    }

    // Extract numeric ID from "income-123" format
    const numericId = parseInt(lineItemId.replace('income-', ''), 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: "Invalid line item ID format" },
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
      Project_Budget_Income_Line_Item_ID: numericId,
    };

    if (name !== undefined) updateData.Income_Source_Name = name;
    if (expectedAmount !== undefined) updateData.Expected_Amount = expectedAmount;
    if (description !== undefined) updateData.Description = description;

    // Update the income line item
    const updatedLineItems = await mp.updateTableRecords(
      'Project_Budget_Income_Line_Items',
      [updateData],
      {
        $userId: userId,
        $select: 'Project_Budget_Income_Line_Item_ID,Income_Source_Name,Description,Expected_Amount',
      }
    );

    if (updatedLineItems.length === 0) {
      return NextResponse.json(
        { error: "Income line item not found or update failed" },
        { status: 404 }
      );
    }

    const updated = updatedLineItems[0];

    // Return in category format
    return NextResponse.json({
      categoryId: `income-${updated.Project_Budget_Income_Line_Item_ID}`,
      name: updated.Income_Source_Name,
      description: updated.Description,
      estimated: updated.Expected_Amount,
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

    // Get lineItemId from query params
    const url = new URL(request.url);
    const lineItemId = url.searchParams.get('lineItemId');

    if (!lineItemId) {
      return NextResponse.json(
        { error: "Line item ID is required" },
        { status: 400 }
      );
    }

    // Extract numeric ID from "income-123" format
    const numericId = parseInt(lineItemId.replace('income-', ''), 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: "Invalid line item ID format" },
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

    // Check if income line item has transactions
    const transactions = await mp.getTableRecords<{ Project_Budget_Transaction_ID: number }>({
      table: 'Project_Budget_Transactions',
      select: 'Project_Budget_Transaction_ID',
      filter: `Project_Budget_Income_Line_Item_ID=${numericId}`,
      top: 1,
    });

    if (transactions.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete income source with transactions. Please delete all transactions first." },
        { status: 400 }
      );
    }

    // Delete the income line item
    await mp.deleteTableRecords(
      'Project_Budget_Income_Line_Items',
      [numericId],
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
