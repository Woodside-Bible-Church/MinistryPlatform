import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CancellationsService } from "@/services/cancellationsService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { CancellationUpdateFormData } from "@/types/cancellations";

// GET /api/cancellations/[id]/updates - Get updates for a cancellation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cancellationId = parseInt(id);

    if (isNaN(cancellationId)) {
      return NextResponse.json(
        { error: "Invalid cancellation ID" },
        { status: 400 }
      );
    }

    const service = new CancellationsService();
    const updates = await service.getUpdatesForCancellation(cancellationId);

    return NextResponse.json(updates);
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}

// POST /api/cancellations/[id]/updates - Add update to cancellation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cancellationId = parseInt(id);

    if (isNaN(cancellationId)) {
      return NextResponse.json(
        { error: "Invalid cancellation ID" },
        { status: 400 }
      );
    }

    const body: CancellationUpdateFormData = await request.json();

    // Validate required fields
    if (!body.message || body.message.trim() === "") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get User_ID for audit logging
    const mp = new MPHelper();
    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      select: "User_ID",
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].User_ID;

    const service = new CancellationsService();
    const newUpdate = await service.addUpdate(cancellationId, body, userId);

    return NextResponse.json(newUpdate, { status: 201 });
  } catch (error) {
    console.error("Error adding update:", error);
    return NextResponse.json(
      { error: "Failed to add update" },
      { status: 500 }
    );
  }
}

// DELETE /api/cancellations/[id]/updates?updateId=123 - Delete update
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const cancellationId = parseInt(id);

    if (isNaN(cancellationId)) {
      return NextResponse.json(
        { error: "Invalid cancellation ID" },
        { status: 400 }
      );
    }

    const updateId = request.nextUrl.searchParams.get("updateId");
    if (!updateId) {
      return NextResponse.json(
        { error: "Missing updateId query parameter" },
        { status: 400 }
      );
    }

    // Get User_ID for audit logging
    const mp = new MPHelper();
    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      select: "User_ID",
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].User_ID;

    const service = new CancellationsService();
    await service.deleteUpdate(parseInt(updateId), userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting update:", error);
    return NextResponse.json(
      { error: "Failed to delete update" },
      { status: 500 }
    );
  }
}
