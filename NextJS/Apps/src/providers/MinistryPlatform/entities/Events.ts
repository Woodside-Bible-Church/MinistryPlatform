import { z } from "zod";
import { EventSchema } from "./EventsSchema";

export type Event = z.infer<typeof EventSchema>;
