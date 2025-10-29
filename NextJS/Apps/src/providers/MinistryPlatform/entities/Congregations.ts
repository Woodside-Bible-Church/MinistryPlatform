/**
 * Interface for Congregations
 * Table: Congregations
 * Access Level: ReadWriteAssignDelete
 * Special Permissions: FileAttach, DataExport, SecureRecord
 * Generated from column metadata
 */
export interface CongregationsRecord {

  Congregation_ID: number /* 32-bit integer */; // Primary Key

  /**
   * Max length: 50 characters
   */
  Congregation_Name: string /* max 50 chars */;

  /**
   * Max length: 50 characters
   * Custom field for short campus name
   */
  Congregation_Short_Name?: string /* max 50 chars */ | null;

  Start_Date: string /* ISO datetime */;

  /**
   * Max length: 255 characters
   */
  Description?: string /* max 255 chars */ | null;

  Location_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Locations.Location_ID

  Time_Zone: unknown;

  Contact_ID: number /* 32-bit integer */; // Foreign Key -> Contacts.Contact_ID

  Pastor: number /* 32-bit integer */; // Foreign Key -> dp_Users.User_ID

  End_Date?: string /* ISO datetime */ | null;

  /**
   * Max length: 254 characters
   */
  Home_Page?: string /* max 254 chars */ | null;

  Available_Online: boolean; // Has Default

  /**
   * Max length: 50 characters
   */
  Web_Template_Name?: string /* max 50 chars */ | null;

  Accounting_Company_ID: number /* 32-bit integer */; // Foreign Key -> Accounting_Companies.Accounting_Company_ID, Has Default

  Default_Giving_Program?: number /* 32-bit integer */ | null; // Foreign Key -> Programs.Program_ID

  Online_Sort_Order?: number /* 32-bit integer */ | null;

  Front_Desk_SMS_Phone?: string /* phone number */ | null;

  Childcare_Size: number /* 32-bit integer */; // Has Default

  Monday_Childcare_Size: number /* 32-bit integer */; // Has Default

  Tuesday_Childcare_Size: number /* 32-bit integer */; // Has Default

  Wednesday_Childcare_Size: number /* 32-bit integer */; // Has Default

  Thursday_Childcare_Size: number /* 32-bit integer */; // Has Default

  Friday_Childcare_Size: number /* 32-bit integer */; // Has Default

  Plan_A_Visit_Template?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Communication_Templates.Communication_Template_ID

  Plan_A_Visit_Contact?: number /* 32-bit integer */ | null; // Foreign Key -> Contacts.Contact_ID

  Plan_A_Visit_User?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Discipleship_Admin?: number /* 32-bit integer */ | null; // Foreign Key -> dp_Users.User_ID

  Coming_Soon: boolean; // Has Default

  /**
   * Max length: 500 characters
   */
  Giving_URL?: string /* max 500 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Logo_URL?: string /* max 500 chars */ | null;

  /**
   * Max length: 500 characters
   */
  Giving_Image_URL?: string /* max 500 chars */ | null;

  JWT_Signing_Key?: Blob | string /* binary data */ | null;

  /**
   * Max length: 25 characters
   */
  Certifications_Provider?: string /* max 25 chars */ | null;

  Certifications_API_Key?: Blob | string /* binary data */ | null;

  /**
   * Max length: 100 characters
   */
  Certifications_API_Address?: string /* max 100 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Certification_Callback_Username?: string /* max 50 chars */ | null;

  Certification_Callback_Password?: Blob | string /* binary data */ | null;

  /**
   * Max length: 25 characters
   */
  Background_Check_Provider?: string /* max 25 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Background_Check_Username?: string /* max 50 chars */ | null;

  Background_Check_Password?: Blob | string /* binary data */ | null;

  /**
   * Max length: 50 characters
   */
  Background_Check_Callback_Username?: string /* max 50 chars */ | null;

  Background_Check_Callback_Password?: Blob | string /* binary data */ | null;

  Event_Registration_Handoff_URL?: string /* URL */ | null;

  /**
   * Max length: 50 characters
   */
  Vanco_Tenant?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Vanco_Giving_PCCT?: string /* max 50 chars */ | null;

  /**
   * Max length: 50 characters
   */
  Vanco_Signing_Key?: string /* max 50 chars */ | null;

  /**
   * Max length: 16 characters
   */
  Organization_Code?: string /* max 16 chars */ | null;

  Sacrament_Place_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Sacrament_Places.Sacrament_Place_ID

  /**
   * Max length: 500 characters
   */
  Dark_Mode_Logo_URL?: string /* max 500 chars */ | null;

  /**
   * Max length: 8 characters
   */
  Site_Number?: string /* max 8 chars */ | null;

  App_ID?: number /* 32-bit integer */ | null; // Foreign Key -> Pocket_Platform_Apps.App_ID
}

export type Congregations = CongregationsRecord;
