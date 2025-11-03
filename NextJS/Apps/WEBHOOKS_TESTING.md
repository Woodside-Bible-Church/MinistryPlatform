# Testing Webhooks in Development

## The Problem
During local development (`npm run dev`), Hot Module Replacement (HMR) causes SSE connections to constantly reconnect when code changes are detected. This creates a timing issue where webhooks may fire when no client is actively connected.

## Evidence the System Works
1. ✅ Webhooks are being received from MinistryPlatform successfully
2. ✅ Event_Metrics data is being fetched correctly
3. ✅ SSE broadcaster is functioning (you can see ping events every 30s)
4. ✅ Browser can connect to SSE endpoint and receive events

The only issue is the **timing**: HMR causes disconnects at unpredictable times, so when a webhook fires, there might be 0 clients connected.

## Testing Options

### Option 1: Build and Run Production Mode (Recommended)
```bash
# Build the app
npm run build

# Run in production mode (no HMR)
npm start
```

Then:
1. Open http://localhost:3000/counter
2. Select Event 322485 (Nov 2nd event)
3. Wait for SSE connection to stabilize (you'll see ✅ SSE connected once)
4. In MP, create a new Event_Metric for Event 322485
5. Watch the UI automatically update!

### Option 2: Use ngrok + External Browser
Keep `npm run dev` running but use ngrok to access it from another device/browser that won't have HMR:

```bash
ngrok http 3000
```

Then open the ngrok URL on your phone or another browser, and test the webhook.

### Option 3: Disable Fast Refresh Temporarily
In `next.config.ts`, add:
```typescript
const nextConfig = {
  reactStrictMode: false, // Disable in dev only for testing
}
```

## How to Verify It's Working

### Server Logs (Terminal)
When a webhook fires, you should see:
```
🔔 Event_Metrics create: 38091
📊 SSE Stats before broadcast: { totalClients: 1, channelCounts: { counter: 1 } }
📡 Broadcast event-metric-created to 1 client(s) in channel: counter
✅ Broadcast event metric create for Event 322485
```

**Key**: `totalClients` should be **1 or more**, not 0.

### Browser Console
When the event is received, you should see:
```
📨 SSE event: event-metric-created { eventId: 322485, metricId: 1, ... }
📡 Received SSE event: { type: "event-metric-created", ... }
🔄 Reloading metrics for current event...
✅ Metrics reloaded: [...]
```

### UI Behavior
The metric should appear or update on the page **without refreshing**.

## Production Deployment
This system will work perfectly in production because:
- No HMR to cause reconnections
- SSE connections are stable
- Webhooks will always find connected clients (as long as users are on the page)

## Troubleshooting

### "totalClients: 0" in server logs
- **Cause**: HMR disconnected the client right before the webhook fired
- **Solution**: Test in production mode or wait for a stable connection window

### SSE keeps reconnecting
- **Cause**: Code changes trigger HMR
- **Solution**: Stop making code changes and let it stabilize, or test in production mode

### Webhook not firing at all
- Check MP webhook configuration: https://disagreeingly-nonreproducible-jenise.ngrok-free.dev/api/webhooks/mp
- Check MP webhook invocation logs (should show "Succeeded")
- Check server logs for `🔔 Event_Metrics create:` messages

### Event received but UI not updating
- Check that you're viewing the correct event (Event_ID should match)
- Check browser console for the full event data
- Verify the `selectedEvent` state matches the webhook's `eventId`

## Next Steps
1. Test in production mode to verify end-to-end functionality
2. Deploy to staging/production
3. Update MP webhook URL to production URL
4. Add more webhook handlers for other tables as needed
