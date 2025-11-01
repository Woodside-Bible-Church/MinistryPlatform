import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    if (!baseUrl) {
      throw new Error("MINISTRY_PLATFORM_BASE_URL is not configured");
    }

    let data;

    // If no session, return empty array
    // Public apps are currently inactive (Is_Active = 0)
    // TODO: Enable database-driven public apps once OAuth client credentials are configured
    if (!session?.user?.email) {
      return NextResponse.json([]);
    }

    // Check if user is an administrator
    const isAdmin = session.roles?.includes("Administrators");

    if (isAdmin) {
      // Admins can see all active applications - query table directly
      // Note: Requires_Authentication and Public_Features are optional fields added by migration
      const response = await fetch(
        `${baseUrl}/tables/Applications?$select=Application_ID,Application_Name,Application_Key,Description,Icon,Route,Sort_Order,Is_Active&$filter=Is_Active=1&$orderby=Sort_Order`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error("MP API Error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      // Direct table query returns array directly
      const applications = await response.json();
      return NextResponse.json(applications);
    } else {
      // Regular users - use stored procedure to filter by user groups
      const response = await fetch(
        `${baseUrl}/procs/api_Custom_Platform_GetUserApplications_JSON`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            "@UserName": session.user.email,
            "@DomainID": 1,
          }),
        }
      );

      if (!response.ok) {
        console.error("MP API Error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error details:", errorText);
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      data = await response.json();
    }

    // MinistryPlatform stored procedures with FOR JSON PATH return data in a nested format
    // Structure: [[{ "JSON_GUID": "[{actual data}]" }]]
    let applications: any[] = [];

    if (Array.isArray(data) && data.length > 0) {
      let firstItem = data[0];

      // Handle double-nested array: [[{ "GUID": "json" }]]
      if (Array.isArray(firstItem) && firstItem.length > 0) {
        firstItem = firstItem[0];
      }

      // Check if it's an object with a GUID key containing JSON string
      if (typeof firstItem === 'object' && !Array.isArray(firstItem)) {
        // Get the first property value (the GUID key)
        const jsonString = Object.values(firstItem)[0];

        // If it's a string, parse it as JSON
        if (typeof jsonString === 'string') {
          try {
            applications = JSON.parse(jsonString);
          } catch (e) {
            console.error("Failed to parse JSON string:", e);
            applications = [];
          }
        } else if (Array.isArray(jsonString)) {
          applications = jsonString;
        }
      } else if (Array.isArray(firstItem)) {
        // Handle nested array case
        applications = firstItem;
      } else {
        // Handle direct array case
        applications = data;
      }
    }

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
