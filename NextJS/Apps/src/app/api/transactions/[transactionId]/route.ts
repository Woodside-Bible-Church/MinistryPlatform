import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMPAccessToken, getMPBaseUrl, checkBudgetAppAccess } from "@/lib/mpAuth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
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

    const { transactionId } = await params;

    // Get OAuth token using client credentials (app credentials, not user token)
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    // Use the stored procedure to get transaction details
    const mpUrl = `${baseUrl}/procs/api_Custom_GetTransactionDetails_JSON?@TransactionID=${transactionId}`;

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
        { error: "Failed to fetch transaction details", details: errorText },
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
          const transaction = JSON.parse(row.JsonResult);

          // Validate that we got actual transaction data
          if (!transaction || !transaction.transactionId) {
            return NextResponse.json(
              { error: "Transaction not found" },
              { status: 404 }
            );
          }

          // Get files attached to this transaction
          try {
            const filesUrl = `${baseUrl}/tables/dp_Files?$filter=Record_ID=${transactionId} AND Page_ID=(SELECT Page_ID FROM dp_Pages WHERE Table_Name='Project_Budget_Transactions')&$select=File_ID,File_Name,File_Size,File_Extension,Image_Width,Image_Height,Unique_File_ID,Description,Last_Updated`;

            const filesResponse = await fetch(filesUrl, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (filesResponse.ok) {
              const filesData = await filesResponse.json();
              // Add public URLs
              transaction.files = filesData.map((file: {
                File_ID: number;
                File_Name: string;
                File_Size: number;
                File_Extension: string;
                Image_Width: number | null;
                Image_Height: number | null;
                Unique_File_ID: string;
                Description: string;
                Last_Updated: string;
              }) => ({
                FileId: file.File_ID,
                FileName: file.File_Name,
                FileSize: file.File_Size,
                FileExtension: file.File_Extension,
                ImageWidth: file.Image_Width,
                ImageHeight: file.Image_Height,
                UniqueFileId: file.Unique_File_ID,
                Description: file.Description,
                LastUpdated: file.Last_Updated,
                publicUrl: `${baseUrl}/ministryplatformapi/files/${file.Unique_File_ID}`,
              }));
            } else {
              transaction.files = [];
            }
          } catch {
            // No files attached, that's okay
            transaction.files = [];
          }

          return NextResponse.json(transaction);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("JsonResult:", row.JsonResult);
          return NextResponse.json(
            { error: "Failed to parse transaction data" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Transaction not found" },
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
