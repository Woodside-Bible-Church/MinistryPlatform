import { z } from "zod";

export const EventSchema = z.object({
  Event_ID: z.number(),
  Event_Title: z.string(),
  Event_Start_Date: z.string(),
  Event_End_Date: z.string(),
  Congregation_ID: z.number().optional().nullable(),
  Event_Type_ID: z.number().optional().nullable(),
});
