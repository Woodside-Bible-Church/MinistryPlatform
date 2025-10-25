/**
 * Type definitions for the unified prayer widget data structure
 * Matches the JSON structure returned by api_Custom_Prayer_Widget_Data_JSON
 */

// Nested objects within prayer items
export interface Requester {
  Display_Name: string;
  First_Name: string | null;
  Last_Name: string | null;
  Image: string | null;
}

export interface PrayerType {
  Label: string; // "Prayer Request" or "Praise Report"
  ID: number;    // Feedback_Type_ID
}

export interface Visibility {
  Level_ID: number;
  Label: string; // "Public", "Members Only", "Staff Only", "Private"
}

export interface PrayerStatus {
  Approved: boolean;
  Approval_Badge: string | null; // "Pending Review" if not approved
  Ongoing_Need: boolean;
  Is_Answered: boolean;
}

export interface PrayerDates {
  Submitted: string;
  Target: string | null;
  My_Prayer?: string; // Only in Prayer Partners
}

export interface PrayerCounts {
  Prayers: number;
  Celebrations: number;
}

export interface LatestUpdate {
  Text: string | null;
  Date: string | null;
}

export interface PrayerUpdate {
  Feedback_Entry_Update_ID: number;
  Update_Text: string;
  Update_Date: string;
  Is_Answered: boolean;
}

export interface MyRequestActions {
  Can_Edit: boolean;
  Can_Add_Update: boolean;
  Can_Mark_Answered: boolean;
}

export interface PrayerPartnerActions {
  Can_Pray_Again: boolean;
}

export interface MyResponse {
  Message: string | null;
}

// Prayer item structures for each section
export interface MyRequestItem {
  Feedback_Entry_ID: number;
  Title: string;
  Description: string;
  Type: PrayerType;
  Visibility: Visibility;
  Status: PrayerStatus;
  Dates: PrayerDates;
  Counts: PrayerCounts;
  Latest_Update: LatestUpdate;
  Updates: PrayerUpdate[];
  Actions: MyRequestActions;
}

export interface PrayerPartnerItem {
  Feedback_Entry_ID: number;
  Title: string;
  Description: string;
  Requester: Requester;
  Type: PrayerType;
  Visibility: Visibility;
  Dates: PrayerDates;
  My_Response: MyResponse;
  Counts: PrayerCounts;
  Latest_Update: LatestUpdate;
  Actions: PrayerPartnerActions;
}

export interface CommunityNeedItem {
  Feedback_Entry_ID: number;
  Title: string;
  Description: string;
  Requester: Requester;
  Type: PrayerType;
  Visibility: Visibility;
  Dates: PrayerDates;
  Status: {
    Ongoing_Need: boolean;
  };
  Counts: PrayerCounts;
  Latest_Update: LatestUpdate;
}

// Section structures
export interface UserStats {
  Total_Prayers: {
    Label: string;
    Count: number;
  };
  Prayer_Streak: {
    Label: string;
    Count: number;
  };
  Prayers_Today: {
    Label: string;
    Count: number;
  };
}

export interface MyRequestsSection {
  Title: string;
  Description: string;
  Total_Count: number;
  Items: MyRequestItem[];
}

export interface PrayerPartnersSection {
  Title: string;
  Description: string;
  Total_Count: number;
  Items: PrayerPartnerItem[];
}

export interface CommunityNeedsSection {
  Title: string;
  Description: string;
  Total_Count: number;
  Items: CommunityNeedItem[];
}

export interface WidgetConfiguration {
  Default_Card_Layout: 'stack' | 'list';
  Allow_Anonymous: boolean;
  Show_Contact_Names: boolean;
  Require_Approval: boolean;
}

export interface UserInfo {
  Contact_ID: number;
  First_Name: string;
  Last_Name: string;
  Display_Name: string;
  Image_URL: string | null;
}

// Main unified widget data structure
export interface UnifiedWidgetData {
  Widget_Title: string;
  Widget_Subtitle: string;
  Configuration: WidgetConfiguration;
  User_Info: UserInfo | null; // null if not logged in
  User_Stats: UserStats | null; // null if not logged in
  My_Requests: MyRequestsSection;
  Prayer_Partners: PrayerPartnersSection;
  Community_Needs: CommunityNeedsSection;
}
