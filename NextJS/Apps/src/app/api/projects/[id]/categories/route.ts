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
    const { name, type, budgetedAmount } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    if (type !== "expense" && type !== "revenue") {
      return NextResponse.json(
        { error: "Type must be 'expense' or 'revenue'" },
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

    // Look up the category type, create if it doesn't exist
    const isRevenue = type === "revenue" ? 1 : 0;
    const categoryTypes = await mp.getTableRecords<{ Project_Category_Type_ID: number }>({
      table: 'Project_Category_Types',
      select: 'Project_Category_Type_ID',
      filter: `Project_Category_Type='${name.replace(/'/g, "''")}' AND Is_Revenue=${isRevenue}`,
      top: 1,
    });

    let categoryTypeId: number;

    if (categoryTypes.length === 0) {
      // Category type doesn't exist, create it
      const newCategoryType = {
        Project_Category_Type: name,
        Is_Revenue: isRevenue === 1,
      };

      const createdTypes = await mp.createTableRecords(
        'Project_Category_Types',
        [newCategoryType],
        {
          $userId: userId,
          $select: 'Project_Category_Type_ID',
        }
      ) as unknown as { Project_Category_Type_ID: number }[];

      if (createdTypes.length === 0) {
        return NextResponse.json(
          { error: "Failed to create category type" },
          { status: 500 }
        );
      }

      categoryTypeId = createdTypes[0].Project_Category_Type_ID;
    } else {
      categoryTypeId = categoryTypes[0].Project_Category_Type_ID;
    }

    // Get the max sort order for the project
    const existingCategories = await mp.getTableRecords<{ Sort_Order: number }>({
      table: 'Project_Budget_Categories',
      select: 'Sort_Order',
      filter: `Project_ID=${projectId}`,
      orderBy: 'Sort_Order DESC',
      top: 1,
    });

    const nextSortOrder = existingCategories.length > 0
      ? (existingCategories[0].Sort_Order || 0) + 1
      : 1;

    // Create the budget category
    const newCategory = {
      Project_ID: projectId,
      Project_Category_Type_ID: categoryTypeId,
      Budgeted_Amount: parseFloat(budgetedAmount?.toString() || '0') || 0,
      Sort_Order: nextSortOrder,
    };

    const createdCategories = await mp.createTableRecords(
      'Project_Budget_Categories',
      [newCategory],
      {
        $userId: userId,
        $select: 'Project_Budget_Category_ID,Project_Category_Type_ID_Table.Project_Category_Type,Budgeted_Amount,Project_Budget_Categories.Sort_Order',
      }
    );

    if (createdCategories.length === 0) {
      return NextResponse.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }

    const created = createdCategories[0] as unknown as {
      Project_Budget_Category_ID: number;
      Project_Category_Type: string;
      Budgeted_Amount: number;
    };

    // Return in the format expected by the frontend
    return NextResponse.json({
      categoryId: created.Project_Budget_Category_ID,
      name: created.Project_Category_Type,
      type: type,
      sortOrder: nextSortOrder,
      estimated: created.Budgeted_Amount || 0,
      actual: 0,
      lineItems: [],
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
    const { categoryId, budgetedAmount } = body;

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
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
      Project_Budget_Category_ID: parseInt(categoryId, 10),
    };

    if (budgetedAmount !== undefined) {
      updateData.Budgeted_Amount = budgetedAmount;
    }

    // Update the category
    const updatedCategories = await mp.updateTableRecords(
      'Project_Budget_Categories',
      [updateData],
      {
        $userId: userId,
        $select: 'Project_Budget_Category_ID,Budgeted_Amount',
      }
    );

    if (updatedCategories.length === 0) {
      return NextResponse.json(
        { error: "Category not found or update failed" },
        { status: 404 }
      );
    }

    const updated = updatedCategories[0];

    // Return in the format expected by the frontend
    return NextResponse.json({
      categoryId: updated.Project_Budget_Category_ID,
      budgetedAmount: updated.Budgeted_Amount,
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

    // Get categoryId from query params
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
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

    // Check if category has line items (consolidated table)
    const lineItems = await mp.getTableRecords<{ Project_Budget_Line_Item_ID: number }>({
      table: 'Project_Budget_Line_Items',
      select: 'Project_Budget_Line_Item_ID',
      filter: `Category_ID=${categoryId}`,
      top: 1,
    });

    if (lineItems.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with line items. Please delete all line items first." },
        { status: 400 }
      );
    }

    // Delete the category
    await mp.deleteTableRecords(
      'Project_Budget_Categories',
      [parseInt(categoryId, 10)],
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
