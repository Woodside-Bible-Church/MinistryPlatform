// ===================================================================
// RSVP Widget TypeScript Types
// ===================================================================
// Matches database schema from RSVP_DATABASE_SCHEMA.md
// Generated from stored procedure response structures
// ===================================================================

import { z } from "zod";
import type {
  CardConfiguration as ImportedCardConfiguration,
  InstructionsCardConfig,
  MapCardConfig,
  QRCodeCardConfig,
  ShareCardConfig,
  AddToCalendarCardConfig,
  ParkingCardConfig,
  ChildcareCardConfig,
  ContactInfoCardConfig,
  ScheduleCardConfig,
  WeatherCardConfig,
  WhatToBringCardConfig,
  GroupAssignmentCardConfig,
} from './confirmationCards';

// ===================================================================
// API Response Types (from stored procedures)
// ===================================================================

/**
 * Complete response from api_Custom_RSVP_Project_Data_JSON
 * This is what the widget receives from GET /api/rsvp/project/{id}
 */
export interface ProjectRSVPDataResponse {
  Project: ProjectConfig;  // Changed from Project_RSVP
  Events: RSVPEvent[];
  Questions: RSVPQuestion[];
  Confirmation_Cards: ConfirmationCard[];
  Campus_Meeting_Instructions?: CampusMeetingInstruction[];
  Carousels?: EventCarousel[];  // New: Non-RSVP events grouped by carousel name
}

/**
 * Campus-specific meeting instructions from Project_Campuses table
 */
export interface CampusMeetingInstruction {
  Congregation_ID: number;
  Campus_Name: string;
  Campus_Slug: string;
  Meeting_Instructions: string | null;
  Campus_Image_URL: string | null;  // Default image from Public_Event_ID
}

/**
 * Event carousel grouping (for non-RSVP related events)
 */
export interface EventCarousel {
  Carousel_Name: string;  // Display name for the carousel (e.g., "Other Christmas Events")
  Events: CarouselEvent[];
}

/**
 * Individual event in a carousel (non-RSVP event)
 */
export interface CarouselEvent {
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string; // ISO date string
  Event_End_Date: string; // ISO date string
  Event_Type_ID: number;
  Congregation_ID: number | null;
  Campus_Name: string | null;
  Campus_Slug: string | null;
  Campus_Location: string | null;
  Description: string | null;
  Event_Image_URL: string | null;  // Default image from Events table
  Event_URL: string | null;  // Link to event details page
}

/**
 * Response from api_Custom_RSVP_Submit_JSON
 * Returned after successful RSVP submission
 */
export interface RSVPSubmissionResponse {
  status: 'success' | 'error';
  confirmation?: RSVPConfirmation;
  message?: string;
  error_number?: number;
  error_line?: number;
}

// ===================================================================
// Project Configuration (with RSVP fields)
// ===================================================================

export interface ProjectConfig {
  Project_ID: number;
  RSVP_Title: string;
  RSVP_Description: string | null;
  RSVP_BG_Image_URL: string | null;  // From dp_Files: RSVP_BG_Image.jpg
  RSVP_Image_URL: string | null;     // From dp_Files: RSVP_Image.jpg
  RSVP_Start_Date: string | null;    // ISO date string
  RSVP_End_Date: string | null;      // ISO date string
  RSVP_Is_Active: boolean;
  RSVP_Require_Contact_Lookup: boolean;
  RSVP_Allow_Guest_Submission: boolean;
  RSVP_Slug: string | null;
  // Branding colors (dp_Color format - hex codes like #61BC47)
  RSVP_Primary_Color: string | null;     // Primary brand color (buttons, headers)
  RSVP_Secondary_Color: string | null;   // Secondary brand color
  RSVP_Accent_Color: string | null;      // Accent color (highlights, links)
  RSVP_Background_Color: string | null;  // Background color override
}

// Backward compatibility alias
export type ProjectRSVPConfig = ProjectConfig;

// ===================================================================
// Events
// ===================================================================

export interface RSVPEvent {
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string; // ISO date string
  Event_End_Date: string; // ISO date string
  Event_Type_ID: number;
  Congregation_ID: number | null;
  Campus_Name: string | null;
  Campus_Slug: string | null;
  Campus_SVG_URL: string | null;
  Campus_Location: string | null;
  Capacity: number; // 9999 = unlimited capacity (NULL in DB)
  Current_RSVPs: number;
  RSVP_Capacity_Modifier: number;
  Adjusted_RSVP_Count: number;
  Capacity_Percentage: number;
  Max_Capacity: number; // 9999 = unlimited capacity (NULL in DB)
  Is_Available: boolean;
  Campus_Address: string | null;
  Campus_City: string | null;
  Campus_State: string | null;
  Campus_Zip: string | null;
  Minor_Registration: boolean; // Allow parents to register minors without email
}

// ===================================================================
// Questions
// ===================================================================

export interface RSVPQuestion {
  Question_ID: number;
  Question_Text: string;
  Question_Type: QuestionTypeName;
  Component_Name: string;
  Field_Order: number;
  Is_Required: boolean;
  Helper_Text: string | null;
  Min_Value: number | null;
  Max_Value: number | null;
  Default_Value: string | null;
  Placeholder_Text: string | null;
  Icon_Name: string | null;
  Options: string; // JSON string from stored proc - needs parsing
}

export interface QuestionOption {
  Option_ID: number;
  Option_Text: string;
  Option_Value: string;
  Display_Order: number;
}

export type QuestionTypeName =
  | 'Counter'
  | 'Checkbox'
  | 'Text'
  | 'Textarea'
  | 'Dropdown'
  | 'Radio'
  | 'Multi-Checkbox'
  | 'Date'
  | 'Time'
  | 'Email'
  | 'Phone'
  | 'Searchable Dropdown'
  | 'Multi-Select Dropdown'
  | 'Tag Input'
  | 'Button Group'
  | 'Multi-Button Group'
  | 'Slider'
  | 'Rating'
  | 'File Upload'
  | 'Color Picker';

// Parsed question with options array
export interface ParsedRSVPQuestion extends Omit<RSVPQuestion, 'Options'> {
  Options: QuestionOption[];
}

// ===================================================================
// Confirmation Cards
// ===================================================================

export interface ConfirmationCard {
  Card_ID: number;
  Card_Type_ID: number;
  Card_Type_Name: CardTypeName;
  Component_Name: string;
  Icon_Name: string | null;
  Display_Order: number;
  Congregation_ID: number | null;
  Configuration: string; // JSON string from stored proc - needs parsing
}

export type CardTypeName =
  | 'Instructions'
  | 'Map'
  | 'QR Code'
  | 'Share'
  | 'Add to Calendar'
  | 'Parking'
  | 'Childcare'
  | 'Contact Info'
  | 'Schedule'
  | 'Weather'
  | 'What to Bring'
  | 'Group Assignment';

// Re-export card configuration types for backward compatibility
export type CardConfiguration = ImportedCardConfiguration;
export type {
  InstructionsCardConfig,
  MapCardConfig,
  QRCodeCardConfig,
  ShareCardConfig,
  AddToCalendarCardConfig,
  ParkingCardConfig,
  ChildcareCardConfig,
  ContactInfoCardConfig,
  ScheduleCardConfig,
  WeatherCardConfig,
  WhatToBringCardConfig,
  GroupAssignmentCardConfig,
};

// Parsed card with configuration object
export interface ParsedConfirmationCard extends Omit<ConfirmationCard, 'Configuration'> {
  Configuration: CardConfiguration;
}

// ===================================================================
// RSVP Submission
// ===================================================================

export interface RSVPSubmissionRequest {
  Event_ID: number;
  Project_ID: number;  // Changed from Project_RSVP_ID
  Contact_ID?: number | null;  // Person submitting the RSVP (logged in user)
  Participant_ID?: number | null;  // Person attending the event (from family dropdown selection)
  First_Name: string;
  Last_Name: string;
  Email_Address: string;
  Phone_Number?: string | null;
  Answers: RSVPAnswer[];
}

export interface RSVPAnswer {
  Question_ID: number;
  Text_Value?: string;
  Numeric_Value?: number;
  Boolean_Value?: boolean;
  Date_Value?: string; // ISO date string
}

export interface RSVPConfirmation {
  Event_RSVP_ID: number;
  Confirmation_Code: string;
  Event_Participant_ID: number | null;
  Party_Size: number;
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string;
  Event_End_Date: string;
  Congregation_ID: number | null;
  Campus_Name: string | null;
  Campus_Location: string | null;
  Campus_Address: string | null;
  Campus_City: string | null;
  Campus_State: string | null;
  Campus_Zip: string | null;
  Google_Maps_URL: string;
  First_Name?: string; // Added for confirmation page display
  Last_Name?: string; // Added for confirmation page display
}

// ===================================================================
// Frontend State Types
// ===================================================================

export interface RSVPFormData {
  eventId: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber: string;
  answers: Record<number, RSVPAnswerValue>;
}

export type RSVPAnswerValue = string | number | boolean | string[] | null;

export interface RSVPFormStep {
  step: 'campus' | 'service' | 'contact' | 'details' | 'confirmation';
  canGoBack: boolean;
  canGoForward: boolean;
}

// ===================================================================
// Helper Types for UI Components
// ===================================================================

export interface ServiceTimeDisplay extends RSVPEvent {
  formattedDate: string;
  formattedTime: string;
  capacityStatus: 'available' | 'limited' | 'full';
  capacityColor: string;
}

// Alias for backward compatibility
export type ServiceTimeResponse = ServiceTimeDisplay;

export interface CampusOption {
  id: number;
  name: string;
  congregationId: number;
}

// ===================================================================
// Question Component Props
// ===================================================================

export interface QuestionComponentProps {
  question: ParsedRSVPQuestion;
  value: RSVPAnswerValue;
  onChange: (value: RSVPAnswerValue) => void;
  error?: string;
}

// ===================================================================
// Card Component Props
// ===================================================================

export interface CardComponentProps {
  card: ParsedConfirmationCard;
  confirmation: RSVPConfirmation;
}

// ===================================================================
// Zod Schemas for Validation
// ===================================================================

/**
 * Schema for RSVP form submission - base contact info
 */
export const RSVPContactInfoSchema = z.object({
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
    .max(100, "Email must be 100 characters or less"),
  phoneNumber: z
    .string()
    .regex(
      /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/,
      "Invalid phone number format"
    )
    .optional()
    .or(z.literal("")),
});

export type RSVPContactInfo = z.infer<typeof RSVPContactInfoSchema>;

/**
 * Schema for complete RSVP form submission (both steps)
 */
export const RSVPFormSchema = z.object({
  eventId: z.number().int().positive(),
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
    .max(100, "Email must be 100 characters or less"),
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
    .max(99, "Party size cannot exceed 99"),
  isNewVisitor: z.boolean(),
});

export type RSVPFormInput = z.infer<typeof RSVPFormSchema>;

/**
 * Schema for campus selection
 */
export const CampusSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  congregationId: z.number().int().positive(),
});

export type Campus = z.infer<typeof CampusSchema>;

// ===================================================================
// Utility Functions
// ===================================================================

/**
 * Parse question options from JSON string
 */
export function parseQuestionOptions(optionsJson: string): QuestionOption[] {
  try {
    const parsed = JSON.parse(optionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Parse card configuration from JSON string
 */
export function parseCardConfiguration(configJson: string): CardConfiguration {
  try {
    return JSON.parse(configJson);
  } catch {
    return { title: 'Configuration Error' } as InstructionsCardConfig;
  }
}

/**
 * Parse complete project RSVP data response
 */
export function parseProjectRSVPData(data: ProjectRSVPDataResponse): {
  config: ProjectConfig;
  events: RSVPEvent[];
  questions: ParsedRSVPQuestion[];
  cards: ParsedConfirmationCard[];
} {
  return {
    config: data.Project,  // Changed from data.Project_RSVP
    events: data.Events,
    questions: data.Questions.map(q => ({
      ...q,
      Options: parseQuestionOptions(q.Options),
    })),
    cards: data.Confirmation_Cards.map(c => ({
      ...c,
      Configuration: parseCardConfiguration(c.Configuration),
    })),
  };
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
 * Get capacity status from percentage
 */
export function getCapacityStatus(percentage: number): 'available' | 'limited' | 'full' {
  if (percentage >= 100) return 'full';
  if (percentage >= 75) return 'limited';
  return 'available';
}

/**
 * Get capacity color class
 * 50% and under: Green (plenty of space)
 * 51-75%: Yellow (good availability)
 * 76-90%: Orange (filling up)
 * 90-100%: Red (near capacity)
 * 100+%: Red (overflow)
 */
export function getCapacityColorClass(percentage: number): string {
  if (percentage <= 50) return "bg-green-500";
  if (percentage <= 75) return "bg-yellow-500";
  if (percentage <= 90) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Get capacity status text
 * Note: percentage of 0 could mean either truly 0% or unlimited capacity (NULL in DB)
 */
export function getCapacityStatusText(percentage: number): string {
  if (percentage === 0) return "Plenty of space"; // Could be unlimited capacity or just empty
  if (percentage <= 50) return "Plenty of space";
  if (percentage <= 75) return "Good availability";
  if (percentage <= 90) return "Filling up";
  if (percentage < 100) return "Near capacity";
  return "Overflow";
}

/**
 * Format party size for display
 */
export function formatPartySize(size: number): string {
  if (size === 1) return "1 person";
  return `${size} people`;
}

/**
 * Convert RSVPFormData to RSVPSubmissionRequest
 */
export function formatRSVPSubmission(
  formData: RSVPFormData,
  projectId: number,  // Changed param name from projectRsvpId
  contactId?: number | null
): RSVPSubmissionRequest {
  // Convert answers object to array format for stored procedure
  const answers: RSVPAnswer[] = Object.entries(formData.answers).map(([questionId, value]) => {
    const answer: RSVPAnswer = {
      Question_ID: parseInt(questionId),
    };

    // Determine which field to populate based on value type
    if (typeof value === 'number') {
      answer.Numeric_Value = value;
    } else if (typeof value === 'boolean') {
      answer.Boolean_Value = value;
    } else if (typeof value === 'string') {
      // Check if it's a date string
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        answer.Date_Value = value;
      } else {
        answer.Text_Value = value;
      }
    } else if (Array.isArray(value)) {
      // Multi-select answers as JSON string
      answer.Text_Value = JSON.stringify(value);
    }

    return answer;
  });

  return {
    Event_ID: formData.eventId,
    Project_ID: projectId,  // Changed from Project_RSVP_ID
    Contact_ID: contactId,
    First_Name: formData.firstName,
    Last_Name: formData.lastName,
    Email_Address: formData.emailAddress,
    Phone_Number: formData.phoneNumber || null,
    Answers: answers,
  };
}

// ===================================================================
// Email Campaigns Types
// ===================================================================

/**
 * Email template from dp_Communication_Templates
 */
export interface RSVPEmailTemplate {
  Communication_Template_ID: number;
  Template_Name: string;
  Subject_Text: string;
  Body_Html: string;
  From_Contact: number;
  Reply_to_Contact: number;
}

/**
 * Email campaign configuration
 */
export interface RSVPEmailCampaign {
  Campaign_ID: number;
  Campaign_Name: string;
  Campaign_Description: string | null;
  Project_ID: number;  // Changed from Project_RSVP_ID
  Congregation_ID: number | null;
  Communication_Template_ID: number;
  Send_Timing_Type: 'Days_Before_Event' | 'Days_After_Event' | 'Specific_DateTime';
  Send_Days_Offset: number | null;
  Send_Specific_DateTime: string | null; // ISO date string
  Is_Active: boolean;
  Display_Order: number;
  Conditions: RSVPEmailCampaignCondition[];
}

/**
 * Campaign condition (AND logic - all must be true)
 */
export interface RSVPEmailCampaignCondition {
  Condition_ID: number;
  Campaign_ID: number;
  Question_ID: number;
  Condition_Type:
    | 'Equals'
    | 'Not_Equals'
    | 'Contains'
    | 'Not_Contains'
    | 'Greater_Than'
    | 'Less_Than'
    | 'Greater_Or_Equal'
    | 'Less_Or_Equal'
    | 'Is_True'
    | 'Is_False'
    | 'Is_Null'
    | 'Is_Not_Null';
  Condition_Value: string | null;
}

/**
 * Campaign log entry (audit trail)
 */
export interface RSVPEmailCampaignLog {
  Log_ID: number;
  Event_RSVP_ID: number;
  Campaign_ID: number | null; // NULL for confirmation emails
  Communication_ID: number | null;
  Campaign_Type: 'Confirmation' | 'Campaign';
  Scheduled_Send_Date: string; // ISO date string
  Was_Sent: boolean;
  Send_Date: string | null; // ISO date string
  Error_Message: string | null;
  Created_Date: string; // ISO date string
}

/**
 * Data used to replace shortcodes in email templates
 */
export interface RSVPEmailData {
  // Contact info
  First_Name: string;
  Last_Name: string;
  Email_Address: string;
  Phone_Number: string | null;

  // Event info
  Event_Title: string;
  Event_Date: string; // Formatted: "Tuesday, December 24"
  Event_Time: string; // Formatted: "5:00 PM"
  Event_Day: string; // "Tuesday"
  Event_Month_Day: string; // "December 24"
  Event_Start_Date_ISO: string; // ISO format for calendar links
  Event_End_Date_ISO: string; // ISO format for calendar links

  // Campus info
  Campus_Name: string;
  Campus_Location: string | null;
  Campus_Address: string | null;
  Campus_City: string | null;
  Campus_State: string | null;
  Campus_Zip: string | null;
  Campus_Full_Address: string; // Formatted full address
  Google_Maps_URL: string;

  // RSVP info
  Confirmation_Code: string;
  Party_Size: number;
  Event_RSVP_ID: number;

  // Project info
  RSVP_Title: string;
  RSVP_Description: string | null;

  // Dynamic answers - HTML formatted Q&A list
  Answers_List: string;
}
