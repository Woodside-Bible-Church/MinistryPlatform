import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// Upload files to a transaction
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId } = await params;
    const formData = await request.formData();
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

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

    // Get Page_ID for Project_Budget_Transactions table
    const pageResponse = await fetch(
      `${baseUrl}/tables/dp_Pages?$filter=Table_Name='Project_Budget_Transactions'&$select=Page_ID`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!pageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to get page ID" },
        { status: 500 }
      );
    }

    const pageData = await pageResponse.json();
    if (!pageData || pageData.length === 0) {
      return NextResponse.json(
        { error: "Page not found for table" },
        { status: 404 }
      );
    }

    const pageId = pageData[0].Page_ID;

    // Upload files using MP Files API
    const uploadPromises = files.map(async (file) => {
      const fileFormData = new FormData();
      fileFormData.append("file", file);
      fileFormData.append("PageId", pageId.toString());
      fileFormData.append("RecordId", transactionId);
      if (formData.get("description")) {
        fileFormData.append("Description", formData.get("description") as string);
      }

      const uploadResponse = await fetch(`${baseUrl}/files`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: fileFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${file.name}`);
      }

      return uploadResponse.json();
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Return files with public URLs
    const filesWithUrls = uploadedFiles.map((file) => ({
      ...file,
      publicUrl: `${baseUrl}/ministryplatformapi/files/${file.Unique_File_ID}`,
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
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId } = await params;
    const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL;

    // Get files using MP Files API
    const filesUrl = `${baseUrl}/tables/dp_Files?$filter=Record_ID=${transactionId} AND Page_ID=(SELECT Page_ID FROM dp_Pages WHERE Table_Name='Project_Budget_Transactions')&$select=File_ID,File_Name,File_Size,Unique_File_ID,Description,Last_Updated`;

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
    console.error("Error fetching transaction files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}
