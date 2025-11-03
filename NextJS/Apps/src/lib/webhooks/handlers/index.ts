/**
 * Webhook Handler Registry
 *
 * Central registry of webhook handlers organized by MinistryPlatform table name.
 * Add new handlers here to process specific table changes.
 */

import { WebhookHandler } from "@/types/webhooks";

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
 *
 * Example handlers:
 *
 * import { handleEventMetricsChange } from "./counterHandler";
 *
 * Event_Metrics: [handleEventMetricsChange],
 * Feedback_Entries: [handlePrayerChange],
 * Contacts: [handleContactChange],
 * Events: [handleEventChange],
 */
export const webhookHandlers: Record<string, WebhookHandler[]> = {
  // No active handlers - webhook infrastructure ready for future use
};
