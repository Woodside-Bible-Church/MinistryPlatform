import { NextRequest, NextResponse } from "next/server";
import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { checkRsvpAppAccess } from "@/lib/mpAuth";
import { getUserIdFromSession } from "@/utils/auth";

/**
 * GET /api/rsvp/events/[eventId]/files
 * Get all files attached to an event
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { hasAccess } = await checkRsvpAppAccess();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to access the RSVP app" },
        { status: 403 }
      );
    }

    const { eventId: id } = await params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    const response = await mp.get(`/files/Events/${eventId}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching event files:", error);
    return NextResponse.json(
      { error: "Failed to fetch event files" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rsvp/events/[eventId]/files
 * Upload a campus image file for the event
 *
 * Expected form data:
 * - file: The image file to upload
 * - fileName: Must be "Campus_Image.jpg"
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { hasAccess, canEdit } = await checkRsvpAppAccess();
    if (!hasAccess || !canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to upload files in the RSVP app" },
        { status: 403 }
      );
    }

    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const { eventId: id } = await params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
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

    if (!fileName || fileName !== "Campus_Image.jpg") {
      return NextResponse.json(
        { error: "Invalid file name. Must be 'Campus_Image.jpg'" },
        { status: 400 }
      );
    }

    const mp = new MinistryPlatformClient();
    await mp.ensureValidToken();

    // Get existing files to check for duplicates
    const existingFiles = (await mp.get(`/files/Events/${eventId}`)) as any[];
    const existingFile = existingFiles.find((f: any) => f.FileName === fileName);

    // If file exists, delete it first
    if (existingFile) {
      console.log(`Deleting existing file: ${fileName} (File_ID: ${existingFile.FileId})`);
      await mp.delete(`/files/${existingFile.FileId}`, { $userId: userId });
    }

    // Upload the new file
    const fileBuffer = await file.arrayBuffer();
    const renamedFile = new File([fileBuffer], fileName, { type: file.type });

    const uploadFormData = new FormData();
    uploadFormData.append("file", renamedFile);
    uploadFormData.append("description", "Campus Image");

    const uploadResponse = await mp.postFormData(
      `/files/Events/${eventId}`,
      uploadFormData,
      { $default: true, $userId: userId }
    );

    console.log(`Successfully uploaded ${fileName} for event ${eventId}`);

    return NextResponse.json(uploadResponse);
  } catch (error) {
    console.error("Error uploading event file:", error);
    return NextResponse.json(
      { error: "Failed to upload event file" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rsvp/events/[eventId]/files?fileId={fileId}
 * Delete a specific file by File_ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { hasAccess, canDelete } = await checkRsvpAppAccess();
    if (!hasAccess || !canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You don't have permission to delete files in the RSVP app" },
        { status: 403 }
      );
    }

    const userId = await getUserIdFromSession();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }

    const { eventId: id } = await params;
    const eventId = parseInt(id, 10);

    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
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

    await mp.delete(`/files/${fileId}`, { $userId: userId });

    console.log(`Successfully deleted file ${fileId} for event ${eventId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event file:", error);
    return NextResponse.json(
      { error: "Failed to delete event file" },
      { status: 500 }
    );
  }
}
