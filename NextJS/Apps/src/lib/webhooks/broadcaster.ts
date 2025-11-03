/**
 * SSE (Server-Sent Events) Broadcaster
 *
 * Manages active SSE connections and broadcasts webhook events to connected clients.
 * Used for real-time updates in the browser without polling.
 */

import { SSEMessage, SSEEventType } from "@/types/webhooks";

type SSEClient = {
  id: string;
  controller: ReadableStreamDefaultController;
  channels: Set<string>;  // Channels this client is subscribed to (e.g., "counter", "prayers")
};

class SSEBroadcaster {
  private clients: Map<string, SSEClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start ping interval to keep connections alive
    this.startPingInterval();
  }

  /**
   * Register a new SSE client
   */
  addClient(id: string, controller: ReadableStreamDefaultController, channels: string[] = []) {
    const client: SSEClient = {
      id,
      controller,
      channels: new Set(channels),
    };

    this.clients.set(id, client);
    console.log(`🔌 SSE client connected: ${id} (channels: ${channels.join(", ") || "all"})`);
    console.log(`📊 Total connected clients: ${this.clients.size}`);

    // Send connection confirmation
    this.sendToClient(id, {
      type: "connection-established",
      data: { clientId: id, channels },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove an SSE client
   */
  removeClient(id: string) {
    const client = this.clients.get(id);
    if (client) {
      try {
        client.controller.close();
      } catch (error) {
        // Client already closed
      }
      this.clients.delete(id);
      console.log(`🔌 SSE client disconnected: ${id}`);
      console.log(`📊 Total connected clients: ${this.clients.size}`);
    }
  }

  /**
   * Send message to a specific client
   */
  private sendToClient(clientId: string, message: SSEMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const encoder = new TextEncoder();
      const data = `data: ${JSON.stringify(message)}\n\n`;
      client.controller.enqueue(encoder.encode(data));
    } catch (error) {
      console.error(`❌ Failed to send to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  /**
   * Broadcast message to all clients or specific channel
   */
  broadcast<T = any>(type: SSEEventType, data: T, channel?: string) {
    const message: SSEMessage<T> = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    let sentCount = 0;

    for (const [clientId, client] of this.clients.entries()) {
      // If channel specified, only send to clients subscribed to that channel
      if (channel && client.channels.size > 0 && !client.channels.has(channel)) {
        continue;
      }

      this.sendToClient(clientId, message);
      sentCount++;
    }

    if (sentCount > 0) {
      console.log(`📡 Broadcast ${type} to ${sentCount} client(s)${channel ? ` in channel: ${channel}` : ""}`);
    }
  }

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval() {
    // Send ping every 30 seconds
    this.pingInterval = setInterval(() => {
      this.broadcast("ping", { time: new Date().toISOString() });
    }, 30000);
  }

  /**
   * Stop ping interval (cleanup)
   */
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Get number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get stats about connected clients
   */
  getStats() {
    const channelCounts: Record<string, number> = {};

    for (const client of this.clients.values()) {
      for (const channel of client.channels) {
        channelCounts[channel] = (channelCounts[channel] || 0) + 1;
      }
    }

    return {
      totalClients: this.clients.size,
      channelCounts,
    };
  }
}

// Singleton instance
export const sseBroadcaster = new SSEBroadcaster();
