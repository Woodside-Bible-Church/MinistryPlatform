import { z } from 'zod';

/**
 * Zod schema for MinistryPlatform Feedback_Types table
 * Used for categorizing prayer requests (e.g., "Prayer Request", "Praise Report", etc.)
 * Only includes fields we actually fetch from the API
 */
export const FeedbackTypesSchema = z.object({
  Feedback_Type_ID: z.number().int(),
  Feedback_Type: z.string().max(50),
  Description: z.string().max(255).nullable(),
});

export type FeedbackType = z.infer<typeof FeedbackTypesSchema>;
