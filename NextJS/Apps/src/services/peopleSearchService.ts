import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import { ProcedureService } from "@/providers/MinistryPlatform/services/procedureService";
import type { Contact } from "@/providers/MinistryPlatform/entities/Contacts";
import type { Household } from "@/providers/MinistryPlatform/entities/Households";

// Extended contact type for household members with Image_URL
export interface HouseholdMember extends Omit<Contact, 'Image_GUID'> {
  Prefix?: string;
  Middle_Name?: string;
  Suffix?: string;
  Selected?: boolean;
  Gender?: string;
  Contact_Status?: string;
  Household_Position?: string;
  Anniversary_Date?: string;
  Date_of_Death?: string;
  Maiden_Name?: string;
  Contact_Methods?: string;
  Do_Not_Text?: boolean;
  Occupation_Name?: string;
  Image_URL?: string;
}

// Household with nested address
export interface HouseholdWithAddress extends Omit<Household, 'Address_Line_1' | 'Address_Line_2' | 'City' | 'State' | 'Postal_Code' | 'Foreign_Country'> {
  Congregation_Name?: string;
  Address?: {
    Address_ID: number;
    Address_Line_1?: string;
    Address_Line_2?: string;
    City?: string;
    State?: string;
    Postal_Code?: string;
    Country?: string;
    Latitude?: number;
    Longitude?: number;
  };
}

// Response from the stored procedure
export interface HouseholdWithMembersResponse {
  Household: HouseholdWithAddress;
  Members: HouseholdMember[];
}

export class PeopleSearchService {
  private tableService: TableService;
  private procedureService: ProcedureService;
  private client: MinistryPlatformClient;

  constructor(token?: string) {
    this.client = new MinistryPlatformClient();
    this.tableService = new TableService(this.client);
    this.procedureService = new ProcedureService(this.client);
  }

  /**
   * Search for contacts by name, email, or phone
   * @param query Search query string
   * @returns Array of matching contacts
   */
  async searchContacts(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();

    // Build filter for name, email, or phone search
    const filter = `(Display_Name LIKE '%${searchTerm}%' OR Email_Address LIKE '%${searchTerm}%' OR Mobile_Phone LIKE '%${searchTerm}%' OR Company_Phone LIKE '%${searchTerm}%')`;

    return this.tableService.getTableRecords<Contact>("Contacts", {
      $filter: filter,
      $select: "Contact_ID,First_Name,Last_Name,Nickname,Display_Name,Email_Address,Mobile_Phone,Company_Phone,Date_of_Birth,Gender_ID,Marital_Status_ID,Household_ID,Household_Position_ID,Participant_Record,Company,__Age,dp_fileUniqueId AS Image_GUID",
      $orderby: "Last_Name,First_Name",
      $top: 50, // Limit results to prevent overwhelming the UI
    });
  }

  /**
   * Get a single contact by ID
   * @param contactId Contact ID
   * @returns Contact details
   */
  async getContactById(contactId: number) {
    const results = await this.tableService.getTableRecords<Contact>("Contacts", {
      $filter: `Contact_ID = ${contactId}`,
      $select: "Contact_ID,First_Name,Last_Name,Nickname,Display_Name,Email_Address,Mobile_Phone,Company_Phone,Date_of_Birth,Gender_ID,Marital_Status_ID,Household_ID,Household_Position_ID,Participant_Record,Company,__Age,dp_fileUniqueId AS Image_GUID",
    });

    return results[0] || null;
  }

  /**
   * Get household information by household ID
   * @param householdId Household ID
   * @returns Household details
   */
  async getHouseholdById(householdId: number) {
    const results = await this.tableService.getTableRecords<Household>("Households", {
      $filter: `Household_ID = ${householdId}`,
      $select: "Household_ID,Household_Name,Address_Line_1,Address_Line_2,City,State,Postal_Code,Foreign_Country,Home_Phone",
    });

    return results[0] || null;
  }

  /**
   * Get all household members for a household
   * @param householdId Household ID
   * @returns Array of contacts in the household
   */
  async getHouseholdMembers(householdId: number) {
    return this.tableService.getTableRecords<Contact>("Contacts", {
      $filter: `Household_ID = ${householdId}`,
      $select: "Contact_ID,First_Name,Last_Name,Nickname,Display_Name,Email_Address,Mobile_Phone,Company_Phone,Date_of_Birth,Gender_ID,Marital_Status_ID,Household_ID,Household_Position_ID,Participant_Record,Company,__Age,dp_fileUniqueId AS Image_GUID",
      $orderby: "Household_Position_ID,Date_of_Birth",
    });
  }

  /**
   * Get household with all members using stored procedure
   * @param householdId Household ID
   * @param contactId Optional contact ID to mark as selected
   * @returns Household with nested address and members with images
   */
  async getHouseholdWithMembers(householdId: number, contactId?: number): Promise<HouseholdWithMembersResponse | null> {
    const params: Record<string, unknown> = { '@HouseholdID': householdId };
    if (contactId) {
      params['@ContactID'] = contactId;
    }

    const result = await this.procedureService.executeProcedure(
      'api_Custom_GetHouseholdWithMembers',
      params
    );

    console.log('Raw stored procedure result:', JSON.stringify(result, null, 2));

    // Ministry Platform returns an array of result sets
    if (result && result.length > 0 && result[0].length > 0) {
      const row = result[0][0] as Record<string, unknown>;
      console.log('First row from result:', JSON.stringify(row, null, 2));

      // SQL Server FOR JSON returns a column with a GUID name containing the JSON string
      // Find the column (it starts with "JSON_")
      const jsonKey = Object.keys(row).find(key => key.startsWith('JSON_'));
      console.log('Found JSON key:', jsonKey);

      if (jsonKey && typeof row[jsonKey] === 'string') {
        const jsonString = row[jsonKey] as string;
        console.log('JSON string length:', jsonString.length);
        console.log('JSON string preview (first 500 chars):', jsonString.substring(0, 500));
        console.log('JSON string preview (last 200 chars):', jsonString.substring(Math.max(0, jsonString.length - 200)));

        const parsed = JSON.parse(jsonString) as HouseholdWithMembersResponse;
        console.log('Parsed result:', JSON.stringify(parsed, null, 2));

        // With JSON_QUERY in the stored proc, nested objects should already be parsed
        // But handle legacy case where Address might still be a string
        if (parsed.Household?.Address && typeof parsed.Household.Address === 'string') {
          try {
            parsed.Household.Address = JSON.parse(parsed.Household.Address as unknown as string);
          } catch (e) {
            console.error('Failed to parse Address JSON:', e);
          }
        }

        return parsed;
      }

      // Fallback: if it's already parsed, return as-is
      return row as unknown as HouseholdWithMembersResponse;
    }

    return null;
  }
}
