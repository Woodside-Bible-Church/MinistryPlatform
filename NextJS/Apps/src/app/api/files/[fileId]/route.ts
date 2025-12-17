import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Update file metadata (name and/or description)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  console.log("📝 File update request received");

  try {
    const session = await auth();
    if (!session?.accessToken) {
      console.error("❌ Update failed: No access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    console.log(`📋 Updating file ${fileId}`);

    const { searchParams } = new URL(request.url);
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

    // Build URL with query parameters (use /files/ not /ministryplatformapi/files/)
    const updateUrl = new URL(`${baseUrl}/files/${fileId}`);

    // Copy query parameters from request (note: MP API uses $ prefix)
    const fileName = searchParams.get("fileName");
    const description = searchParams.get("description");

    if (fileName) {
      updateUrl.searchParams.append("$fileName", fileName);
      console.log(`  📄 New file name: ${fileName}`);
    }

    if (description !== null) {
      updateUrl.searchParams.append("$description", description);
      console.log(`  📝 New description: ${description}`);
    }

    console.log(`  🔗 Update URL: ${updateUrl.toString()}`);

    const updateResponse = await fetch(updateUrl.toString(), {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    console.log(`  📊 Response status: ${updateResponse.status}`);

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`❌ File update failed (${updateResponse.status}):`, errorText);
      return NextResponse.json(
        { error: `Failed to update file: ${errorText}` },
        { status: updateResponse.status }
      );
    }

    // Check if response has content
    const contentType = updateResponse.headers.get("content-type");
    let result;

    if (contentType && contentType.includes("application/json")) {
      result = await updateResponse.json();
    } else {
      // If no JSON response, just return success
      result = { success: true };
    }

    console.log(`✅ File ${fileId} updated successfully`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("💥 Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}

// Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  console.log("🗑️  File delete request received");

  try {
    const session = await auth();
    if (!session?.accessToken) {
      console.error("❌ Delete failed: No access token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    console.log(`📋 Deleting file ${fileId}`);

    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;
    const deleteUrl = `${baseUrl}/files/${fileId}`;

    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error(`❌ File delete failed (${deleteResponse.status}):`, errorText);
      return NextResponse.json(
        { error: `Failed to delete file: ${errorText}` },
        { status: deleteResponse.status }
      );
    }

    console.log(`✅ File ${fileId} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("💥 Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
