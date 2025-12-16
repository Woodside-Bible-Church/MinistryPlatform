import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineItemId } = await params;
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

    // Get line item details with category info, purchase requests, and transactions
    const mpUrl = `${baseUrl}/procs/api_Custom_GetLineItemDetails_JSON?@LineItemID=${lineItemId}`;

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("MP API error:", response.status, response.statusText);
      console.error("Error response body:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch line item details", details: errorText },
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
          const lineItem = JSON.parse(row.JsonResult);

          // Get files attached to this line item
          try {
            const filesUrl = `${baseUrl}/tables/dp_Files?$filter=Record_ID=${lineItemId} AND Page_ID=(SELECT Page_ID FROM dp_Pages WHERE Table_Name='Project_Budget_Line_Items')&$select=File_ID,File_Name,File_Size,Unique_File_ID,Description,Last_Updated`;

            const filesResponse = await fetch(filesUrl, {
              headers: {
                Authorization: `Bearer ${session.accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (filesResponse.ok) {
              const filesData = await filesResponse.json();
              // Add public URLs
              lineItem.files = filesData.map((file: any) => ({
                FileId: file.File_ID,
                FileName: file.File_Name,
                FileSize: file.File_Size,
                UniqueFileId: file.Unique_File_ID,
                Description: file.Description,
                LastUpdated: file.Last_Updated,
                publicUrl: `${baseUrl}/ministryplatformapi/files/${file.Unique_File_ID}`
              }));
            } else {
              lineItem.files = [];
            }
          } catch (error) {
            // No files attached, that's okay
            lineItem.files = [];
          }

          return NextResponse.json(lineItem);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("JsonResult:", row.JsonResult);
          return NextResponse.json(
            { error: "Failed to parse line item data" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Line item not found" },
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
