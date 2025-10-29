import { z } from "zod";

export const HouseholdSchema = z.object({
  Household_ID: z.number().int(),
  Household_Name: z.string(),
  Address_Line_1: z.string().nullable(),
  Address_Line_2: z.string().nullable(),
  City: z.string().nullable(),
  State: z.string().nullable(),
  Postal_Code: z.string().nullable(),
  Foreign_Country: z.string().nullable(),
  Home_Phone: z.string().nullable(),
});

export type Household = z.infer<typeof HouseholdSchema>;
