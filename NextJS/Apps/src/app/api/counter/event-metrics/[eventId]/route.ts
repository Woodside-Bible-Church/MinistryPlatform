import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CounterService } from "@/services/counterService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
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

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    const { eventMetricId, data } = await request.json();

    const counterService = new CounterService(session.accessToken);
    await counterService.updateEventMetric(eventMetricId, data);

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

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { eventId } = await params;
    const { eventMetricId } = await request.json();

    const counterService = new CounterService(session.accessToken);
    await counterService.deleteEventMetric(eventMetricId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event metric:", error);
    return NextResponse.json(
      { error: "Failed to delete event metric" },
      { status: 500 }
    );
  }
}
