import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CounterService } from "@/services/counterService";
import { CreateEventMetricSchema } from "@/providers/MinistryPlatform/entities/EventMetricsSchema";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate the request body and add Domain_ID
    const validatedData = CreateEventMetricSchema.parse({
      ...body,
      Domain_ID: 1, // Always set Domain_ID for Event_Metrics
    });

    const counterService = new CounterService(session.accessToken);
    const eventMetric = await counterService.submitEventMetric(validatedData);

    return NextResponse.json(eventMetric, { status: 201 });
  } catch (error) {
    console.error("Error creating event metric:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid request data", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create event metric" },
      { status: 500 }
    );
  }
}
