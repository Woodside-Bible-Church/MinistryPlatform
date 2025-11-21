import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";

/**
 * GET /api/rsvp/templates
 * Fetch email/communication templates with pagination and search
 */
export async function GET(request: NextRequest) {
  // Fixed: Query only Communication_Template_ID and Template_Name from dp_Communication_Templates
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "both"; // 'email', 'communication', or 'both'

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();
    const tableService = new TableService(mp);

    // Build search filter
    let searchFilter = "";
    if (search) {
      searchFilter = `Template_Name LIKE '%${search}%'`;
    }

    // Fetch templates
    const result = await tableService.getTableRecords<{
      Communication_Template_ID: number;
      Template_Name: string;
    }>("dp_Communication_Templates", {
      $select: "Communication_Template_ID, Template_Name",
      $filter: searchFilter || undefined,
      $orderby: "Template_Name ASC",
      $top: pageSize,
      $skip: (page - 1) * pageSize,
    });

    // Get total count for pagination
    // Note: Must set a high $top value because MinistryPlatform defaults to 20 if not specified
    const countResult = await tableService.getTableRecords<{ Communication_Template_ID: number }>(
      "dp_Communication_Templates",
      {
        $select: "Communication_Template_ID",
        $filter: searchFilter || undefined,
        $top: 10000, // Get all records for accurate count
      }
    );

    const response = {
      templates: result.map(t => ({
        Template_ID: t.Communication_Template_ID,
        Template_Name: t.Template_Name,
      })),
      total: countResult.length,
      page,
      pageSize,
      hasMore: countResult.length > page * pageSize,
    };

    console.log(`Templates API: page=${page}, returned=${result.length}, total=${countResult.length}, hasMore=${response.hasMore}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
