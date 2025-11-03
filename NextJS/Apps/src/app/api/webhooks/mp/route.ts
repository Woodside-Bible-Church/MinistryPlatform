import { NextRequest, NextResponse } from "next/server";
import { webhookHandlers } from "@/lib/webhooks/handlers";
import { WebhookEvent, WebhookPayload } from "@/types/webhooks";

/**
 * MinistryPlatform Webhook Receiver
 *
 * Receives webhook notifications from MinistryPlatform when records are created/updated/deleted.
 * Routes events to app-specific handlers and broadcasts to connected clients via SSE.
 *
 * Expected MP Webhook Configuration:
 * - Uri Template: https://your-domain.com/api/webhooks/mp
 * - Http Method: POST
 * - Body Template: {"table":"[Table_Name]","recordId":[Record_ID],"action":"[Action]"}
 * - Headers Template: {"X-MP-Webhook-Secret":"your-secret-here"}
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate webhook secret
    const secret = request.headers.get("X-MP-Webhook-Secret");
    const expectedSecret = process.env.MP_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error("MP_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      console.warn("Invalid webhook secret received");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse webhook payload
    const payload: WebhookPayload = await request.json();

    console.log("📨 Webhook received:", {
      table: payload.table,
      recordId: payload.recordId,
      action: payload.action,
      timestamp: new Date().toISOString()
    });

    // 3. Validate payload structure
    if (!payload.table || !payload.recordId) {
      console.error("Invalid webhook payload:", payload);
      return NextResponse.json(
        { error: "Invalid payload: missing table or recordId" },
        { status: 400 }
      );
    }

    // 4. Create webhook event
    const event: WebhookEvent = {
      table: payload.table,
      recordId: payload.recordId,
      action: payload.action || "update",
      timestamp: new Date().toISOString(),
    };

    // 5. Find and execute matching handlers
    const handlers = webhookHandlers[payload.table] || [];

    if (handlers.length === 0) {
      console.log(`⚠️  No handlers registered for table: ${payload.table}`);
    } else {
      console.log(`🔄 Processing ${handlers.length} handler(s) for ${payload.table}`);
    }

    // Execute all handlers in parallel
    const results = await Promise.allSettled(
      handlers.map(handler => handler(event))
    );

    // Log handler results
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`❌ Handler ${index + 1} failed:`, result.reason);
      } else {
        console.log(`✅ Handler ${index + 1} succeeded`);
      }
    });

    // 6. Return success response to MP
    return NextResponse.json({
      success: true,
      table: payload.table,
      recordId: payload.recordId,
      handlersExecuted: results.filter(r => r.status === "fulfilled").length,
      handlersFailed: results.filter(r => r.status === "rejected").length,
    });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for webhook health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/webhooks/mp",
    registeredTables: Object.keys(webhookHandlers),
    handlerCounts: Object.entries(webhookHandlers).reduce((acc, [table, handlers]) => {
      acc[table] = handlers.length;
      return acc;
    }, {} as Record<string, number>),
  });
}
