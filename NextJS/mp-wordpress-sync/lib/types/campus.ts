// MinistryPlatform Campus data structure
export interface MPCampus {
  Congregation_ID: number;
  Congregation_Name: string;
  Description?: string;
  Location_ID?: number;
  Location_Name?: string;
  Address_Line_1?: string;
  Address_Line_2?: string;
  City?: string;
  State?: string;
  Postal_Code?: string;
  Phone?: string;
  Contact_Person?: string;
  [key: string]: any; // For additional MP fields
}

// WordPress Campus data structure
export interface WPCampus {
  title: string;
  content: string;
  status: 'publish' | 'draft';
  type?: string;
  acf?: {
    mp_congregation_id?: number;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    pastor_name?: string;
    pastor_bio?: string;
    pastor_image_url?: string;
    service_times?: string;
    phone?: string;
    email?: string;
    [key: string]: any;
  };
  meta?: {
    mp_congregation_id?: number;
    [key: string]: any;
  };
}

// Webhook payload from MinistryPlatform
export interface MPWebhookPayload {
  eventType: 'insert' | 'update' | 'delete';
  tableName: string;
  recordId: number;
  data?: any;
  timestamp?: string;
}
