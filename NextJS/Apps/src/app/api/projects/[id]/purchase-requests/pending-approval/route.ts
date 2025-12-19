import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMPAccessToken, getMPBaseUrl, checkBudgetAppAccess } from "@/lib/mpAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    // Get OAuth token using client credentials
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    // Use the stored procedure to get pending requests with budget context
    const mpUrl = `${baseUrl}/procs/api_Custom_GetPendingPurchaseRequestsForApproval_JSON?@ProjectID=${projectId}`;

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MP API error:", response.status, response.statusText);
      console.error("Error response body:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch pending purchase requests", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle the JsonResult format from the stored procedure
    // MP returns: [[{ "JsonResult": "{...}" }]]
    if (Array.isArray(data) && data[0] && Array.isArray(data[0]) && data[0][0]) {
      const row = data[0][0];

      // Parse the JsonResult column
      if (row.JsonResult) {
        try {
          const result = JSON.parse(row.JsonResult);

          // Parse nested pendingRequests JSON string if it exists
          if (result.pendingRequests && typeof result.pendingRequests === 'string') {
            result.pendingRequests = JSON.parse(result.pendingRequests);
          } else if (!result.pendingRequests) {
            result.pendingRequests = [];
          }

          return NextResponse.json(result);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("JsonResult:", row.JsonResult);
          return NextResponse.json(
            { error: "Failed to parse pending requests data" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "No data returned from stored procedure" },
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
