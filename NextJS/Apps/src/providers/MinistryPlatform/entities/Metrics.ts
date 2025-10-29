import { z } from "zod";
import { MetricSchema } from "./MetricsSchema";

export type Metric = z.infer<typeof MetricSchema>;
