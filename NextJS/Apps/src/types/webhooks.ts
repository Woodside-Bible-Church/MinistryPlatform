/**
 * Webhook Types
 *
 * Type definitions for MinistryPlatform webhooks and event broadcasting
 */

/**
 * Payload sent by MinistryPlatform webhook
 */
export interface WebhookPayload {
  table: string;           // Table name (e.g., "Event_Metrics")
  recordId: number;        // Record ID that changed
  action?: "create" | "update" | "delete";  // Action type (optional)
}

/**
 * Normalized webhook event after processing
 */
export interface WebhookEvent {
  table: string;
  recordId: number;
  action: "create" | "update" | "delete";
  timestamp: string;       // ISO timestamp
  data?: any;              // Optional additional data fetched by handler
}

/**
 * Webhook handler function type
 * Handlers process webhook events and optionally broadcast updates
 */
export type WebhookHandler = (event: WebhookEvent) => Promise<void>;

/**
 * SSE event types for client communication
 */
export type SSEEventType =
  | "event-metric-created"
  | "event-metric-updated"
  | "event-metric-deleted"
  | "prayer-created"
  | "prayer-updated"
  | "connection-established"
  | "ping";

/**
 * SSE message structure sent to clients
 */
export interface SSEMessage<T = any> {
  type: SSEEventType;
  data: T;
  timestamp: string;
}

/**
 * Event Metric update data structure (for Counter app)
 */
export interface EventMetricUpdate {
  eventId: number;
  metricId: number;
  metricName: string;
  value: number;
  recordId: number;
}
