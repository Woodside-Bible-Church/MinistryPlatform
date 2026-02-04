export interface GroupFinderData {
  Groups: Group[];
  Filters: Filter[];
  Settings: GroupFinderSettings;
  userAuthenticated: boolean;
}

export interface Group {
  ID: number;
  Title: string;
  User_Is_Leader: boolean;
  User_In_Group: boolean;
  Paused: boolean;
  Full: boolean;
  Description: string;
  Leaders: string[];
  Meeting_Details: MeetingDetails;
  Tags: Tag[];
}

export interface MeetingDetails {
  Occurrence: string;
  Time: string;
  City: string;
}

export interface Tag {
  Filter: string;
  ID: number | string;
  Text: string;
  Icon: string;
}

export interface Filter {
  Filter: string;
  Label: string;
  Type: "Text" | "Dropdown" | "MultiSelect" | "Checkbox";
  Selected: string | number | boolean;
  Placeholder: string;
  Icon: string;
  Use_Prefix: boolean;
  Options: FilterOption[];
}

export interface FilterOption {
  ID: number | string;
  Text: string;
  Selected: boolean;
  Icon: string;
}

export interface GroupFinderSettings {
  Time_And_Location_Details_Heading: string;
  Leaders_List_Heading: string;
  Description_Heading: string;
  No_Groups_Found_Label: string;
  joinAGroupFormRedirectButton: string;
  GroupInquiryFormBaseURL: string;
  ViewGroupBaseURL: string;
  GroupDetailsBaseURL: string;
  View_Group_Button_Label: string;
  Register_Button_Label: string;
}

export interface FilterParams {
  [key: string]: string;
}
