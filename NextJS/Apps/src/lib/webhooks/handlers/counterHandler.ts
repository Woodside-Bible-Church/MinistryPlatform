/**
 * Counter App Webhook Handler
 *
 * Handles Event_Metrics table webhooks for the Counter app.
 * Fetches the updated metric data and broadcasts to connected clients.
 */

import { WebhookEvent, WebhookHandler, EventMetricUpdate } from "@/types/webhooks";
import { sseBroadcaster } from "../broadcaster";

/**
 * Handle Event_Metrics webhook events
 */
export const handleEventMetricsChange: WebhookHandler = async (event: WebhookEvent) => {
  console.log(`🔔 Event_Metrics ${event.action}:`, event.recordId);

  try {
    // Fetch the updated event metric from MP
    const eventMetric = await fetchEventMetric(event.recordId);

    if (!eventMetric) {
      console.warn(`⚠️  Could not fetch Event_Metric ${event.recordId}`);
      return;
    }

    // Prepare update data
    const update: EventMetricUpdate = {
      eventId: eventMetric.Event_ID,
      metricId: eventMetric.Metric_ID,
      metricName: eventMetric.Metric_ID_Table?.Metric_Title || "Unknown",
      value: eventMetric.Numerical_Value,
      recordId: event.recordId,
    };

    // Broadcast to Counter app clients
    const eventType = event.action === "create"
      ? "event-metric-created"
      : event.action === "delete"
        ? "event-metric-deleted"
        : "event-metric-updated";

    const stats = sseBroadcaster.getStats();
    console.log(`📊 SSE Stats before broadcast:`, stats);

    sseBroadcaster.broadcast(eventType, update, "counter");

    console.log(`✅ Broadcast event metric ${event.action} for Event ${eventMetric.Event_ID}`);
  } catch (error) {
    console.error(`❌ Failed to handle Event_Metrics webhook:`, error);
    throw error; // Re-throw to mark handler as failed
  }
};

/**
 * Fetch Event_Metric data from MinistryPlatform
 * Uses server-side OAuth token (not user-specific)
 */
async function fetchEventMetric(recordId: number) {
  try {
    // Get OAuth token for server-side API calls
    const token = await getServerToken();

    // Use $select to get the fields we need, including related Metric_ID_Table fields
    // Fully qualify Event_Metrics columns to avoid ambiguity when joining with Metric_ID_Table
    const selectFields = "Event_Metrics.Event_Metric_ID,Event_Metrics.Event_ID,Event_Metrics.Metric_ID,Event_Metrics.Numerical_Value,Event_Metrics.Group_ID,Metric_ID_Table.Metric_Title";
    const response = await fetch(
      `${process.env.MINISTRY_PLATFORM_BASE_URL}/tables/Event_Metrics/${recordId}?$select=${encodeURIComponent(selectFields)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch Event_Metric ${recordId}: ${response.status}`);
      console.error(`Error details:`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Fetched Event_Metric ${recordId}:`, data);

    // MP API returns an array when using $select, extract first element
    return Array.isArray(data) && data.length > 0 ? data[0] : data;
  } catch (error) {
    console.error(`Error fetching Event_Metric ${recordId}:`, error);
    return null;
  }
}

/**
 * Get server-side OAuth token (cached for 3500 seconds)
 */
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getServerToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  console.log("🔑 Fetching new server OAuth token...");

  const response = await fetch(
    `${process.env.MINISTRY_PLATFORM_BASE_URL}/oauth/connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.MINISTRY_PLATFORM_CLIENT_ID!,
        client_secret: process.env.MINISTRY_PLATFORM_CLIENT_SECRET!,
        scope: "http://www.thinkministry.com/dataplatform/scopes/all",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get OAuth token: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 100) * 1000; // Cache for slightly less than expiry

  console.log("✅ Server OAuth token acquired");

  return cachedToken!; // We just set it, so it's definitely not null
}
