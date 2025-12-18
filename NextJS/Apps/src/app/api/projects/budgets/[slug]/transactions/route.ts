import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMPAccessToken, getMPBaseUrl, checkBudgetAppAccess } from "@/lib/mpAuth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to access the Budget app
    const { hasAccess } = await checkBudgetAppAccess();

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access the Budget app" },
        { status: 403 }
      );
    }

    const { slug } = await params;

    // Get OAuth token using client credentials (app credentials, not user token)
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    // Call the MinistryPlatform stored procedure
    const mpUrl = `${baseUrl}/procs/api_Custom_GetProjectTransactions_JSON?@Slug=${encodeURIComponent(slug)}`;

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
