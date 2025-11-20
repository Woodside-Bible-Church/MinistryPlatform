import { z } from "zod";

/**
 * Event RSVP Schema
 * Individual RSVPs for events
 */
export const EventRSVPSchema = z.object({
  Event_RSVP_ID: z.number().int().positive(),
  Event_ID: z.number().int().positive(),
  Project_ID: z.number().int().positive(),
  Project_RSVP_ID: z.number().int().positive().optional().nullable(), // Backward compatibility
  Contact_ID: z.number().int().positive().nullable(),
  Event_Participant_ID: z.number().int().positive().nullable(), // Link to Event_Participants

  // Personal Information
  First_Name: z.string().min(1).max(50),
  Last_Name: z.string().min(1).max(50),
  Email_Address: z.string().email().max(255),
  Phone_Number: z.string().max(20).nullable(),

  // RSVP Details
  Party_Size: z.number().int().min(1).default(1),
  Is_New_Visitor: z.boolean().default(false).nullable(),
  Is_Guest: z.boolean().default(false),

  // Tracking
  Submission_Date: z.coerce.date(),
  Confirmation_Code: z.string().max(20).nullable(),

  // Metadata
  RSVP_Date: z.coerce.date().optional().nullable(), // Deprecated in favor of Submission_Date
  Domain_ID: z.number().int().default(1),
});

export const CreateEventRSVPSchema = EventRSVPSchema.omit({
  Event_RSVP_ID: true,
  RSVP_Date: true,
});

export type EventRSVP = z.infer<typeof EventRSVPSchema>;
export type CreateEventRSVP = z.infer<typeof CreateEventRSVPSchema>;

/**
 * Event RSVP with event details (for display)
 */
export const EventRSVPWithDetailsSchema = EventRSVPSchema.extend({
  Event_Title: z.string(),
  Event_Start_Date: z.coerce.date(),
  Event_End_Date: z.coerce.date(),
  Campus_Name: z.string().nullable(),
});

export type EventRSVPWithDetails = z.infer<typeof EventRSVPWithDetailsSchema>;

/**
 * Event Capacity Schema
 */
export const EventCapacitySchema = z.object({
  Event_Capacity_ID: z.number().int().positive(),
  Event_ID: z.number().int().positive(),
  Max_Capacity: z.number().int().min(0),
  Domain_ID: z.number().int().default(1),
});

export const CreateEventCapacitySchema = EventCapacitySchema.omit({
  Event_Capacity_ID: true,
});

export const UpdateEventCapacitySchema = EventCapacitySchema.partial().required({
  Event_Capacity_ID: true,
});

export type EventCapacity = z.infer<typeof EventCapacitySchema>;
export type CreateEventCapacity = z.infer<typeof CreateEventCapacitySchema>;
export type UpdateEventCapacity = z.infer<typeof UpdateEventCapacitySchema>;

/**
 * Event with RSVP statistics (from stored procedure)
 */
export const EventWithRSVPStatsSchema = z.object({
  Event_ID: z.number().int().positive(),
  Event_Title: z.string(),
  Event_Start_Date: z.coerce.date(),
  Event_End_Date: z.coerce.date(),
  Campus_Name: z.string().nullable(),
  Congregation_ID: z.number().int().nullable(),

  // Capacity information
  Max_Capacity: z.number().int().default(0),

  // RSVP statistics
  Total_RSVPs: z.number().int().default(0),
  Total_Attendees: z.number().int().default(0),

  // Calculated fields
  Capacity_Percentage: z.number().default(0),
  Is_Available: z.number().int().min(0).max(1).default(1),
});

export type EventWithRSVPStats = z.infer<typeof EventWithRSVPStatsSchema>;
