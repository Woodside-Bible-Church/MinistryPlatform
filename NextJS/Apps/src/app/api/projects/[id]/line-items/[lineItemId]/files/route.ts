import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Configure route for file uploads
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upload files to a line item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  console.log("📤 File upload request received");

  try {
    const session = await auth();
    if (!session?.accessToken) {
      console.error("❌ Upload failed: No access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineItemId } = await params;
    console.log(`📋 Processing upload for line item ${lineItemId}`);

    const formData = await request.formData();
    console.log("📦 FormData received, parsing files...");
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

    // Get files from form data
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
        console.log(`  📄 Found file: ${value.name} (${value.size} bytes)`);
      }
    }

    if (files.length === 0) {
      console.error("❌ No files found in FormData");
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    console.log(`✅ Found ${files.length} file(s) to upload`);

    // Upload files using MP Files API directly (no Page_ID lookup needed)
    // MinistryPlatform expects POST /files/{table}/{recordId} format
    console.log(`🚀 Uploading to MinistryPlatform...`);
    const uploadPromises = files.map(async (file, index) => {
      const fileFormData = new FormData();
      fileFormData.append("file", file);
      if (formData.get("description")) {
        fileFormData.append("description", formData.get("description") as string);
      }

      const uploadUrl = `${baseUrl}/files/Project_Budget_Line_Items/${lineItemId}`;
      console.log(`  ⬆️  File ${index + 1}/${files.length}: ${file.name} → ${uploadUrl}`);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: fileFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error(`❌ File ${index + 1} upload failed (${uploadResponse.status}):`, errorText);
        throw new Error(`Failed to upload file: ${file.name}`);
      }

      const result = await uploadResponse.json();
      console.log(`  ✅ File ${index + 1} uploaded successfully:`, result);
      return result;
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Return files with public URLs
    const filesWithUrls = uploadedFiles.map((file) => ({
      ...file,
      publicUrl: `${baseUrl}/ministryplatformapi/files/${file.Unique_File_ID}`,
    }));

    console.log(`🎉 All ${filesWithUrls.length} file(s) uploaded successfully`);
    return NextResponse.json(filesWithUrls);
  } catch (error) {
    console.error("💥 Error uploading line item files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}

// Get files for a line item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lineItemId } = await params;
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

    // Get files using MP Files API
    const filesUrl = `${baseUrl}/tables/dp_Files?$filter=Record_ID=${lineItemId} AND Page_ID=(SELECT Page_ID FROM dp_Pages WHERE Table_Name='Project_Budget_Line_Items')&$select=File_ID,File_Name,File_Size,Unique_File_ID,Description,Last_Updated`;

    const filesResponse = await fetch(filesUrl, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!filesResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: filesResponse.status }
      );
    }

    const filesData = await filesResponse.json();

    // Add public URLs
    const filesWithUrls = filesData.map((file: {
      File_ID: number;
      File_Name: string;
      File_Size: number;
      Unique_File_ID: string;
      Description: string;
      Last_Updated: string;
    }) => ({
      FileId: file.File_ID,
      FileName: file.File_Name,
      FileSize: file.File_Size,
      UniqueFileId: file.Unique_File_ID,
      Description: file.Description,
      LastUpdated: file.Last_Updated,
      publicUrl: `${baseUrl}/ministryplatformapi/files/${file.Unique_File_ID}`,
    }));

    return NextResponse.json(filesWithUrls);
  } catch (error) {
    console.error("Error fetching line item files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
