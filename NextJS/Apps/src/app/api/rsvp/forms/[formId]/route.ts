import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";

/**
 * GET /api/rsvp/forms/[formId]
 * Fetch form fields for a given form ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ formId: string }> }
) {
  try {
    const { formId } = await context.params;

    // Initialize MinistryPlatform client
    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();
    const tableService = new TableService(mp);

    // Fetch form fields from MinistryPlatform (only non-hidden fields)
    const formFields = await tableService.getTableRecords("Form_Fields", {
      $filter: `Form_ID=${formId} AND Is_Hidden=0`,
      $select: "Form_Field_ID,Field_Order,Field_Label",
      $orderby: "Field_Order",
    });

    return NextResponse.json(formFields);
  } catch (error) {
    console.error("Error fetching form fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch form fields" },
      { status: 500 }
    );
  }
}
