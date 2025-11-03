# MinistryPlatform Webhooks - Real-time Updates

This document explains how to set up and use MinistryPlatform webhooks for real-time updates in your Next.js apps.

## Overview

The webhook system enables real-time updates when data changes in MinistryPlatform:

1. **MP sends webhook** → Something changes in MP (e.g., Event_Metric created)
2. **Server receives webhook** → `/api/webhooks/mp` validates and processes
3. **Handler fetches data** → Gets updated record from MP API
4. **Broadcast to clients** → Pushes update via Server-Sent Events (SSE)
5. **Client updates UI** → React components automatically refresh

## Architecture

```
MinistryPlatform
    ↓ HTTP POST
/api/webhooks/mp (validates secret, routes to handlers)
    ↓
Handler (fetches updated data from MP)
    ↓
SSE Broadcaster (pushes to connected clients)
    ↓
/api/events (SSE endpoint)
    ↓
React Hook (useRealtimeEvents)
    ↓
Your Component (updates UI)
```

## Setup Instructions

### 1. Add Webhook Secret to Environment Variables

Add to `.env`:

```env
# Webhook Security
MP_WEBHOOK_SECRET=your-random-secret-here-use-openssl-rand-base64-32
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 2. Configure Webhook in MinistryPlatform Admin Console

Navigate to: **Administration → Webhooks → Create New**

#### Example: Event_Metrics Webhook

**Display Name:**
```
Event Metrics Real-time Updates
```

**Description:**
```
Sends real-time notifications when event metrics are created or updated for the Counter app.
```

**Http Method:**
```
POST
```

**Uri Template:**
```
https://your-domain.com/api/webhooks/mp
```

**Body Template:**
```json
{
  "table": "Event_Metrics",
  "recordId": [dp_RecordID],
  "action": "create"
}
```

**Important:** Use `[dp_RecordID]` (not the table-specific field name) - this is MinistryPlatform's standard template variable for the record ID. Other available MP template variables:
- `[dp_RecordID]` - The record's primary key ID
- `[dp_UserID]` - The user who made the change
- `[dp_AuditType]` - The type of change (Insert, Update, Delete)

For updates, use `"action": "update"`, for deletes use `"action": "delete"`.

**Headers Template:**
```
X-MP-Webhook-Secret: your-random-secret-here-use-openssl-rand-base64-32
```

**Trigger On Create:** Yes (if you want real-time creation notifications)

**Trigger On Update:** Yes (if you want real-time update notifications)

**Trigger On Delete:** No (usually not needed)

**Active:** Yes

**Table Name:** Event_Metrics

**Max Retries:** 3

### 3. Test the Webhook

Once configured, you can test by:

1. Creating an Event_Metric in MinistryPlatform
2. Checking your app's server logs for webhook receipt
3. Verifying the SSE broadcast in browser console

You can also test the webhook endpoint directly:

```bash
curl -X POST https://your-domain.com/api/webhooks/mp \
  -H "Content-Type: application/json" \
  -H "X-MP-Webhook-Secret: your-secret" \
  -d '{"table":"Event_Metrics","recordId":123,"action":"create"}'
```

## Using Webhooks in Your App

### Counter App Example

The Counter app already has a webhook handler for `Event_Metrics`. Here's how to use real-time updates in a component:

```tsx
"use client";

import { useRealtimeEventType } from "@/hooks/useRealtimeEvents";
import { EventMetricUpdate } from "@/types/webhooks";
import { useState } from "react";

export default function CounterPage() {
  const [metrics, setMetrics] = useState<EventMetricUpdate[]>([]);

  // Subscribe to real-time event metric updates
  const { isConnected } = useRealtimeEventType<EventMetricUpdate>(
    "event-metric-created",
    (data) => {
      console.log("New metric created:", data);

      // Update your state
      setMetrics((prev) => [...prev, data]);

      // Or refetch data from API
      // refreshMetrics();
    },
    ["counter"] // Only subscribe to counter channel
  );

  return (
    <div>
      <div>Real-time: {isConnected ? "✅ Connected" : "❌ Disconnected"}</div>

      {metrics.map((metric) => (
        <div key={metric.recordId}>
          {metric.metricName}: {metric.value}
        </div>
      ))}
    </div>
  );
}
```

### Subscribe to Multiple Event Types

```tsx
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

export default function MyComponent() {
  useRealtimeEvents(["counter"], (event) => {
    switch (event.type) {
      case "event-metric-created":
        console.log("Created:", event.data);
        break;
      case "event-metric-updated":
        console.log("Updated:", event.data);
        break;
      case "event-metric-deleted":
        console.log("Deleted:", event.data);
        break;
    }
  });

  return <div>Listening for all event types...</div>;
}
```

## Adding New Webhook Handlers

To add webhooks for other tables (e.g., Feedback_Entries for Prayer app):

### 1. Create Handler File

Create `/src/lib/webhooks/handlers/prayerHandler.ts`:

```typescript
import { WebhookEvent, WebhookHandler } from "@/types/webhooks";
import { sseBroadcaster } from "../broadcaster";

export const handlePrayerChange: WebhookHandler = async (event: WebhookEvent) => {
  console.log(`🙏 Feedback_Entries ${event.action}:`, event.recordId);

  try {
    // Fetch the updated prayer from MP
    const prayer = await fetchPrayer(event.recordId);

    if (!prayer) {
      console.warn(`⚠️  Could not fetch prayer ${event.recordId}`);
      return;
    }

    // Broadcast to prayer app clients
    const eventType = event.action === "create"
      ? "prayer-created"
      : "prayer-updated";

    sseBroadcaster.broadcast(eventType, prayer, "prayers");

    console.log(`✅ Broadcast prayer ${event.action}`);
  } catch (error) {
    console.error(`❌ Failed to handle prayer webhook:`, error);
    throw error;
  }
};

async function fetchPrayer(recordId: number) {
  // Implementation similar to counterHandler.ts
  // Use server OAuth token to fetch from MP API
}
```

### 2. Register Handler

Add to `/src/lib/webhooks/handlers/index.ts`:

```typescript
import { handlePrayerChange } from "./prayerHandler";

export const webhookHandlers: Record<string, WebhookHandler[]> = {
  Event_Metrics: [handleEventMetricsChange],
  Feedback_Entries: [handlePrayerChange], // ← Add this
};
```

### 3. Add TypeScript Types

Update `/src/types/webhooks.ts`:

```typescript
export type SSEEventType =
  | "event-metric-created"
  | "event-metric-updated"
  | "event-metric-deleted"
  | "prayer-created"        // ← Add these
  | "prayer-updated"
  | "connection-established"
  | "ping";
```

### 4. Configure Webhook in MP Admin

Follow the same steps as Event_Metrics but use:
- **Table Name:** Feedback_Entries
- **Body Template:** `{"table":"Feedback_Entries","recordId":[dp_RecordID],"action":"create"}`

## Monitoring & Debugging

### Check Webhook Health

```bash
curl https://your-domain.com/api/webhooks/mp
```

Returns:
```json
{
  "status": "ok",
  "endpoint": "/api/webhooks/mp",
  "registeredTables": ["Event_Metrics"],
  "handlerCounts": {
    "Event_Metrics": 1
  }
}
```

### Server Logs

Webhook events are logged with emojis for easy scanning:

- `📨 Webhook received` - Incoming webhook
- `🔄 Processing N handler(s)` - Handlers executing
- `✅ Handler succeeded` - Handler completed
- `❌ Handler failed` - Handler error
- `📡 Broadcast to N clients` - SSE broadcast
- `🔌 SSE client connected` - New SSE connection
- `🔌 SSE client disconnected` - SSE connection closed

### Client Console Logs

The `useRealtimeEvents` hook logs:

- `🔌 Connecting to SSE` - Establishing connection
- `✅ SSE connected` - Connected successfully
- `📨 SSE event` - Event received (non-ping)
- `❌ SSE error` - Connection error
- `🔄 Reconnecting in Xs` - Reconnection attempt

### Common Issues

**Webhook not received:**
1. Check MP webhook is Active
2. Verify Uri Template is correct (https, not http)
3. Check server logs for errors
4. Test with curl command

**Webhook received but handler fails:**
1. Check handler logs for errors
2. Verify server OAuth token is valid
3. Check MP API permissions

**SSE not connecting:**
1. Check browser console for errors
2. Verify `/api/events` endpoint is accessible
3. Check for CORS issues if embedding

**Events not broadcasting:**
1. Verify handler is registered in `handlers/index.ts`
2. Check handler is calling `sseBroadcaster.broadcast()`
3. Verify channel names match in handler and hook

## Security Notes

1. **Webhook Secret:** Always use a strong random secret and never commit to Git
2. **HTTPS Only:** Webhooks should only be sent to HTTPS endpoints in production
3. **Server-Side Validation:** Never trust webhook data without validation
4. **OAuth Scoping:** Server-side OAuth token should have minimal required scopes
5. **Rate Limiting:** Consider adding rate limiting to webhook endpoint in production

## Performance Considerations

1. **Handler Failures:** Handlers run in parallel and failures don't block other handlers
2. **Token Caching:** Server OAuth token is cached for 3500 seconds to reduce API calls
3. **SSE Keep-Alive:** Ping messages every 30 seconds keep connections alive
4. **Auto-Reconnect:** Client automatically reconnects with exponential backoff
5. **Channel Filtering:** Clients only receive events for subscribed channels

## Production Deployment

### Environment Variables

Ensure these are set in production:

```env
MP_WEBHOOK_SECRET=production-secret
MINISTRY_PLATFORM_CLIENT_ID=your-client-id
MINISTRY_PLATFORM_CLIENT_SECRET=your-client-secret
MINISTRY_PLATFORM_BASE_URL=https://my.woodsidebible.org/ministryplatformapi
```

### Vercel Configuration

If deploying to Vercel, note:
- SSE connections are supported
- Serverless functions timeout after 60 seconds (Hobby/Pro) or 300 seconds (Enterprise)
- Consider upgrading to Pro for longer SSE connections

### Monitoring

Set up monitoring for:
- Webhook endpoint uptime
- Handler success/failure rates
- SSE connection counts
- Token refresh failures

## Future Enhancements

Potential improvements:

- [ ] Redis pub/sub for multi-instance deployments
- [ ] Webhook replay mechanism for failed handlers
- [ ] Admin UI for viewing webhook logs
- [ ] Webhook signature verification (HMAC)
- [ ] Rate limiting per table
- [ ] Configurable retry logic
- [ ] Dead letter queue for failed events
