// Mock data for RSVP Widget development
// Based on Woodside Bible Church's 14 campuses and Christmas service structure

export interface Campus {
  id: number;
  name: string;
  congregationId: number;
}

export interface ServiceTime {
  eventId: number;
  title: string;
  startDate: Date;
  endDate: Date;
  campusId: number;
  campusName: string;
  maxCapacity: number;
  totalAttendees: number;
  totalRSVPs: number;
  capacityPercentage: number;
  isAvailable: boolean;
}

export interface EventSeries {
  seriesId: number;
  seriesName: string;
  seriesDescription: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface RSVPSubmission {
  eventId: number;
  contactId?: number | null;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNumber?: string | null;
  partySize: number;
  isNewVisitor: boolean;
}

export interface RSVPConfirmation {
  rsvpId: number;
  eventId: number;
  firstName: string;
  lastName: string;
  emailAddress: string;
  partySize: number;
  eventTitle: string;
  eventStartDate: Date;
  eventEndDate: Date;
  campusName: string;
  campusAddressLine1: string;
  campusAddressLine2?: string | null;
  campusCity: string;
  campusState: string;
  campusPostalCode: string;
}

// ============================================================================
// 14 Woodside Bible Church Campuses
// ============================================================================
export const mockCampuses: Campus[] = [
  { id: 1, name: "Algonac", congregationId: 1 },
  { id: 2, name: "Chesterfield", congregationId: 2 },
  { id: 3, name: "Detroit", congregationId: 3 },
  { id: 4, name: "Downriver", congregationId: 4 },
  { id: 5, name: "Farmington Hills", congregationId: 5 },
  { id: 6, name: "Lake Orion", congregationId: 6 },
  { id: 7, name: "Lapeer", congregationId: 7 },
  { id: 8, name: "Plymouth", congregationId: 8 },
  { id: 9, name: "Pontiac", congregationId: 9 },
  { id: 10, name: "Romeo", congregationId: 10 },
  { id: 11, name: "Royal Oak", congregationId: 11 },
  { id: 12, name: "Troy", congregationId: 12 },
  { id: 13, name: "Warren", congregationId: 13 },
  { id: 14, name: "White Lake", congregationId: 14 },
];

// ============================================================================
// Event Series
// ============================================================================
export const mockEventSeries: EventSeries = {
  seriesId: 1,
  seriesName: "Christmas 2024",
  seriesDescription: "Join us for Christmas and Christmas Eve services across all 14 campuses!",
  startDate: new Date("2024-12-24T13:00:00"),
  endDate: new Date("2024-12-25T12:00:00"),
  isActive: true,
};

// ============================================================================
// Service Times - Christmas 2024
// ============================================================================
// Based on screenshot showing various service times with capacity percentages
export const mockServiceTimes: ServiceTime[] = [
  // Lake Orion (from screenshot)
  {
    eventId: 101,
    title: "Christmas Eve - Lake Orion",
    startDate: new Date("2024-12-24T13:00:00"),
    endDate: new Date("2024-12-24T14:30:00"),
    campusId: 6,
    campusName: "Lake Orion",
    maxCapacity: 800,
    totalAttendees: 104,
    totalRSVPs: 52,
    capacityPercentage: 13,
    isAvailable: true,
  },
  {
    eventId: 102,
    title: "Christmas Eve - Lake Orion",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 6,
    campusName: "Lake Orion",
    maxCapacity: 800,
    totalAttendees: 200,
    totalRSVPs: 100,
    capacityPercentage: 25,
    isAvailable: true,
  },
  {
    eventId: 103,
    title: "Christmas Eve - Lake Orion",
    startDate: new Date("2024-12-24T17:00:00"),
    endDate: new Date("2024-12-24T18:00:00"),
    campusId: 6,
    campusName: "Lake Orion",
    maxCapacity: 800,
    totalAttendees: 520,
    totalRSVPs: 260,
    capacityPercentage: 65,
    isAvailable: true,
  },

  // Algonac
  {
    eventId: 201,
    title: "Christmas Eve - Algonac",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 1,
    campusName: "Algonac",
    maxCapacity: 300,
    totalAttendees: 45,
    totalRSVPs: 23,
    capacityPercentage: 15,
    isAvailable: true,
  },
  {
    eventId: 202,
    title: "Christmas Eve - Algonac",
    startDate: new Date("2024-12-24T19:00:00"),
    endDate: new Date("2024-12-24T20:00:00"),
    campusId: 1,
    campusName: "Algonac",
    maxCapacity: 300,
    totalAttendees: 90,
    totalRSVPs: 45,
    capacityPercentage: 30,
    isAvailable: true,
  },

  // Chesterfield
  {
    eventId: 301,
    title: "Christmas Eve - Chesterfield",
    startDate: new Date("2024-12-24T15:00:00"),
    endDate: new Date("2024-12-24T16:00:00"),
    campusId: 2,
    campusName: "Chesterfield",
    maxCapacity: 500,
    totalAttendees: 125,
    totalRSVPs: 63,
    capacityPercentage: 25,
    isAvailable: true,
  },
  {
    eventId: 302,
    title: "Christmas Eve - Chesterfield",
    startDate: new Date("2024-12-24T18:00:00"),
    endDate: new Date("2024-12-24T19:00:00"),
    campusId: 2,
    campusName: "Chesterfield",
    maxCapacity: 500,
    totalAttendees: 250,
    totalRSVPs: 125,
    capacityPercentage: 50,
    isAvailable: true,
  },

  // Detroit
  {
    eventId: 401,
    title: "Christmas Day - Detroit",
    startDate: new Date("2024-12-25T10:00:00"),
    endDate: new Date("2024-12-25T11:00:00"),
    campusId: 3,
    campusName: "Detroit",
    maxCapacity: 250,
    totalAttendees: 50,
    totalRSVPs: 25,
    capacityPercentage: 20,
    isAvailable: true,
  },

  // Downriver
  {
    eventId: 501,
    title: "Christmas Eve - Downriver",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 4,
    campusName: "Downriver",
    maxCapacity: 400,
    totalAttendees: 120,
    totalRSVPs: 60,
    capacityPercentage: 30,
    isAvailable: true,
  },
  {
    eventId: 502,
    title: "Christmas Eve - Downriver",
    startDate: new Date("2024-12-24T19:00:00"),
    endDate: new Date("2024-12-24T20:00:00"),
    campusId: 4,
    campusName: "Downriver",
    maxCapacity: 400,
    totalAttendees: 280,
    totalRSVPs: 140,
    capacityPercentage: 70,
    isAvailable: true,
  },

  // Farmington Hills
  {
    eventId: 601,
    title: "Christmas Eve - Farmington Hills",
    startDate: new Date("2024-12-24T15:00:00"),
    endDate: new Date("2024-12-24T16:00:00"),
    campusId: 5,
    campusName: "Farmington Hills",
    maxCapacity: 600,
    totalAttendees: 180,
    totalRSVPs: 90,
    capacityPercentage: 30,
    isAvailable: true,
  },
  {
    eventId: 602,
    title: "Christmas Eve - Farmington Hills",
    startDate: new Date("2024-12-24T17:00:00"),
    endDate: new Date("2024-12-24T18:00:00"),
    campusId: 5,
    campusName: "Farmington Hills",
    maxCapacity: 600,
    totalAttendees: 360,
    totalRSVPs: 180,
    capacityPercentage: 60,
    isAvailable: true,
  },

  // Lapeer
  {
    eventId: 701,
    title: "Christmas Eve - Lapeer",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 7,
    campusName: "Lapeer",
    maxCapacity: 350,
    totalAttendees: 70,
    totalRSVPs: 35,
    capacityPercentage: 20,
    isAvailable: true,
  },

  // Plymouth
  {
    eventId: 801,
    title: "Christmas Eve - Plymouth",
    startDate: new Date("2024-12-24T15:00:00"),
    endDate: new Date("2024-12-24T16:00:00"),
    campusId: 8,
    campusName: "Plymouth",
    maxCapacity: 450,
    totalAttendees: 135,
    totalRSVPs: 68,
    capacityPercentage: 30,
    isAvailable: true,
  },
  {
    eventId: 802,
    title: "Christmas Eve - Plymouth",
    startDate: new Date("2024-12-24T18:00:00"),
    endDate: new Date("2024-12-24T19:00:00"),
    campusId: 8,
    campusName: "Plymouth",
    maxCapacity: 450,
    totalAttendees: 315,
    totalRSVPs: 158,
    capacityPercentage: 70,
    isAvailable: true,
  },

  // Pontiac
  {
    eventId: 901,
    title: "Christmas Eve - Pontiac",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 9,
    campusName: "Pontiac",
    maxCapacity: 300,
    totalAttendees: 90,
    totalRSVPs: 45,
    capacityPercentage: 30,
    isAvailable: true,
  },

  // Romeo
  {
    eventId: 1001,
    title: "Christmas Eve - Romeo",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 10,
    campusName: "Romeo",
    maxCapacity: 400,
    totalAttendees: 144,
    totalRSVPs: 72,
    capacityPercentage: 36,
    isAvailable: true,
  },
  {
    eventId: 1002,
    title: "Christmas Eve - Romeo",
    startDate: new Date("2024-12-24T19:00:00"),
    endDate: new Date("2024-12-24T20:00:00"),
    campusId: 10,
    campusName: "Romeo",
    maxCapacity: 400,
    totalAttendees: 280,
    totalRSVPs: 140,
    capacityPercentage: 70,
    isAvailable: true,
  },

  // Royal Oak
  {
    eventId: 1101,
    title: "Christmas Eve - Royal Oak",
    startDate: new Date("2024-12-24T15:00:00"),
    endDate: new Date("2024-12-24T16:00:00"),
    campusId: 11,
    campusName: "Royal Oak",
    maxCapacity: 550,
    totalAttendees: 121,
    totalRSVPs: 61,
    capacityPercentage: 22,
    isAvailable: true,
  },
  {
    eventId: 1102,
    title: "Christmas Eve - Royal Oak",
    startDate: new Date("2024-12-24T17:00:00"),
    endDate: new Date("2024-12-24T18:00:00"),
    campusId: 11,
    campusName: "Royal Oak",
    maxCapacity: 550,
    totalAttendees: 385,
    totalRSVPs: 193,
    capacityPercentage: 70,
    isAvailable: true,
  },

  // Troy
  {
    eventId: 1201,
    title: "Christmas Eve - Troy",
    startDate: new Date("2024-12-24T14:00:00"),
    endDate: new Date("2024-12-24T15:00:00"),
    campusId: 12,
    campusName: "Troy",
    maxCapacity: 650,
    totalAttendees: 195,
    totalRSVPs: 98,
    capacityPercentage: 30,
    isAvailable: true,
  },
  {
    eventId: 1202,
    title: "Christmas Eve - Troy",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 12,
    campusName: "Troy",
    maxCapacity: 650,
    totalAttendees: 455,
    totalRSVPs: 228,
    capacityPercentage: 70,
    isAvailable: true,
  },

  // Warren
  {
    eventId: 1301,
    title: "Christmas Eve - Warren",
    startDate: new Date("2024-12-24T15:00:00"),
    endDate: new Date("2024-12-24T16:00:00"),
    campusId: 13,
    campusName: "Warren",
    maxCapacity: 500,
    totalAttendees: 175,
    totalRSVPs: 88,
    capacityPercentage: 35,
    isAvailable: true,
  },
  {
    eventId: 1302,
    title: "Christmas Eve - Warren",
    startDate: new Date("2024-12-24T18:00:00"),
    endDate: new Date("2024-12-24T19:00:00"),
    campusId: 13,
    campusName: "Warren",
    maxCapacity: 500,
    totalAttendees: 350,
    totalRSVPs: 175,
    capacityPercentage: 70,
    isAvailable: true,
  },

  // White Lake
  {
    eventId: 1401,
    title: "Christmas Eve - White Lake",
    startDate: new Date("2024-12-24T16:00:00"),
    endDate: new Date("2024-12-24T17:00:00"),
    campusId: 14,
    campusName: "White Lake",
    maxCapacity: 350,
    totalAttendees: 105,
    totalRSVPs: 53,
    capacityPercentage: 30,
    isAvailable: true,
  },
  {
    eventId: 1402,
    title: "Christmas Eve - White Lake",
    startDate: new Date("2024-12-24T19:00:00"),
    endDate: new Date("2024-12-24T20:00:00"),
    campusId: 14,
    campusName: "White Lake",
    maxCapacity: 350,
    totalAttendees: 245,
    totalRSVPs: 123,
    capacityPercentage: 70,
    isAvailable: true,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all service times for a specific campus
 */
export function getServiceTimesByCampus(campusId: number): ServiceTime[] {
  return mockServiceTimes
    .filter((service) => service.campusId === campusId)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

/**
 * Get a campus by ID
 */
export function getCampusById(campusId: number): Campus | undefined {
  return mockCampuses.find((campus) => campus.id === campusId);
}

/**
 * Get a service time by event ID
 */
export function getServiceTimeById(eventId: number): ServiceTime | undefined {
  return mockServiceTimes.find((service) => service.eventId === eventId);
}

/**
 * Simulate RSVP submission - Returns API response format
 */
export function simulateRSVPSubmission(
  submission: RSVPSubmission
) {
  const serviceTime = getServiceTimeById(submission.eventId);
  if (!serviceTime) {
    throw new Error(`Service time not found for event ID: ${submission.eventId}`);
  }

  // Get campus-specific address (simplified for mock)
  const campusAddresses: Record<string, { address: string; city: string; zip: string }> = {
    "Troy": { address: "400 E. Long Lake Rd", city: "Troy", zip: "48085" },
    "Lake Orion": { address: "2900 Waldon Rd", city: "Lake Orion", zip: "48360" },
    "Royal Oak": { address: "520 S Washington Ave", city: "Royal Oak", zip: "48067" },
    "Warren": { address: "27600 Van Dyke Ave", city: "Warren", zip: "48093" },
    "Plymouth": { address: "47333 Five Mile Rd", city: "Plymouth", zip: "48170" },
  };

  const campusAddress = campusAddresses[serviceTime.campusName] || {
    address: "123 Church St",
    city: "Sample City",
    zip: "48000"
  };

  // Return in RSVPConfirmationResponse format (Pascal_Case)
  return {
    Event_RSVP_ID: Math.floor(Math.random() * 100000),
    Event_ID: submission.eventId,
    First_Name: submission.firstName,
    Last_Name: submission.lastName,
    Email_Address: submission.emailAddress,
    Party_Size: submission.partySize,
    Event_Title: serviceTime.title,
    Event_Start_Date: serviceTime.startDate.toISOString(),
    Event_End_Date: serviceTime.endDate.toISOString(),
    Campus_Name: serviceTime.campusName,
    Campus_Address_Line_1: campusAddress.address,
    Campus_Address_Line_2: null,
    Campus_City: campusAddress.city,
    Campus_State: "MI",
    Campus_Postal_Code: campusAddress.zip,
  };
}

/**
 * Format service time for display
 */
export function formatServiceTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format service date for display
 */
export function formatServiceDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get capacity status color (for progress bars)
 */
export function getCapacityColor(percentage: number): string {
  if (percentage < 50) return "bg-green-500";
  if (percentage < 75) return "bg-yellow-500";
  if (percentage < 90) return "bg-orange-500";
  return "bg-red-500";
}
