# Webhooks Quick Start Guide

## What I Built

A complete webhook system for real-time updates in your NextJS/Apps project! Here's what it does:

**When you create an Event_Metric in MinistryPlatform:**
1. MP sends a webhook to your app
2. Your app fetches the new metric data
3. The update broadcasts instantly to all connected browsers via Server-Sent Events (SSE)
4. Counter app automatically refreshes without page reload

## Files Created

### Core Infrastructure
- `/src/app/api/webhooks/mp/route.ts` - Webhook receiver endpoint
- `/src/app/api/events/route.ts` - SSE endpoint for client connections
- `/src/lib/webhooks/broadcaster.ts` - SSE broadcaster (manages connections)
- `/src/types/webhooks.ts` - TypeScript types

### Counter App Handler
- `/src/lib/webhooks/handlers/counterHandler.ts` - Event_Metrics webhook handler
- `/src/lib/webhooks/handlers/index.ts` - Handler registry

### Client Hook
- `/src/hooks/useRealtimeEvents.ts` - React hook for easy SSE connection

### Documentation
- `/WEBHOOKS.md` - Complete documentation
- `/WEBHOOKS_QUICKSTART.md` - This file

### Environment
- Updated `.env` with `MP_WEBHOOK_SECRET`

## Next Steps to Test

### 1. Generate a Secure Webhook Secret

```bash
openssl rand -base64 32
```

Copy the output and update `.env`:
```env
MP_WEBHOOK_SECRET=paste-your-secret-here
```

### 2. Configure Webhook in MinistryPlatform

Go to **Administration → Webhooks → Create New**

**Fill out the form:**

**Display Name:**
```
Event Metrics Real-time Updates
```

**Description:**
```
Sends real-time notifications when event metrics are created for the Counter app.
```

**Http Method:**
```
POST
```

**Uri Template:**
```
http://localhost:3000/api/webhooks/mp
```
(Change to your production URL when deploying)

**Body Template:**
```json
{
  "table": "Event_Metrics",
  "recordId": [dp_RecordID],
  "action": "create"
}
```

**Important:** Use `[dp_RecordID]` (not `[Event_Metric_ID]`) - this is MinistryPlatform's template variable for the record ID.

**Headers Template:**
```
X-MP-Webhook-Secret: paste-your-secret-here
```
(Use the SAME secret from step 1)

**Trigger On Create:** ✅ Yes

**Trigger On Update:** ✅ Yes (optional)

**Trigger On Delete:** ❌ No

**Active:** ✅ Yes

**Table Name:** Event_Metrics

**Max Retries:** 3

### 3. Test the Webhook Endpoint

Test that your webhook endpoint is running:

```bash
curl http://localhost:3000/api/webhooks/mp
```

Should return:
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

### 4. Add Real-time Updates to Counter App

Update `/src/app/(app)/counter/page.tsx` (or wherever you want real-time updates):

```tsx
"use client";

import { useRealtimeEventType } from "@/hooks/useRealtimeEvents";
import { EventMetricUpdate } from "@/types/webhooks";

export default function CounterPage() {
  // Subscribe to event metric creates
  const { isConnected } = useRealtimeEventType<EventMetricUpdate>(
    "event-metric-created",
    (data) => {
      console.log("🎉 New metric created in real-time!", data);

      // Refresh your data here
      // For example, re-fetch metrics or update state
    },
    ["counter"]  // Only listen to counter channel
  );

  return (
    <div>
      <div className="fixed top-4 right-4">
        Real-time: {isConnected ? "🟢 Live" : "🔴 Offline"}
      </div>

      {/* Your counter UI here */}
    </div>
  );
}
```

### 5. Test End-to-End

1. **Open your app** at http://localhost:3000/counter
2. **Open browser console** (F12) - You should see: `🔌 Connecting to SSE` and `✅ SSE connected`
3. **Create an Event_Metric** in MinistryPlatform
4. **Watch the magic happen:**
   - Server logs will show: `📨 Webhook received`
   - Server logs will show: `📡 Broadcast event-metric-created to 1 client(s)`
   - Browser console will show: `📨 SSE event: event-metric-created`
   - Your callback function runs automatically!

## Monitoring

### Check Webhook Status
```bash
curl http://localhost:3000/api/webhooks/mp
```

### Check Server Logs
Look for these emoji indicators:
- `📨` Webhook received
- `✅` Handler succeeded
- `❌` Handler failed
- `📡` Broadcast to clients
- `🔌` Client connected/disconnected

### Check Browser Console
- `🔌 Connecting to SSE` - Establishing connection
- `✅ SSE connected` - Connected successfully
- `📨 SSE event` - Event received
- `❌ SSE error` - Connection error

## Troubleshooting

**Webhook not being received:**
1. Make sure MP webhook is Active
2. Check Uri Template matches your URL (http://localhost:3000/api/webhooks/mp)
3. Verify webhook secret matches in both MP and .env
4. Check server logs for errors

**SSE not connecting:**
1. Open http://localhost:3000 and check browser console
2. Make sure `/api/events` endpoint is accessible
3. Try manually: new EventSource('/api/events?channels=counter')

**Events not triggering:**
1. Check that handler is registered in `/src/lib/webhooks/handlers/index.ts`
2. Verify `sseBroadcaster.broadcast()` is being called in handler
3. Make sure channel name matches ('counter')

## Adding More Webhooks

Want webhooks for other tables? See `/WEBHOOKS.md` for detailed instructions on:
- Creating new handlers
- Registering handlers
- Configuring MP webhooks
- TypeScript types

## Architecture Diagram

```
MinistryPlatform (Event_Metrics created)
    ↓
POST /api/webhooks/mp
    ├─ Validate secret
    ├─ Route to counterHandler
    └─ Handler fetches Event_Metric data
        ↓
SSE Broadcaster
    ↓
GET /api/events (SSE connection)
    ↓
useRealtimeEvents hook
    ↓
Your React Component (auto-updates!)
```

## Security Notes

- **Never commit** `MP_WEBHOOK_SECRET` to Git
- Use HTTPS in production (webhooks should be https://your-domain.com/api/webhooks/mp)
- The secret validates that webhooks are actually from MP
- SSE connections are public (anyone can connect), but webhook endpoint is protected

## Production Deployment

When deploying to production:

1. Update `.env` with production webhook secret
2. Update MP webhook Uri Template to production URL (https://your-domain.com/api/webhooks/mp)
3. Verify environment variables are set in your hosting platform (Vercel, etc.)
4. Test webhook with a real create/update in production MP

## What's Next?

This system is fully extensible! You can add webhooks for:
- Prayer requests (Feedback_Entries table)
- Events table updates
- Contact changes
- Any MP table!

Just follow the pattern in `counterHandler.ts` and you're good to go.

---

**Need help?** Check `/WEBHOOKS.md` for complete documentation.
