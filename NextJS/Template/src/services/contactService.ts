import { contactSearch } from "@/providers/MinistryPlatform/Interfaces/contactInterfaces";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

/**
 * ContactService - Singleton service for managing contact-related operations
 * 
 * This service provides methods to interact with contact data from Ministry Platform,
 * including searching for contacts and retrieving individual contact information.
 * Uses the singleton pattern to ensure a single instance across the application.
 */
export class ContactService {
  private static instance: ContactService;
  private mp: MPHelper | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the service when instantiated
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Gets the singleton instance of ContactService
   * Creates a new instance if one doesn't exist and ensures it's properly initialized
   * 
   * @returns Promise<ContactService> - The initialized ContactService instance
   */
  public static async getInstance(): Promise<ContactService> {
    if (!ContactService.instance) {
      ContactService.instance = new ContactService();
      await ContactService.instance.initialize();
    }
    return ContactService.instance;
  }

  /**
   * Initializes the ContactService by creating a new MPHelper instance
   * This method sets up the Ministry Platform connection helper
   * 
   * @returns Promise<void>
   */
  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  /**
   * Searches for contacts based on a search term
   * Performs a fuzzy search across multiple contact fields including name, email, and phone
   * 
   * @param search - The search term to match against contact fields
   * @returns Promise<contactSearch[]> - Array of matching contacts (limited to 20 results)
   */
  public async contactSearch(search: string): Promise<contactSearch[]> {
    const records = await this.mp!.getTableRecords<contactSearch>({
      table: "Contacts",
      filter: `First_Name LIKE '%${search}%' OR Last_Name LIKE '%${search}%' OR Nickname LIKE '%${search}%' OR Email_Address LIKE '%${search}%' OR Mobile_Phone LIKE '%${search}%'`,
      select: "Contact_ID, Contact_GUID,First_Name,Nickname,Last_Name,Email_Address,Mobile_Phone,dp_fileUniqueId AS Image_GUID",
      top: 20
    });
    
    return records;
  }

  /**
   * Retrieves a specific contact by their GUID
   * 
   * @param contactGuid - The unique GUID identifier for the contact
   * @returns Promise<contactSearch | null> - The matching contact record or null if not found
   */
  public async getContactByGuid(contactGuid: string): Promise<contactSearch | null> {
    const records = await this.mp!.getTableRecords<contactSearch>({
      table: "Contacts",
      filter: `Contact_GUID = '${contactGuid}'`,
      select: "Contact_ID, Contact_GUID,First_Name,Nickname,Last_Name,Email_Address,Mobile_Phone,dp_fileUniqueId AS Image_GUID",
      top: 1
    });
    
    // Return the first (and should be only) matching record, or null if not found
    return records.length > 0 ? records[0] : null;
  }
}