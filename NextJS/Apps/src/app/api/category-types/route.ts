import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'expense' or 'revenue'

    const mp = new MPHelper();

    let filter = 'Discontinued=0';
    if (type === 'expense') {
      filter += ' AND Is_Revenue=0';
    } else if (type === 'revenue') {
      filter += ' AND Is_Revenue=1';
    }

    const categoryTypes = await mp.getTableRecords<{
      Project_Category_Type_ID: number;
      Project_Category_Type: string;
      Is_Revenue: boolean;
    }>({
      table: 'Project_Category_Types',
      select: 'Project_Category_Type_ID,Project_Category_Type,Is_Revenue',
      filter,
      orderBy: 'Sort_Order,Project_Category_Type',
    });

    return NextResponse.json(categoryTypes);
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
