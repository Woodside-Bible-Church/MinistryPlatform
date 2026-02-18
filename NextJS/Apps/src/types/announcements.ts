/**
 * Announcements types for management interface
 */

export interface Announcement {
  ID: number;
  Title: string;
  Body: string | null;
  Active: boolean;
  TopPriority: boolean;
  StartDate: string;
  EndDate: string;
  Sort: number;
  CarouselSort: number | null;
  CarouselSortOverrides: string | null;

  // Congregation
  CongregationID: number;
  CongregationName: string;
  CampusSlug?: string;

  // Call to Action
  CallToActionURL: string | null;
  CallToActionLabel: string | null;

  // Event relationship (mutually exclusive with Opportunity)
  EventID: number | null;
  EventTitle?: string | null;
  EventStartDate?: string | null;
  EventEndDate?: string | null;

  // Opportunity relationship (mutually exclusive with Event)
  OpportunityID: number | null;
  OpportunityTitle?: string | null;
  OpportunityStart?: string | null;
  OpportunityEnd?: string | null;

  // Computed fields
  ImageURL: string | null;
  ComputedLink?: string | null;
  ComputedHeading?: string | null;

  // Status
  Status?: 'active' | 'inactive' | 'scheduled' | 'expired';

  // Audit
  DomainID?: number;
}

export interface AnnouncementFormData {
  title: string;
  body: string | null;
  active: boolean;
  topPriority: boolean;
  startDate: string;
  endDate: string;
  sort: number;
  carouselSort: number | null;
  carouselSortOverrides: string | null;
  congregationID: number;
  callToActionURL: string | null;
  callToActionLabel: string | null;
  eventID: number | null;
  opportunityID: number | null;
}

export interface AnnouncementRelationType {
  type: 'none' | 'event' | 'opportunity';
  id: number | null;
}

// For dropdown selects
export interface CongregationOption {
  value: number;
  label: string;
  slug?: string;
}

export interface EventOption {
  value: number;
  label: string;
  startDate?: string;
  endDate?: string;
}

export interface OpportunityOption {
  value: number;
  label: string;
  shiftStart?: string;
  shiftEnd?: string;
}
