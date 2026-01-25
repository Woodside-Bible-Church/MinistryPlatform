import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CancellationsService } from "@/services/cancellationsService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { CancellationFormData } from "@/types/cancellations";

// GET /api/cancellations/[id] - Get single cancellation
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
    const cancellation = await service.getCancellationById(cancellationId);

    if (!cancellation) {
      return NextResponse.json(
        { error: "Cancellation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(cancellation);
  } catch (error) {
    console.error("Error fetching cancellation:", error);
    return NextResponse.json(
      { error: "Failed to fetch cancellation" },
      { status: 500 }
    );
  }
}

// PUT /api/cancellations/[id] - Update cancellation
export async function PUT(
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
    console.log("Updating cancellation ID:", cancellationId);

    if (isNaN(cancellationId)) {
      return NextResponse.json(
        { error: "Invalid cancellation ID" },
        { status: 400 }
      );
    }

    const body: CancellationFormData = await request.json();
    console.log("Update data:", body);

    // Validate required fields
    if (!body.congregationID || !body.statusID || !body.startDate) {
      console.error("Missing required fields:", { congregationID: body.congregationID, statusID: body.statusID, startDate: body.startDate });
      return NextResponse.json(
        { error: "Missing required fields: congregationID, statusID, startDate" },
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
    console.log("Updating with user ID:", userId);

    const service = new CancellationsService();
    await service.updateCancellation(cancellationId, body, userId);
    console.log("Update successful");

    // Fetch and return the updated cancellation
    const updated = await service.getCancellationById(cancellationId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating cancellation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error details:", errorMessage);
    return NextResponse.json(
      { error: "Failed to update cancellation", details: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/cancellations/[id] - Delete cancellation
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
    await service.deleteCancellation(cancellationId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cancellation:", error);
    return NextResponse.json(
      { error: "Failed to delete cancellation" },
      { status: 500 }
    );
  }
}

// PATCH /api/cancellations/[id] - End cancellation (set end date)
export async function PATCH(
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
    await service.endCancellation(cancellationId, userId);

    // Fetch and return the updated cancellation
    const updated = await service.getCancellationById(cancellationId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error ending cancellation:", error);
    return NextResponse.json(
      { error: "Failed to end cancellation" },
      { status: 500 }
    );
  }
}
