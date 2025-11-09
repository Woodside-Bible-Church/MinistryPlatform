// TypeScript types for confirmation card system
import { RSVPConfirmationResponse } from "./rsvp";

// ============================================================================
// Card Type Definitions
// ============================================================================

export interface ConfirmationCard {
  Card_Type_ID: number;
  Card_Type_Name: string;
  Component_Name: string;
  Icon_Name: string;
  Display_Order: number;
  Configuration: CardConfiguration;
}

// Base configuration that all cards support
export interface BaseCardConfiguration {
  title: string;
  [key: string]: unknown; // Allow additional properties
}

export type CardConfiguration =
  | InstructionsCardConfig
  | MapCardConfig
  | QRCodeCardConfig
  | ShareCardConfig
  | AddToCalendarCardConfig
  | ParkingCardConfig
  | WhatToBringCardConfig
  | ScheduleCardConfig
  | ContactInfoCardConfig
  | WeatherCardConfig
  | ChildcareCardConfig
  | GroupAssignmentCardConfig;

// ============================================================================
// Individual Card Configurations
// ============================================================================

export interface InstructionsCardConfig extends BaseCardConfiguration {
  bullets: InstructionBullet[];
}

export interface InstructionBullet {
  icon: string; // Lucide icon name
  text: string;
}

export interface MapCardConfig extends BaseCardConfiguration {
  latitude?: number;
  longitude?: number;
  address?: string;
  showDirectionsLink?: boolean;
  mapProvider?: "google" | "apple" | "embedded";
  customInstructions?: string;
}

export interface QRCodeCardConfig extends BaseCardConfiguration {
  qrType: "checkin" | "calendar" | "url" | "custom";
  qrData: string; // Can include tokens like {rsvp_id}
  description?: string;
  includeConfirmationNumber?: boolean;
  size?: number; // QR code size in pixels
}

export interface ShareCardConfig extends BaseCardConfiguration {
  enabledMethods: ("sms" | "email" | "facebook" | "twitter" | "copy")[];
  customMessage?: string; // Can include tokens
  shareUrl?: string; // Override default event URL
}

export interface AddToCalendarCardConfig extends BaseCardConfiguration {
  providers: ("google" | "apple" | "outlook" | "ics")[];
  eventDescription?: string;
  location?: string;
  reminderMinutes?: number;
}

export interface ParkingCardConfig extends BaseCardConfiguration {
  description?: string;
  parkingLots?: ParkingLot[];
  showMap?: boolean;
}

export interface ParkingLot {
  name: string;
  description: string;
  available?: boolean;
  distance?: string;
}

export interface WhatToBringCardConfig extends BaseCardConfiguration {
  items: BringItem[];
}

export interface BringItem {
  icon?: string; // Lucide icon name
  text: string;
  required?: boolean;
}

export interface ScheduleCardConfig extends BaseCardConfiguration {
  timelineItems: TimelineItem[];
  showDuration?: boolean;
}

export interface TimelineItem {
  time: string; // "9:00 AM"
  title: string;
  description?: string;
  duration?: string; // "30 min"
}

export interface ContactInfoCardConfig extends BaseCardConfiguration {
  contactName?: string;
  phone?: string;
  email?: string;
  officeHours?: string;
  showSocialMedia?: boolean;
}

export interface WeatherCardConfig extends BaseCardConfiguration {
  showExtendedForecast?: boolean;
  showHourly?: boolean;
  zipCode?: string;
}

export interface ChildcareCardConfig extends BaseCardConfiguration {
  description?: string;
  ageRange?: string;
  registrationRequired?: boolean;
  registrationUrl?: string;
  availableSpots?: number;
}

export interface GroupAssignmentCardConfig extends BaseCardConfiguration {
  groupName?: string;
  groupLeader?: string;
  meetingLocation?: string;
  showGroupMembers?: boolean;
  groupMembers?: string[];
}

// ============================================================================
// Card Component Props
// ============================================================================

export interface CardProps<T extends BaseCardConfiguration = BaseCardConfiguration> {
  config: T;
  rsvpData: RSVPConfirmationResponse;
}

// ============================================================================
// Token Replacement
// ============================================================================

export type TokenKey =
  | "{rsvp_id}"
  | "{event_id}"
  | "{first_name}"
  | "{last_name}"
  | "{email}"
  | "{party_size}"
  | "{event_title}"
  | "{event_date}"
  | "{event_time}"
  | "{campus_name}"
  | "{confirmation_number}";

export interface TokenMap {
  "{rsvp_id}": number;
  "{event_id}": number;
  "{first_name}": string;
  "{last_name}": string;
  "{email}": string;
  "{party_size}": number;
  "{event_title}": string;
  "{event_date}": string;
  "{event_time}": string;
  "{campus_name}": string;
  "{confirmation_number}": string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Replace tokens in a string with actual values from RSVP data
 */
export function replaceTokens(
  template: string,
  rsvpData: RSVPConfirmationResponse
): string {
  const tokens: TokenMap = {
    "{rsvp_id}": rsvpData.Event_RSVP_ID,
    "{event_id}": rsvpData.Event_ID,
    "{first_name}": rsvpData.First_Name,
    "{last_name}": rsvpData.Last_Name,
    "{email}": rsvpData.Email_Address,
    "{party_size}": rsvpData.Party_Size,
    "{event_title}": rsvpData.Event_Title,
    "{event_date}": new Date(rsvpData.Event_Start_Date).toLocaleDateString(),
    "{event_time}": new Date(rsvpData.Event_Start_Date).toLocaleTimeString(
      "en-US",
      { hour: "numeric", minute: "2-digit" }
    ),
    "{campus_name}": rsvpData.Campus_Name,
    "{confirmation_number}": `${rsvpData.Event_RSVP_ID}${rsvpData.Event_ID}`,
  };

  let result = template;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(token, "g"), String(value));
  }

  return result;
}

/**
 * Build a shareable URL for the event
 */
export function buildEventShareUrl(
  eventId: number,
  baseUrl: string = window.location.origin
): string {
  return `${baseUrl}/?eventId=${eventId}`;
}

/**
 * Generate ICS calendar file content
 */
export function generateICSContent(
  rsvpData: RSVPConfirmationResponse,
  config: AddToCalendarCardConfig
): string {
  const startDate = new Date(rsvpData.Event_Start_Date);
  const endDate = new Date(rsvpData.Event_End_Date);

  const formatDate = (date: Date) => {
    return date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  };

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Woodside Bible Church//RSVP Widget//EN
BEGIN:VEVENT
UID:${rsvpData.Event_RSVP_ID}-${rsvpData.Event_ID}@woodsidebible.org
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${rsvpData.Event_Title}
DESCRIPTION:${config.eventDescription || ""}
LOCATION:${config.location || `${rsvpData.Campus_Name}, ${rsvpData.Campus_Address_Line_1}, ${rsvpData.Campus_City}, ${rsvpData.Campus_State} ${rsvpData.Campus_Postal_Code}`}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
}
