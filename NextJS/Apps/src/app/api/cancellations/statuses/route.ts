import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CancellationsService } from "@/services/cancellationsService";

// GET /api/cancellations/statuses - Get cancellation statuses for dropdown
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const service = new CancellationsService();
    const statuses = await service.getCancellationStatuses();

    return NextResponse.json(statuses);
  } catch (error) {
    console.error("Error fetching statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch statuses" },
      { status: 500 }
    );
  }
}
