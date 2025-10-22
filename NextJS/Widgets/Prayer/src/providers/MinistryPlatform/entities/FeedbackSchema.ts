import { z } from 'zod';

/**
 * Zod schema for MinistryPlatform Feedback_Entries table (Prayer Requests)
 * Based on the standard MP Feedback_Entries table structure with common fields
 */
export const FeedbackSchema = z.object({
  Feedback_Entry_ID: z.number().int(),
  Contact_ID: z.number().int(),
  Feedback_Type_ID: z.number().int(),
  Description: z.string().max(4000),
  Date_Submitted: z.string(), // MP returns dates without timezone like "2018-04-20T00:00:00"
  Approved: z.boolean().nullable().default(false),
  Visibility_Level_ID: z.number().int().nullable().optional(),
  Ongoing_Need: z.boolean().nullable().default(false),
  Program_ID: z.number().int().nullable().optional(),
  Assigned_To: z.number().int().nullable().optional(),
  Care_Outcome: z.string().max(255).nullable().optional(),
  Outcome_Date: z.string().nullable().optional(),
  Care_Case_ID: z.number().int().nullable().optional(),
  Entry_Title: z.string().max(255).nullable(),
  Prayer_Count: z.number().int().nullable().default(0), // Tracks how many times this prayer was prayed for
  Anonymous_Share: z.boolean().nullable().default(false), // Whether to share anonymously
  Prayer_Notifications: z.boolean().nullable().default(false), // Whether user wants notifications
  __SortOrder: z.number().int().optional(),
  Domain_ID: z.number().int().optional(), // Always 1, but we're not always fetching it
  _Approved: z.boolean().nullable().optional(),
  _Pending: z.boolean().nullable().optional(),
});

/**
 * Schema for creating a new prayer request (Feedback entry)
 * Only includes fields that should be provided by the user
 */
export const CreateFeedbackSchema = FeedbackSchema.pick({
  Contact_ID: true,
  Feedback_Type_ID: true,
  Description: true,
  Ongoing_Need: true,
  Entry_Title: true,
  Anonymous_Share: true,
  Prayer_Notifications: true,
}).extend({
  Approved: z.boolean().optional().default(false),
  Date_Submitted: z.string().optional(), // MP accepts simple datetime strings
});

/**
 * Schema for updating a prayer request
 */
export const UpdateFeedbackSchema = FeedbackSchema.pick({
  Feedback_Entry_ID: true,
  Description: true,
  Feedback_Type_ID: true,
  Ongoing_Need: true,
  Approved: true,
  Entry_Title: true,
  Prayer_Count: true,
  Anonymous_Share: true,
  Prayer_Notifications: true,
}).partial().required({ Feedback_Entry_ID: true });

/**
 * Extended Feedback schema with related table data (using MP's table lookup convention)
 * This includes Contact details and Feedback Type name
 */
export const FeedbackWithRelationsSchema = FeedbackSchema.extend({
  Contact_ID_Table: z.object({
    Contact_ID: z.number().int(),
    Display_Name: z.string(),
    First_Name: z.string(),
    Last_Name: z.string(),
    Nickname: z.string().nullable(),
    Email_Address: z.string().email().nullable(),
  }).optional(),
  Feedback_Type_ID_Table: z.object({
    Feedback_Type_ID: z.number().int(),
    Feedback_Type: z.string(),
  }).optional(),
});

export type Feedback = z.infer<typeof FeedbackSchema>;
export type CreateFeedback = z.infer<typeof CreateFeedbackSchema>;
export type UpdateFeedback = z.infer<typeof UpdateFeedbackSchema>;
export type FeedbackWithRelations = z.infer<typeof FeedbackWithRelationsSchema>;
