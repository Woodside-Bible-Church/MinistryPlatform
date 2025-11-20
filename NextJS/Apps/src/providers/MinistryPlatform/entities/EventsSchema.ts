import { z } from "zod";

export const EventSchema = z.object({
  Event_ID: z.number(),
  Event_Title: z.string(),
  Event_Start_Date: z.string(),
  Event_End_Date: z.string(),
  Congregation_ID: z.number().optional().nullable(),
  Event_Type_ID: z.number().optional().nullable(),
  // RSVP-related fields (migrated from old Event_RSVPs system)
  Project_ID: z.number().optional().nullable(),
  Include_In_RSVP: z.boolean().optional().nullable(),
  RSVP_Capacity: z.number().optional().nullable(),
  RSVP_Capacity_Modifier: z.number().optional().nullable(),
  Minor_Registration: z.boolean().optional().nullable(),
});
