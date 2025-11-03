import { NextRequest } from "next/server";
import { sseBroadcaster } from "@/lib/webhooks/broadcaster";

/**
 * Server-Sent Events (SSE) Endpoint
 *
 * Clients connect to this endpoint to receive real-time webhook updates.
 *
 * Usage from client:
 * ```typescript
 * const eventSource = new EventSource('/api/events?channels=counter');
 * eventSource.onmessage = (event) => {
 *   const data = JSON.parse(event.data);
 *   console.log('Received:', data);
 * };
 * ```
 *
 * Query Parameters:
 * - channels: Comma-separated list of channels to subscribe to (e.g., "counter,prayers")
 *             If omitted, receives all events
 */
export async function GET(request: NextRequest) {
  // Parse channels from query string
  const searchParams = request.nextUrl.searchParams;
  const channelsParam = searchParams.get("channels");
  const channels = channelsParam ? channelsParam.split(",").map(c => c.trim()) : [];

  // Generate unique client ID
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Register client with broadcaster
      sseBroadcaster.addClient(clientId, controller, channels);
    },
    cancel() {
      // Clean up when client disconnects
      sseBroadcaster.removeClient(clientId);
    },
  });

  // Return SSE response with proper headers
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
