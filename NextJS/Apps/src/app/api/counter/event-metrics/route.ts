import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { CounterService } from "@/services/counterService";
import { CreateEventMetricSchema } from "@/providers/MinistryPlatform/entities/EventMetricsSchema";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
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
    const eventMetric = await counterService.submitEventMetric(validatedData, userId);

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
