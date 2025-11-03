# Testing Webhooks with Polling

## Architecture Change

We've switched from **SSE (Server-Sent Events)** to **polling** for real-time updates:

- **Why?** SSE doesn't work on Vercel serverless functions (300-second timeout)
- **Polling:** Counter app polls `/api/counter/event-metrics/[id]` every 5 seconds
- **Webhooks:** Still process Event_Metrics changes and update the database
- **Result:** Polling picks up webhook changes within 5 seconds - simple and reliable!

## Testing in Development

**No special setup needed!** Polling works perfectly with HMR:

1. Start dev server: `npm run dev`
2. Open http://localhost:3000/counter
3. Select Event 322485 (or any event)
4. In browser console, you'll see:
   ```
   🔄 Starting polling for Event 322485...
   📡 Polling for updates to Event 322485...
   ```
5. In MP, create/update/delete an Event_Metric for Event 322485
6. Within 5 seconds, you'll see:
   ```
   ✅ New metrics detected: [...]
   ```
7. UI updates automatically!

## How to Verify It's Working

### Server Logs (Terminal)
When a webhook fires, you should see:
```
🔔 Event_Metrics create: 38091
✅ Fetched Event_Metric 38091: { Event_ID: 322485, Metric_ID: 1, ... }
✅ Broadcast event metric create for Event 322485
```

(Note: The "broadcast" message is legacy from SSE - it doesn't actually broadcast anymore, but the webhook is processed successfully)

### Browser Console
When polling detects the change, you should see:
```
📡 Polling for updates to Event 322485...
✅ New metrics detected: [{ Event_Metric_ID: 38091, ... }]
```

### UI Behavior
The metric should appear or update on the page **within 5 seconds** without refreshing.

## Production Deployment
This system works perfectly in production because:
- ✅ Polling is simple and reliable on serverless platforms
- ✅ No connection state to manage
- ✅ No timeout issues
- ✅ Works everywhere (Vercel, AWS Lambda, etc.)

## Troubleshooting

### Webhook not firing at all
- Check MP webhook configuration URL
- Check MP webhook invocation logs (should show "Succeeded")
- Check server logs for `🔔 Event_Metrics create:` messages

### UI not updating after webhook
- Check browser console for polling logs: `📡 Polling for updates...`
- Verify you're viewing the correct event (Event_ID should match)
- Check that polling interval is running (should poll every 5 seconds)
- Check Network tab for `/api/counter/event-metrics/[id]` requests

### Polling not starting
- Check browser console for: `🔄 Starting polling for Event...`
- Ensure an event is selected
- Check for JavaScript errors in console

## Next Steps
1. Test locally by creating Event_Metrics in MP
2. Deploy to production
3. Webhooks will work immediately - no special configuration needed!
