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
    const mpUrl = `${baseUrl}/procs/api_Custom_GetProjectBudgetDetails_JSON?@Slug=${encodeURIComponent(slug)}`;

    const response = await fetch(mpUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("MP API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch project details" },
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
          const projectData = JSON.parse(row.JsonResult);

          // Parse nested JSON strings from SQL Server FOR JSON
          // Parse lineItems within expenseCategories
          if (projectData.expenseCategories) {
            projectData.expenseCategories = projectData.expenseCategories.map((cat: any) => {
              if (cat.lineItems && typeof cat.lineItems === 'string') {
                cat.lineItems = JSON.parse(cat.lineItems);
              }
              return cat;
            });
          }

          // Parse lineItems within incomeLineItemsCategories
          if (projectData.incomeLineItemsCategories) {
            projectData.incomeLineItemsCategories = projectData.incomeLineItemsCategories.map((cat: any) => {
              if (cat.lineItems && typeof cat.lineItems === 'string') {
                cat.lineItems = JSON.parse(cat.lineItems);
              }
              return cat;
            });
          }

          // Parse registrationIncomeCategory (it's a JSON string from FOR JSON WITHOUT_ARRAY_WRAPPER)
          if (projectData.registrationIncomeCategory && typeof projectData.registrationIncomeCategory === 'string') {
            projectData.registrationIncomeCategory = JSON.parse(projectData.registrationIncomeCategory);

            // Parse lineItems within registrationIncomeCategory
            if (projectData.registrationIncomeCategory.lineItems && typeof projectData.registrationIncomeCategory.lineItems === 'string') {
              projectData.registrationIncomeCategory.lineItems = JSON.parse(projectData.registrationIncomeCategory.lineItems);
            }
          }

          // Parse registrationDiscountsCategory (it's a JSON string from FOR JSON WITHOUT_ARRAY_WRAPPER)
          if (projectData.registrationDiscountsCategory && typeof projectData.registrationDiscountsCategory === 'string') {
            projectData.registrationDiscountsCategory = JSON.parse(projectData.registrationDiscountsCategory);

            // Parse lineItems within registrationDiscountsCategory
            if (projectData.registrationDiscountsCategory.lineItems && typeof projectData.registrationDiscountsCategory.lineItems === 'string') {
              projectData.registrationDiscountsCategory.lineItems = JSON.parse(projectData.registrationDiscountsCategory.lineItems);
            }
          }

          return NextResponse.json(projectData);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("JsonResult:", row.JsonResult);
          return NextResponse.json(
            { error: "Failed to parse project data" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Project not found" },
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
