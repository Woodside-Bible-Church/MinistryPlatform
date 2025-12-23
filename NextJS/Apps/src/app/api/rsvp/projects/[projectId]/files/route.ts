import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { checkRsvpAppAccess } from "@/lib/mpAuth";
import { getUserIdFromSession } from "@/utils/auth";

/**
 * GET /api/rsvp/projects/[projectId]/files
 * Get all files attached to a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check if user has access to the RSVP app
    const { hasAccess } = await checkRsvpAppAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access the RSVP app" },
        { status: 403 }
      );
    }

    const { projectId: id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Get all files for this project
    const response = await mp.get(`/files/Projects/${projectId}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching project files:", error);
    return NextResponse.json(
      { error: "Failed to fetch project files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rsvp/projects/[projectId]/files
 * Upload a new image file for the project
 *
 * Expected form data:
 * - file: The image file to upload
 * - fileName: Either "RSVP_Image.jpg" or "RSVP_BG_Image.jpg"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check if user has permission to edit (upload files)
    const { hasAccess, canEdit } = await checkRsvpAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to upload files in the RSVP app" },
        { status: 403 }
      );
    }

    // Get User_ID for auditing
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const { projectId: id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileName = formData.get("fileName") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!fileName || !["RSVP_Image.jpg", "RSVP_BG_Image.jpg"].includes(fileName)) {
      return NextResponse.json(
        { error: "Invalid file name. Must be 'RSVP_Image.jpg' or 'RSVP_BG_Image.jpg'" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Step 1: Get existing files to see if this file already exists
    const existingFiles = (await mp.get(`/files/Projects/${projectId}`)) as any[];
    const existingFile = existingFiles.find((f: any) => f.FileName === fileName);

    // Step 2: If file exists, delete it first
    if (existingFile) {
      console.log(`Deleting existing file: ${fileName} (File_ID: ${existingFile.FileId})`);
      await mp.delete(`/files/${existingFile.FileId}`, { $userId: userId });
    }

    // Step 3: Upload the new file with the correct filename
    // Create a new File object with the correct name (RSVP_Image.jpg or RSVP_BG_Image.jpg)
    const fileBuffer = await file.arrayBuffer();
    const renamedFile = new File([fileBuffer], fileName, { type: file.type });

    const uploadFormData = new FormData();
    uploadFormData.append("file", renamedFile);
    uploadFormData.append("description", fileName === "RSVP_Image.jpg" ? "RSVP Image" : "RSVP Background Image");

    const uploadResponse = await mp.postFormData(
      `/files/Projects/${projectId}`,
      uploadFormData,
      { $default: false, $userId: userId } // Pass default and userId as query parameters
    );

    console.log(`Successfully uploaded ${fileName} for project ${projectId}`);

    return NextResponse.json(uploadResponse);
  } catch (error) {
    console.error("Error uploading project file:", error);
    return NextResponse.json(
      { error: "Failed to upload project file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rsvp/projects/[projectId]/files?fileId={fileId}
 * Delete a specific file by File_ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Check if user has permission to delete
    const { hasAccess, canDelete } = await checkRsvpAppAccess();
    if (!hasAccess || !canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to delete files in the RSVP app" },
        { status: 403 }
      );
    }

    // Get User_ID for auditing
    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const { projectId: id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { error: "No fileId provided" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Delete the file
    await mp.delete(`/files/${fileId}`, { $userId: userId });

    console.log(`Successfully deleted file ${fileId} for project ${projectId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project file:", error);
    return NextResponse.json(
      { error: "Failed to delete project file" },
      { status: 500 }
    );
  }
}
