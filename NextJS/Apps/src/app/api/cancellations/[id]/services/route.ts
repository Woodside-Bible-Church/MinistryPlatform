import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CancellationsService } from "@/services/cancellationsService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";
import type { CancellationServiceFormData } from "@/types/cancellations";

// GET /api/cancellations/[id]/services - Get services for a cancellation
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
    const services = await service.getServicesForCancellation(cancellationId);

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// POST /api/cancellations/[id]/services - Add service to cancellation
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

    const body: CancellationServiceFormData = await request.json();

    // Validate required fields
    if (!body.serviceName || !body.serviceStatus) {
      return NextResponse.json(
        { error: "Missing required fields: serviceName, serviceStatus" },
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
    const newService = await service.addService(cancellationId, body, userId);

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Error adding service:", error);
    return NextResponse.json(
      { error: "Failed to add service" },
      { status: 500 }
    );
  }
}

// DELETE /api/cancellations/[id]/services?serviceId=123 - Delete service
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

    const serviceId = request.nextUrl.searchParams.get("serviceId");
    if (!serviceId) {
      return NextResponse.json(
        { error: "Missing serviceId query parameter" },
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
    await service.deleteService(parseInt(serviceId), userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
