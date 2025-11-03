# Webhooks Architecture - SSE Limitations on Vercel

## The Problem

**SSE (Server-Sent Events) is not compatible with Vercel's serverless function model.**

### Evidence:
1. Vercel Functions have a **300-second (5 minute) maximum execution time**
2. SSE requires long-lived connections (potentially hours or days)
3. Production logs show: `Vercel Runtime Timeout Error: Task timed out after 300 seconds`
4. When webhooks fire, there are often **0 clients connected** because connections have timed out

### Why It Works Locally But Not in Production:
- Local development: Node.js server runs continuously, can maintain long-lived SSE connections
- Vercel production: Serverless functions spin up, handle request, then spin down after timeout
- SSE connections get interrupted every 5 minutes, creating timing gaps

## The Solution: Switch to Polling

Since SSE doesn't work on Vercel's serverless infrastructure, we need to use **polling** instead:

### Polling Architecture

**How it works:**
1. User opens Counter page
2. React app polls `/api/counter/event-metrics/[id]` every 5-10 seconds
3. Webhook updates the database when Event_Metrics change
4. Polling picks up the latest data from the database

**Advantages:**
- ✅ Works on any serverless platform (Vercel, AWS Lambda, etc.)
- ✅ Simpler implementation (no connection management)
- ✅ No timeout issues
- ✅ Reliable and predictable
- ✅ Easy to test and debug

**Disadvantages:**
- ❌ Slight delay (5-10 seconds) vs instant updates
- ❌ More API calls (but cached responses mitigate this)

### Alternative: Vercel Edge Functions + Durable Objects

If real-time updates are critical, consider:
- Move SSE endpoint to **Vercel Edge Functions** (no timeout)
- Use **Cloudflare Durable Objects** or similar for connection state
- More complex, requires paid Vercel plan
- Not recommended unless sub-second latency is required

## Implementation Plan

### Step 1: Remove SSE Infrastructure (Simplify Codebase)
- Remove `/api/events` SSE endpoint
- Remove `useRealtimeEvents` hook
- Remove SSE broadcaster singleton
- Keep webhook receiver (still useful for future features)

### Step 2: Add Polling to Counter App
```typescript
// In counter/page.tsx
useEffect(() => {
  if (!selectedEvent) return;

  // Poll every 10 seconds
  const interval = setInterval(async () => {
    const response = await fetch(`/api/counter/event-metrics/${selectedEvent.Event_ID}`);
    const data = await response.json();
    setExistingMetrics(data);
  }, 10000);

  return () => clearInterval(interval);
}, [selectedEvent]);
```

### Step 3: Optimize with SWR or React Query (Optional)
Use a data fetching library for automatic caching, deduplication, and revalidation:

```typescript
import useSWR from 'swr';

const { data: metrics } = useSWR(
  selectedEvent ? `/api/counter/event-metrics/${selectedEvent.Event_ID}` : null,
  fetcher,
  { refreshInterval: 10000 } // Poll every 10 seconds
);
```

## Conclusion

**Recommendation: Use polling for now.**

- Simpler, more reliable, works everywhere
- 10-second polling is "fast enough" for a Counter app
- Can always upgrade to WebSockets/Edge Functions later if needed
- Webhooks can still trigger database updates, polling just reads them

The webhook infrastructure we built is still valuable - it updates the database in real-time. We just need a different mechanism for clients to read those updates.
