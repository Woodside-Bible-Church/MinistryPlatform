import { z } from "zod";
import { ContactSchema } from "./ContactsSchema";

export type Contact = z.infer<typeof ContactSchema>;
