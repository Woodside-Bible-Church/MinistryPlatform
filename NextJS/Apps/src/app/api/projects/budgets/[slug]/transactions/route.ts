import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;

    // Call the MinistryPlatform stored procedure
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    const mpUrl = `${baseUrl}/procs/api_Custom_GetProjectTransactions_JSON?@Slug=${encodeURIComponent(slug)}`;

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("MP API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle the JsonResult format from the stored procedure
    // MP returns: [[{ "JsonResult": "{...}" }]]
    if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0]) {
      const row = data[0][0];

      // Check for error in JsonResult
      if (row.error) {
        return NextResponse.json({ error: row.error }, { status: 404 });
      }

      // Parse the JsonResult column
      if (row.JsonResult) {
        try {
          const transactionsData = JSON.parse(row.JsonResult);

          // Parse nested transactions array (it's a JSON string from SQL Server FOR JSON)
          if (transactionsData.transactions && typeof transactionsData.transactions === 'string') {
            transactionsData.transactions = JSON.parse(transactionsData.transactions);
          }

          return NextResponse.json(transactionsData);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("JsonResult:", row.JsonResult);
          return NextResponse.json(
            { error: "Failed to parse transactions data" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "No transactions found" },
      { status: 404 }
    );
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
