import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Configure route for file uploads
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upload files to a transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  console.log("📤 File upload request received for transaction");

  try {
    const session = await auth();
    if (!session?.accessToken) {
      console.error("❌ Upload failed: No access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId } = await params;
    console.log(`📋 Processing upload for transaction ${transactionId}`);

    const formData = await request.formData();
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

    // Upload files using MP Files API directly
    const uploadPromises = files.map(async (file, index) => {
      const fileFormData = new FormData();
      fileFormData.append("file", file);
      if (formData.get("description")) {
        fileFormData.append("description", formData.get("description") as string);
      }

      const uploadUrl = `${baseUrl}/files/Project_Budget_Transactions/${transactionId}`;
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
      console.log(`  ✅ File ${index + 1} uploaded successfully`);
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
    console.error("💥 Error uploading transaction files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
