import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CounterService } from "@/services/counterService";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    const counterService = new CounterService(session.accessToken);
    const eventMetrics = await counterService.getEventMetrics(parseInt(eventId));

    return NextResponse.json(eventMetrics);
  } catch (error) {
    console.error("Error fetching event metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch event metrics" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    const { eventMetricId, data } = await request.json();

    // Get User_ID for audit logging
    const mp = new MPHelper();
    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: 'dp_Users',
      select: 'User_ID',
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = users[0].User_ID;

    const counterService = new CounterService(session.accessToken);
    await counterService.updateEventMetric(eventMetricId, data, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating event metric:", error);
    return NextResponse.json(
      { error: "Failed to update event metric" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    const { eventMetricId } = await request.json();

    // Get User_ID for audit logging
    const mp = new MPHelper();
    const users = await mp.getTableRecords<{ User_ID: number }>({
      table: 'dp_Users',
      select: 'User_ID',
      filter: `User_GUID='${session.sub}'`,
      top: 1,
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = users[0].User_ID;

    const counterService = new CounterService(session.accessToken);
    await counterService.deleteEventMetric(eventMetricId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event metric:", error);
    return NextResponse.json(
      { error: "Failed to delete event metric" },
      { status: 500 }
    );
  }
}
