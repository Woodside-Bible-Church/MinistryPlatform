import { z } from "zod";

export const EventMetricSchema = z.object({
  Event_Metric_ID: z.number(),
  Event_ID: z.number(),
  Metric_ID: z.number(),
  Numerical_Value: z.number(),
  Group_ID: z.number().optional().nullable(),
});

export const CreateEventMetricSchema = z.object({
  Event_ID: z.number(),
  Metric_ID: z.number(),
  Numerical_Value: z.number(),
  Group_ID: z.number().optional().nullable(),
  Domain_ID: z.number().optional().default(1),
});
