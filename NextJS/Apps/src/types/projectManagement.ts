// TypeScript types for Project Management app
// Manages core project configuration, campuses, and event linking

/**
 * Raw project record from the Projects table
 */
export interface ProjectRecord {
  Project_ID: number;
  Project_Title: string;
  Project_Coordinator: number; // User_ID
  Coordinator_Name?: string;
  Project_Start: string;
  Project_End: string;
  Project_Approved: boolean;
  Project_Type_ID: number;
  Project_Type_Name?: string;
  Slug: string;
  Campus_Count?: number;
  Event_Count?: number;

  // Budget fields
  Budgets_Enabled: boolean;
  Budget_Status_ID?: number | null;
  Budget_Status_Name?: string | null;
  Budget_Locked: boolean;
  Expected_Registration_Revenue?: number | null;
  Expected_Discounts_Budget?: number | null;

  // RSVP fields
  RSVP_Title?: string | null;
  RSVP_Description?: string | null;
  RSVP_URL?: string | null;
  RSVP_Start_Date?: string | null;
  RSVP_End_Date?: string | null;
  RSVP_Is_Active?: boolean | null;
  RSVP_Slug?: string | null;
  RSVP_Confirmation_Email_Template_ID?: number | null;
  RSVP_Reminder_Email_Template_ID?: number | null;
  RSVP_Days_To_Remind?: number | null;
  RSVP_Primary_Color?: string | null;
  RSVP_Secondary_Color?: string | null;
  RSVP_Accent_Color?: string | null;
  RSVP_Background_Color?: string | null;
}

/**
 * Project_Campuses junction record
 */
export interface ProjectCampus {
  Project_Campus_ID: number;
  Project_ID: number;
  Congregation_ID: number;
  Campus_Name?: string;
  Event_ID?: number;
  Event_Title?: string;
  Is_Active: boolean;
  Display_Order?: number;
}

/**
 * Event record linked to a project via Project_ID
 */
export interface ProjectEvent {
  Event_ID: number;
  Event_Title: string;
  Event_Start_Date: string;
  Event_End_Date?: string;
  Congregation_Name?: string;
  Project_ID?: number;
  Include_Registrations_In_Project_Budgets?: boolean;
  Include_In_RSVP?: boolean;
}

/**
 * Lookup data for form dropdowns
 */
export interface ProjectLookups {
  projectTypes: ProjectTypeLookup[];
  congregations: CongregationLookup[];
}

export interface ProjectTypeLookup {
  Project_Type_ID: number;
  Project_Type: string;
}

export interface CongregationLookup {
  Congregation_ID: number;
  Congregation_Name: string;
}

export interface CoordinatorLookup {
  User_ID: number;
  Display_Name: string;
  Email_Address: string;
}

/**
 * Payload for creating a new project
 */
export interface CreateProjectPayload {
  Project_Title: string;
  Project_Coordinator: number;
  Project_Start: string;
  Project_End: string;
  Project_Approved: boolean;
  Project_Type_ID: number;
  Slug: string;
}

/**
 * Payload for updating a project (all fields optional except ID)
 */
export interface UpdateProjectPayload {
  Project_ID: number;
  Project_Title?: string;
  Project_Coordinator?: number;
  Project_Start?: string;
  Project_End?: string;
  Project_Approved?: boolean;
  Project_Type_ID?: number;
  Slug?: string;

  // Budget fields
  Budgets_Enabled?: boolean;
  Budget_Status_ID?: number | null;
  Budget_Locked?: boolean;
  Expected_Registration_Revenue?: number | null;
  Expected_Discounts_Budget?: number | null;

  // RSVP fields
  RSVP_Title?: string | null;
  RSVP_Description?: string | null;
  RSVP_URL?: string | null;
  RSVP_Start_Date?: string | null;
  RSVP_End_Date?: string | null;
  RSVP_Is_Active?: boolean | null;
  RSVP_Slug?: string | null;
  RSVP_Confirmation_Email_Template_ID?: number | null;
  RSVP_Reminder_Email_Template_ID?: number | null;
  RSVP_Days_To_Remind?: number | null;
  RSVP_Primary_Color?: string | null;
  RSVP_Secondary_Color?: string | null;
  RSVP_Accent_Color?: string | null;
  RSVP_Background_Color?: string | null;
}
