import { z } from "zod";

/**
 * Event Series Schema
 * Groups related events together (e.g., all Christmas 2024 services across campuses)
 */
export const EventSeriesSchema = z.object({
  Event_Series_ID: z.number().int().positive(),
  Series_Name: z.string().min(1).max(100),
  Series_Description: z.string().max(500).nullable(),
  Start_Date: z.coerce.date(),
  End_Date: z.coerce.date(),
  Is_Active: z.boolean().default(true),
  Domain_ID: z.number().int().default(1),
});

export const CreateEventSeriesSchema = EventSeriesSchema.omit({
  Event_Series_ID: true,
});

export const UpdateEventSeriesSchema = EventSeriesSchema.partial().required({
  Event_Series_ID: true,
});

export type EventSeries = z.infer<typeof EventSeriesSchema>;
export type CreateEventSeries = z.infer<typeof CreateEventSeriesSchema>;
export type UpdateEventSeries = z.infer<typeof UpdateEventSeriesSchema>;

/**
 * Event Series with event count (from stored procedure)
 */
export const EventSeriesWithCountSchema = EventSeriesSchema.extend({
  Event_Count: z.number().int().default(0),
});

export type EventSeriesWithCount = z.infer<typeof EventSeriesWithCountSchema>;
