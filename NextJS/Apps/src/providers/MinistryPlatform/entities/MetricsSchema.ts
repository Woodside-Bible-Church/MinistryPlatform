import { z } from "zod";

export const MetricSchema = z.object({
  Metric_ID: z.number(),
  Metric_Title: z.string(),
  Is_Headcount: z.boolean(),
});
