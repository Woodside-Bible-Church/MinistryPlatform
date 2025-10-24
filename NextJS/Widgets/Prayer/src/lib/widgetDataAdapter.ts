/**
 * Adapter functions to transform unified widget data into the format
 * expected by the legacy prayer components
 */

import type {
  MyRequestItem,
  PrayerPartnerItem,
  CommunityNeedItem,
  UserInfo,
} from '@/types/widgetData';

/**
 * Transform MyRequestItem from unified data to legacy format
 */
export function adaptMyRequestItem(item: MyRequestItem, userInfo: UserInfo | null) {
  return {
    Feedback_Entry_ID: item.Feedback_Entry_ID,
    Entry_Title: item.Title,
    Description: item.Description,
    Date_Submitted: item.Dates.Submitted,
    Ongoing_Need: item.Status.Ongoing_Need,
    Approved: item.Status.Approved,
    Target_Date: item.Dates.Target || undefined,
    Prayer_Count: item.Counts.Prayers,
    Feedback_Type_ID: item.Type.ID,
    Feedback_Type_ID_Table: {
      Feedback_Type: item.Type.Label,
    },
    Anonymous: false, // Not provided in unified data
    Anonymous_Share: false, // Not provided in unified data
    Visibility_Level_ID: item.Visibility.Level_ID,
    Contact_ID_Table: {
      Display_Name: userInfo?.Display_Name || undefined,
      First_Name: userInfo?.First_Name || undefined,
      Last_Name: userInfo?.Last_Name || undefined,
      Contact_Photo: userInfo?.Image_URL || null,
    },
    userImageUrl: userInfo?.Image_URL || undefined,
  };
}

/**
 * Transform PrayerPartnerItem from unified data to legacy format
 */
export function adaptPrayerPartnerItem(item: PrayerPartnerItem) {
  return {
    Feedback_Entry_User_Response_ID: item.Feedback_Entry_ID, // Using Entry ID as unique key
    Feedback_Entry_ID: item.Feedback_Entry_ID,
    Response_Date: item.Dates.My_Prayer || item.Dates.Submitted,
    Response_Text: item.My_Response.Message || null,
    Entry_Title: item.Title,
    Description: item.Description,
    Date_Submitted: item.Dates.Submitted,
    Prayer_Count: item.Counts.Prayers,
    Feedback_Type_ID: item.Type.ID,
    Visibility_Level_ID: item.Visibility.Level_ID,
    Target_Date: item.Dates.Target || undefined,
    Ongoing_Need: false, // Not provided for prayer partners
    Contact_ID: 0, // Not provided
    Anonymous_Share: false, // Assuming not anonymous if we have requester info
    contactImageUrl: item.Requester.Image || null,
    contactFirstName: item.Requester.First_Name || '',
    contactLastName: item.Requester.Last_Name || '',
    contactDisplayName: item.Requester.Display_Name || '',
  };
}

/**
 * Transform CommunityNeedItem from unified data to legacy format
 */
export function adaptCommunityNeedItem(item: CommunityNeedItem) {
  return {
    Feedback_Entry_ID: item.Feedback_Entry_ID,
    Feedback_Type_ID: item.Type.ID,
    Contact_ID: 0, // Not provided
    Entry_Title: item.Title,
    Description: item.Description,
    Date_Submitted: item.Dates.Submitted,
    Ongoing_Need: item.Status.Ongoing_Need,
    Prayer_Count: item.Counts.Prayers,
    Anonymous_Share: !item.Requester.Display_Name, // If no name, assume anonymous
    Contact_ID_Table: {
      Display_Name: item.Requester.Display_Name,
      First_Name: item.Requester.First_Name || '',
      Last_Name: item.Requester.Last_Name || '',
      Contact_Photo: item.Requester.Image || null,
    },
    Feedback_Type_ID_Table: {
      Feedback_Type: item.Type.Label,
    },
  };
}
