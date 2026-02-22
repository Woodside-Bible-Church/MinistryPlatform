export interface ServeFinderData {
  Opportunities: Opportunity[];
  Settings: ServeFinderSettings;
}

export interface Opportunity {
  ID: number;
  Title: string;
  Description: string;
  Event_ID: number | null;
  Event_Title: string | null;
  Event_Image_URL: string | null;
  Congregation_Name: string;
  Ministry_Name: string;
  Day_Of_Week: string;
  Time: string;
  Sign_Up_URL: string;
  Image_URL: string | null;
  Volunteers_Needed: number | null;
}

export interface ServeFinderSettings {
  No_Opportunities_Found_Label: string;
  Sign_Up_Button_Label: string;
  Details_Button_Label: string;
  Sign_Up_Base_URL: string;
  Details_Base_URL: string;
}
