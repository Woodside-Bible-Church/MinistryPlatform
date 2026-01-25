import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CancellationsService } from "@/services/cancellationsService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { CancellationFormData } from "@/types/cancellations";

// GET /api/cancellations - List cancellations with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const congregationID = searchParams.get("congregationID");
    const activeOnly = searchParams.get("activeOnly");

    console.log("Fetching cancellations with params:", { congregationID, activeOnly });

    const service = new CancellationsService();

    const cancellations = await service.getCancellations({
      congregationID: congregationID ? parseInt(congregationID) : undefined,
      activeOnly: activeOnly === "true",
    });

    console.log("Fetched cancellations:", cancellations.length);

    return NextResponse.json(cancellations);
  } catch (error) {
    console.error("Error fetching cancellations:", error);
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: "Failed to fetch cancellations", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/cancellations - Create new cancellation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body: CancellationFormData = await request.json();
    console.log("Creating cancellation with data:", body);

    // Validate required fields
    if (!body.congregationID || !body.statusID || !body.startDate) {
      return NextResponse.json(
        { error: "Missing required fields: congregationID, statusID, startDate" },
        { status: 400 }
      );
    }

    // Validate dates
    if (body.endDate) {
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);
      if (endDate < startDate) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 }
        );
      }
    }

    // Get User_ID for audit logging
    console.log("Getting user ID for session:", session.sub);
    const mp = new MPHelper();
    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: "dp_Users",
      select: "User_ID",
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      console.error("User not found for GUID:", session.sub);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = users[0].User_ID;
    console.log("Found user ID:", userId);

    const service = new CancellationsService();
    const newCancellation = await service.createCancellation(body, userId);
    console.log("Created cancellation:", newCancellation);

    return NextResponse.json(newCancellation, { status: 201 });
  } catch (error) {
    console.error("Error creating cancellation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { error: "Failed to create cancellation", details: errorMessage },
      { status: 500 }
    );
  }
}
