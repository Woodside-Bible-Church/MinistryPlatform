import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMinistryPlatformClient } from "@/providers/MinistryPlatform/ministryPlatformProvider";

// Upload files to a transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, transactionId } = await params;
    const formData = await request.formData();
    const mpClient = getMinistryPlatformClient(session);

    // Get files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Upload files to MinistryPlatform
    const uploadedFiles = await mpClient.files.uploadFiles(
      "Project_Budget_Transactions",
      parseInt(transactionId),
      files,
      {
        description: formData.get("description")?.toString(),
      }
    );

    // Return files with public URLs
    const filesWithUrls = uploadedFiles.map(file => ({
      ...file,
      publicUrl: `${process.env.MINISTRY_PLATFORM_BASE_URL}/ministryplatformapi/files/${file.UniqueFileId}`
    }));

    return NextResponse.json(filesWithUrls);
  } catch (error) {
    console.error("Error uploading transaction files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}

// Get files for a transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, transactionId } = await params;
    const mpClient = getMinistryPlatformClient(session);

    const files = await mpClient.files.getFilesByRecord(
      "Project_Budget_Transactions",
      parseInt(transactionId)
    );

    // Add public URLs
    const filesWithUrls = files.map(file => ({
      ...file,
      publicUrl: `${process.env.MINISTRY_PLATFORM_BASE_URL}/ministryplatformapi/files/${file.UniqueFileId}`
    }));

    return NextResponse.json(filesWithUrls);
  } catch (error) {
    console.error("Error fetching transaction files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
