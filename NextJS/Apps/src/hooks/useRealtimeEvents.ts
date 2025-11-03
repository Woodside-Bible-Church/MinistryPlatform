"use client";

import { useEffect, useRef, useState } from "react";
import { SSEMessage, SSEEventType } from "@/types/webhooks";

/**
 * React hook for subscribing to real-time server events via SSE
 *
 * @param channels - Optional array of channels to subscribe to (e.g., ["counter", "prayers"])
 * @param onEvent - Callback when event is received
 * @returns Connection status
 *
 * @example
 * ```tsx
 * function CounterPage() {
 *   const { isConnected, error } = useRealtimeEvents(["counter"], (event) => {
 *     if (event.type === "event-metric-created") {
 *       console.log("New metric:", event.data);
 *       // Refresh your data or update state
 *     }
 *   });
 *
 *   return <div>Real-time: {isConnected ? "✅" : "❌"}</div>;
 * }
 * ```
 */
export function useRealtimeEvents(
  channels?: string[],
  onEvent?: (event: SSEMessage) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const onEventRef = useRef(onEvent);

  // Keep onEventRef up to date without triggering reconnections
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;

      // Build URL with channel query params
      const url = channels && channels.length > 0
        ? `/api/events?channels=${channels.join(",")}`
        : "/api/events";

      console.log(`🔌 Connecting to SSE: ${url}`);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMounted) return;
        console.log("✅ SSE connected");
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        if (!isMounted) return;

        try {
          const message: SSEMessage = JSON.parse(event.data);

          // Log non-ping events
          if (message.type !== "ping") {
            console.log("📨 SSE event:", message.type, message.data);
          }

          // Call user's event handler
          if (onEventRef.current) {
            onEventRef.current(message);
          }
        } catch (err) {
          console.error("Failed to parse SSE message:", err);
        }
      };

      eventSource.onerror = (err) => {
        if (!isMounted) return;

        console.error("❌ SSE error:", err);
        setIsConnected(false);
        eventSource.close();

        // Exponential backoff for reconnection (max 30 seconds)
        const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        console.log(`🔄 Reconnecting in ${backoffTime / 1000}s (attempt ${reconnectAttemptsRef.current})...`);
        setError(`Connection lost. Retrying in ${backoffTime / 1000}s...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) {
            connect();
          }
        }, backoffTime);
      };
    }

    connect();

    // Cleanup on unmount
    return () => {
      isMounted = false;

      if (eventSourceRef.current) {
        console.log("🔌 Disconnecting SSE");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [channels?.join(",")]); // Only reconnect if channels change

  return { isConnected, error };
}

/**
 * Hook for subscribing to specific event types
 *
 * @example
 * ```tsx
 * function CounterMetrics() {
 *   useRealtimeEventType("event-metric-created", (data) => {
 *     console.log("New metric created:", data);
 *     // Update your state
 *   }, ["counter"]);
 * }
 * ```
 */
export function useRealtimeEventType<T = any>(
  eventType: SSEEventType,
  onEvent: (data: T) => void,
  channels?: string[]
) {
  return useRealtimeEvents(channels, (event) => {
    if (event.type === eventType) {
      onEvent(event.data);
    }
  });
}
