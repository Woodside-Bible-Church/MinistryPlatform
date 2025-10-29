import { z } from "zod";
import { HouseholdSchema } from "./HouseholdsSchema";

export type Household = z.infer<typeof HouseholdSchema>;
