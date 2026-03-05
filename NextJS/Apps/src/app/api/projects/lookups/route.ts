import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkProjectsAppAccess } from "@/lib/mpAuth";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type {
  ProjectTypeLookup,
  CongregationLookup,
} from "@/types/projectManagement";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hasAccess } = await checkProjectsAppAccess();
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mp = new MPHelper();

    const [projectTypes, congregations] =
      await Promise.all([
        mp.getTableRecords<ProjectTypeLookup>({
          table: "Project_Types",
          select: "Project_Type_ID, Project_Type",
          orderBy: "Project_Type",
        }),
        mp.getTableRecords<CongregationLookup>({
          table: "Congregations",
          select: "Congregation_ID, Congregation_Name",
          filter: "End_Date IS NULL",
          orderBy: "Congregation_Name",
        }),
      ]);

    return NextResponse.json(
      { projectTypes, congregations },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
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
