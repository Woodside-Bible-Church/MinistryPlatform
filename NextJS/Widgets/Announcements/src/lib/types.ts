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
  CarouselSort?: number;
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

export interface AnnouncementsLabels {
  viewAllButton?: string;
  churchWideTitle?: string;
  carouselHeading1?: string;
  carouselHeading2?: string;
  campusAnnouncementsSuffix?: string;
}

export interface AnnouncementsResponse {
  Announcements: AnnouncementsData;
  Information?: AnnouncementsLabels;
}
