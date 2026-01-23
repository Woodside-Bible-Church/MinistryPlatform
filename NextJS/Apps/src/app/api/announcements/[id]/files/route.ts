import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMPAccessToken, getMPBaseUrl } from "@/lib/mpAuth";

// Configure route for file uploads
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Upload files to an announcement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("📤 File upload request received for announcement");

  try {
    const session = await auth();
    if (!session) {
      console.error("❌ Upload failed: No access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get OAuth token using client credentials
    const accessToken = await getMPAccessToken();
    const baseUrl = getMPBaseUrl();

    const { id } = await params;
    console.log(`📋 Processing upload for announcement ${id}`);

    const formData = await request.formData();

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

      // Set as default image for the announcement
      const isDefault = formData.get("isDefault");
      if (isDefault === "true") {
        fileFormData.append("isDefaultImage", "true");
      }

      // Upload to Announcements table
      const uploadUrl = `${baseUrl}/files/Announcements/${id}?$default=true`;
      console.log(`  ⬆️  File ${index + 1}/${files.length}: ${file.name} → ${uploadUrl}`);

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
    const filesWithUrls = uploadedFiles.flat().map((file: any) => ({
      ...file,
      publicUrl: `${baseUrl.replace('/ministryplatformapi', '')}/ministryplatformapi/files/${file.UniqueFileId || file.Unique_File_ID}`,
    }));

    console.log(`🎉 All ${filesWithUrls.length} file(s) uploaded successfully`);
    return NextResponse.json(filesWithUrls);
  } catch (error) {
    console.error("💥 Error uploading announcement files:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 }
    );
  }
}
