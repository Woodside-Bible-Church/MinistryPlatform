export interface CallToAction {
  Link: string;
  Heading?: string;
  SubHeading?: string;
}

export interface Announcement {
  ID: number;
  Title: string;
  Body?: string;
  Image?: string;
  CallToAction: CallToAction;
}

export interface CampusAnnouncements {
  Name: string;
  Announcements: Announcement[];
}

export interface AnnouncementsData {
  ChurchWide: Announcement[];
  Campus: CampusAnnouncements | null;
}

export interface AnnouncementsResponse {
  Announcements: AnnouncementsData;
}
