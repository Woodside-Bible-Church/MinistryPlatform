/**
 * Webhook Handler Registry
 *
 * Central registry of webhook handlers organized by MinistryPlatform table name.
 * Add new handlers here to process specific table changes.
 */

import { WebhookHandler } from "@/types/webhooks";
import { handleEventMetricsChange } from "./counterHandler";

/**
 * Webhook handlers mapped by MP table name
 *
 * Each table can have multiple handlers that execute when a webhook is received.
 * Handlers run in parallel and failures don't block other handlers.
 *
 * To add a new webhook handler:
 * 1. Create handler function in appropriate app file (e.g., counterHandler.ts)
 * 2. Add to this registry under the MP table name
 * 3. Configure webhook in MP Admin Console pointing to /api/webhooks/mp
 */
export const webhookHandlers: Record<string, WebhookHandler[]> = {
  /**
   * Event_Metrics table - Counter app
   * Triggered when metrics are created/updated/deleted
   */
  Event_Metrics: [handleEventMetricsChange],

  /**
   * Example: Add more handlers here as needed
   *
   * Feedback_Entries: [handlePrayerChange],
   * Contacts: [handleContactChange],
   * Events: [handleEventChange],
   */
};
