import { z } from "zod";
import { EventMetricSchema, CreateEventMetricSchema } from "./EventMetricsSchema";

export type EventMetric = z.infer<typeof EventMetricSchema>;
export type CreateEventMetric = z.infer<typeof CreateEventMetricSchema>;
