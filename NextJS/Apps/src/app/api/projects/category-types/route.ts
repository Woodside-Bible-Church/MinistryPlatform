import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ProjectsService } from "@/services/projectsService";
import { ProjectCategoryType } from "@/types/projects";

// GET /api/projects/category-types - Get all project category types
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectsService = new ProjectsService();
    const categoryTypes = await projectsService.getCategoryTypes();

    return NextResponse.json(categoryTypes);
  } catch (error) {
    console.error("Error fetching category types:", error);
    return NextResponse.json(
      { error: "Failed to fetch category types" },
      { status: 500 }
    );
  }
}
