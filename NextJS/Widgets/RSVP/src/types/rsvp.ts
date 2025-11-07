// TypeScript types and Zod schemas for RSVP Widget
import { z } from "zod";

// ============================================================================
// Database Entity Types
// ============================================================================

export interface EventRSVP {
  Event_RSVP_ID: number;
  Event_ID: number;
  Contact_ID: number | null;
  First_Name: string;
  Last_Name: string;
  Email_Address: string;
  Phone_Number: string | null;
  Party_Size: number;
  Is_New_Visitor: boolean;
  RSVP_Date: Date;
  Domain_ID: number;
}

export interface EventCapacity {
  Event_Capacity_ID: number;
  Event_ID: number;
  Max_Capacity: number;
  Domain_ID: number;
}

export interface EventSeries {
  Event_Series_ID: number;
  Series_Name: string;
  Series_Description: string | null;
  Start_Date: Date;
  End_Date: Date;
  Is_Active: boolean;
  Domain_ID: number;
}

export interface EventSeriesEvent {
  Event_Series_Event_ID: number;
  Event_Series_ID: number;
  Event_ID: number;
  Display_Order: number | null;
}

// ============================================================================
// API Response Types (from stored procedures)
// ============================================================================

export interface ServiceTimeResponse {
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string; // ISO date string from MP
  Event_End_Date: string;
  Campus_Name: string;
  Congregation_ID: number;
  Max_Capacity: number;
  Total_RSVPs: number;
  Total_Attendees: number;
  Capacity_Percentage: number;
  Is_Available: boolean;
}

export interface RSVPConfirmationResponse {
  Event_RSVP_ID: number;
  Event_ID: number;
  First_Name: string;
  Last_Name: string;
  Email_Address: string;
  Party_Size: number;
  Event_Title: string;
  Event_Start_Date: string;
  Event_End_Date: string;
  Campus_Name: string;
  Campus_Address_Line_1: string;
  Campus_Address_Line_2: string | null;
  Campus_City: string;
  Campus_State: string;
  Campus_Postal_Code: string;
}

export interface EventSeriesResponse {
  Event_Series_ID: number;
  Series_Name: string;
  Series_Description: string | null;
  Start_Date: string;
  End_Date: string;
  Event_Count: number;
}

export interface MyRSVPResponse {
  Event_RSVP_ID: number;
  Event_ID: number;
  Party_Size: number;
  Is_New_Visitor: boolean;
  RSVP_Date: string;
  Event_Title: string;
  Event_Start_Date: string;
  Event_End_Date: string;
  Campus_Name: string;
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Schema for RSVP form submission
 */
export const RSVPFormSchema = z.object({
  eventId: z.number().int().positive(),
  contactId: z.number().int().positive().nullable().optional(),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be 50 characters or less"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be 50 characters or less"),
  emailAddress: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be 255 characters or less"),
  phoneNumber: z
    .string()
    .regex(
      /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/,
      "Invalid phone number format"
    )
    .optional()
    .or(z.literal("")),
  partySize: z
    .number()
    .int()
    .min(1, "Party size must be at least 1")
    .max(20, "Party size cannot exceed 20"),
  isNewVisitor: z.boolean().optional().default(false),
});

export type RSVPFormInput = z.infer<typeof RSVPFormSchema>;

/**
 * Schema for service time query parameters
 */
export const ServiceTimeQuerySchema = z.object({
  seriesId: z.number().int().positive().optional(),
  congregationId: z.number().int().positive().optional(),
});

export type ServiceTimeQuery = z.infer<typeof ServiceTimeQuerySchema>;

/**
 * Schema for campus selection
 */
export const CampusSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  congregationId: z.number().int().positive(),
});

export type Campus = z.infer<typeof CampusSchema>;

// ============================================================================
// Widget State Types
// ============================================================================

export type StepType = "campus" | "service" | "form" | "confirmation";

export interface WidgetState {
  currentStep: StepType;
  selectedCampus: Campus | null;
  selectedServiceTime: ServiceTimeResponse | null;
  rsvpConfirmation: RSVPConfirmationResponse | null;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface CampusSelectorProps {
  campuses: Campus[];
  selectedCampus: Campus | null;
  onSelectCampus: (campus: Campus) => void;
}

export interface ServiceTimeCardProps {
  serviceTime: ServiceTimeResponse;
  selected: boolean;
  onSelect: () => void;
}

export interface RSVPFormProps {
  selectedServiceTime: ServiceTimeResponse;
  onSubmit: (data: RSVPFormInput) => Promise<void>;
  onBack: () => void;
}

export interface ConfirmationViewProps {
  confirmation: RSVPConfirmationResponse;
  onReset: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Converts MP date string to Date object
 */
export function parseServiceDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Formats service time for display (e.g., "5:00 PM")
 */
export function formatServiceTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Formats service date for display (e.g., "Tuesday, December 24")
 */
export function formatServiceDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get capacity status color class
 */
export function getCapacityColorClass(percentage: number): string {
  if (percentage < 50) return "bg-green-500";
  if (percentage < 75) return "bg-yellow-500";
  if (percentage < 90) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get capacity status text
 */
export function getCapacityStatusText(percentage: number): string {
  if (percentage < 50) return "Plenty of space";
  if (percentage < 75) return "Good availability";
  if (percentage < 90) return "Filling up";
  if (percentage < 100) return "Almost full";
  return "Full";
}

/**
 * Format party size for display
 */
export function formatPartySize(size: number): string {
  if (size === 1) return "1 person";
  return `${size} people`;
}
