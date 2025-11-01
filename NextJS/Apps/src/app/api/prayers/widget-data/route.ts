import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserService } from "@/services/userService";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";

/**
 * Recursively parse nested JSON strings from MinistryPlatform stored procedures
 * MP stored procs often return JSON strings within JSON strings
 */
function deepParseJson(obj: any): any {
  if (typeof obj === 'string') {
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(obj);
      // Recursively parse the result
      return deepParseJson(parsed);
    } catch {
      // Not JSON, return as is
      return obj;
    }
  } else if (Array.isArray(obj)) {
    return obj.map(item => deepParseJson(item));
  } else if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      result[key] = deepParseJson(obj[key]);
    }
    return result;
  }
  return obj;
}

// GET /api/prayers/widget-data - Get all prayer data via stored procedure
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Get user's Contact_ID if authenticated
    let contactId = 0;
    if (session?.user?.id) {
      const userService = await UserService.getInstance();
      const userProfile = await userService.getUserProfile(session.user.id);
      contactId = userProfile.Contact_ID;
    }

    // Call stored procedure via MinistryPlatform client
    const client = new MinistryPlatformClient();
    await client.ensureValidToken();
    const httpClient = client.getHttpClient();

    // Call the stored procedure
    // MP stored procs are called via POST to /procs/{procName}
    const result = await httpClient.post<any[]>(
      "/procs/api_Custom_Prayer_Widget_Data_JSON",
      {
        "@ContactID": contactId,
        "@DomainID": 1,
      }
    );

    // MinistryPlatform returns double-nested arrays: [[{"JsonResult": "..."}]]
    // Need to access result[0][0].JsonResult
    console.log("=== STORED PROC RAW RESULT ===");
    console.log("Result array length:", result?.length);
    console.log("Result[0] is array:", Array.isArray(result?.[0]));
    console.log("Result[0] length:", Array.isArray(result?.[0]) ? result[0].length : "N/A");

    if (!result || result.length === 0 || !result[0] || !Array.isArray(result[0]) || result[0].length === 0 || !result[0][0] || !result[0][0].JsonResult) {
      console.log("No valid data from stored procedure - structure doesn't match [[{JsonResult}]]");
      console.log("Result structure:", JSON.stringify(result, null, 2));
      return NextResponse.json({
        My_Requests: { Items: [] },
        Community_Needs: { Items: [] },
        Prayer_Partners: { Items: [] },
        User_Stats: null,
      });
    }

    // Extract the JsonResult from the double-nested array wrapper
    const jsonResultString = result[0][0].JsonResult;
    console.log("JsonResult string found:", !!jsonResultString);
    console.log("JsonResult type:", typeof jsonResultString);
    console.log("JsonResult length:", jsonResultString?.length);

    // Recursively parse all nested JSON strings
    const data = deepParseJson(jsonResultString);
    console.log("=== PARSED DATA ===");
    console.log(JSON.stringify(data, null, 2));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching widget data:", error);
    return NextResponse.json(
      { error: "Failed to fetch widget data" },
      { status: 500 }
    );
  }
}
