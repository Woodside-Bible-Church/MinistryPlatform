import { z } from "zod";

/**
 * Project_Events Schema
 * Links Events to Projects with RSVP configuration
 */
export const ProjectEventSchema = z.object({
  Project_Event_ID: z.number().int().positive(),
  Project_ID: z.number().int().positive(),
  Event_ID: z.number().int().positive(),
  Include_In_RSVP: z.boolean().nullable(),
  RSVP_Capacity_Modifier: z.number().int().default(0),
});

export const CreateProjectEventSchema = ProjectEventSchema.omit({
  Project_Event_ID: true,
});

export const UpdateProjectEventSchema = ProjectEventSchema.partial().required({
  Project_Event_ID: true,
});

export type ProjectEvent = z.infer<typeof ProjectEventSchema>;
export type CreateProjectEvent = z.infer<typeof CreateProjectEventSchema>;
export type UpdateProjectEvent = z.infer<typeof UpdateProjectEventSchema>;

/**
 * Project Event with Event details (for display)
 */
export const ProjectEventWithDetailsSchema = ProjectEventSchema.extend({
  Event_Title: z.string(),
  Event_Start_Date: z.coerce.date(),
  Event_End_Date: z.coerce.date(),
  Congregation_Name: z.string().nullable(),
  Congregation_ID: z.number().int().nullable(),
  Event_Type: z.string().nullable(),

  // RSVP statistics
  RSVP_Count: z.number().int().default(0),
  Total_Attendees: z.number().int().default(0),
  Capacity: z.number().int().nullable(),
  Available_Capacity: z.number().int().nullable(),
});

export type ProjectEventWithDetails = z.infer<typeof ProjectEventWithDetailsSchema>;

/**
 * Project RSVP submission (from Event_RSVPs table)
 */
export const ProjectRSVPSchema = z.object({
  Event_RSVP_ID: z.number().int().positive(),
  Event_ID: z.number().int().positive(),
  Contact_ID: z.number().int().positive().nullable(),
  First_Name: z.string(),
  Last_Name: z.string(),
  Email_Address: z.string().email(),
  Phone_Number: z.string().nullable(),
  Party_Size: z.number().int().default(1),
  Is_New_Visitor: z.boolean().default(false),
  RSVP_Date: z.coerce.date(),

  // Event details
  Event_Title: z.string().nullable(),
  Event_Start_Date: z.coerce.date().nullable(),
  Campus_Name: z.string().nullable(),
});

export type ProjectRSVP = z.infer<typeof ProjectRSVPSchema>;
