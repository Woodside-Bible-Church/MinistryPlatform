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

// The stored proc omits keys for empty buckets rather than returning empty
// collections: no church-wide announcements => no ChurchWide key at all, and
// no campus selected => the whole object is `{}`. Both are optional here so
// consumers are forced to normalize.
export interface AnnouncementsData {
  ChurchWide?: Announcement[] | null;
  Campus?: CampusAnnouncements | null;
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
