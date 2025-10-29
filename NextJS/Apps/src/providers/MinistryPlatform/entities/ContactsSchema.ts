import { z } from "zod";

export const ContactSchema = z.object({
  Contact_ID: z.number().int(),
  First_Name: z.string().nullable(),
  Last_Name: z.string(),
  Nickname: z.string().nullable(),
  Display_Name: z.string(),
  Email_Address: z.string().email().nullable(),
  Mobile_Phone: z.string().nullable(),
  Company_Phone: z.string().nullable(),
  Date_of_Birth: z.string().nullable(),
  Gender_ID: z.number().int().nullable(),
  Marital_Status_ID: z.number().int().nullable(),
  Household_ID: z.number().int().nullable(),
  Household_Position_ID: z.number().int().nullable(),
  Participant_Record: z.number().int().nullable(),
  Company: z.boolean().nullable(),
  __Age: z.number().int().nullable(),
  Image_GUID: z.string().nullable().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;
