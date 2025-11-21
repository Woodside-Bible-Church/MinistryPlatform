import { z } from "zod";

/**
 * Project Schema (with RSVP fields)
 * Projects can be used for budgets, RSVPs, or other event management
 */
export const ProjectSchema = z.object({
  Project_ID: z.number().int().positive(),
  Project_Title: z.string().min(1).max(255),
  Project_Start: z.coerce.date(),
  Project_End: z.coerce.date().nullable(),
  Project_Coordinator_Contact_ID: z.number().int().positive().nullable(),
  Project_Approved: z.boolean().nullable(),
  Project_Type_ID: z.number().int().positive().nullable(),
  Project_Group_ID: z.number().int().positive().nullable(),

  // RSVP-specific fields
  RSVP_Title: z.string().max(255).nullable(),
  RSVP_Description: z.string().nullable(),
  RSVP_Start_Date: z.coerce.date().nullable(),
  RSVP_End_Date: z.coerce.date().nullable(),
  RSVP_Is_Active: z.boolean().nullable(),
  RSVP_Require_Contact_Lookup: z.boolean().nullable(),
  RSVP_Allow_Guest_Submission: z.boolean().nullable(),
  RSVP_Slug: z.string().max(100).nullable(),
  RSVP_Primary_Color: z.string().max(7).nullable(), // Hex color
  RSVP_Secondary_Color: z.string().max(7).nullable(),
  RSVP_Accent_Color: z.string().max(7).nullable(),
  RSVP_Background_Color: z.string().max(7).nullable(),
  RSVP_Confirmation_Email_Template_ID: z.number().int().nullable(),
  RSVP_Reminder_Email_Template_ID: z.number().int().nullable(),
  RSVP_Days_To_Remind: z.number().int().nullable(),
  RSVP_URL: z.string().max(500).nullable(),

  Domain_ID: z.number().int().default(1),
});

export const CreateProjectSchema = ProjectSchema.omit({
  Project_ID: true,
});

export const UpdateProjectSchema = ProjectSchema.partial().required({
  Project_ID: true,
});

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;

/**
 * Simplified Project for listing (only RSVP projects)
 */
export const RSVPProjectListSchema = z.object({
  Project_ID: z.number().int().positive(),
  Project_Title: z.string(),
  RSVP_Title: z.string().nullable(),
  RSVP_Description: z.string().nullable(),
  RSVP_Start_Date: z.coerce.date().nullable(),
  RSVP_End_Date: z.coerce.date().nullable(),
  RSVP_Is_Active: z.boolean().nullable(),
  RSVP_Slug: z.string().nullable(),
  Event_Count: z.number().int().default(0), // From subquery
  RSVP_Count: z.number().int().default(0), // From subquery
});

export type RSVPProjectList = z.infer<typeof RSVPProjectListSchema>;
