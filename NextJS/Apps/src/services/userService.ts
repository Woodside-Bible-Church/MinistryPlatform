import { mpUserProfile } from "@/providers/MinistryPlatform/Interfaces/mpUserProfile";
import { MPHelper } from "@/providers/MinistryPlatform/mpHelper";

/**
 * UserService - Singleton service for managing user-related operations
 * 
 * This service provides methods to interact with user data from Ministry Platform,
 * including retrieving user profiles and related contact information.
 */
export class UserService {
  private static instance: UserService;
  private mp: MPHelper | null = null;

  /**
   * Private constructor to enforce singleton pattern
   * Initializes the service when instantiated
   */
  private constructor() {
    this.initialize();
  }

  /**
   * Gets the singleton instance of UserService
   * Creates a new instance if one doesn't exist and ensures it's properly initialized
   * 
   * @returns Promise<UserService> - The initialized UserService instance
   */
  public static async getInstance(): Promise<UserService> {
    if (!UserService.instance) {
      UserService.instance = new UserService();
      await UserService.instance.initialize();
    }
    return UserService.instance;
  }

  /**
   * Initializes the UserService by creating a new MPHelper instance
   * This method sets up the Ministry Platform connection helper
   * 
   * @returns Promise<void>
   */
  private async initialize(): Promise<void> {
    this.mp = new MPHelper();
  }

  /**
   * Retrieves a user profile by User identifier from Ministry Platform
   *
   * Fetches user information including:
   * - User GUID
   * - Contact ID
   * - Contact details (First Name, Nickname, Last Name)
   * - Email Address
   * - Mobile Phone
   * - Profile Image GUID
   * - Web Congregation ID (selected campus)
   *
   * @param userId - The User identifier (sub from OAuth, could be User_Name or User_GUID)
   * @returns Promise<mpUserProfile> - The user profile data from Ministry Platform
   * @throws Will throw an error if the Ministry Platform query fails
   */
  public async getUserProfile(userId: string): Promise<mpUserProfile> {
    // Query dp_Users table first to get Contact_ID ONLY (no ThinkSQL notation)
    // ThinkSQL notation causes 500 errors, so we avoid it entirely
    const userRecords = await this.mp!.getTableRecords<any>({
      table: "dp_Users",
      filter: `User_GUID = '${userId}'`,
      select: "User_GUID, Contact_ID",
      top: 1
    });

    if (!userRecords || userRecords.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    const userRecord = userRecords[0];

    // Query Contacts table directly to get ALL contact-related fields
    // This avoids ThinkSQL issues and is more reliable
    const contactRecords = await this.mp!.getTableRecords<any>({
      table: "Contacts",
      filter: `Contact_ID = ${userRecord.Contact_ID}`,
      select: "Contact_ID, First_Name, Nickname, Last_Name, Email_Address, Mobile_Phone, dp_fileUniqueId, Web_Congregation_ID",
      top: 1
    });

    if (!contactRecords || contactRecords.length === 0) {
      throw new Error(`Contact not found for user: ${userId}`);
    }

    const contact = contactRecords[0];

    // Merge the results
    // Note: dp_fileUniqueId might come back as Column_6 or dp_fileUniqueId depending on MP API
    const profile: mpUserProfile = {
      User_GUID: userRecord.User_GUID,
      Contact_ID: contact.Contact_ID,
      First_Name: contact.First_Name,
      Nickname: contact.Nickname,
      Last_Name: contact.Last_Name,
      Email_Address: contact.Email_Address,
      Mobile_Phone: contact.Mobile_Phone,
      Image_GUID: contact.dp_fileUniqueId || contact.Column_6 || null,
      Web_Congregation_ID: contact.Web_Congregation_ID
    };

    return profile;
  }

  /**
   * Retrieves a user profile directly by Contact_ID
   * This is useful for impersonation where we only have the Contact_ID
   *
   * @param contactId - The Contact ID to fetch
   * @returns Promise<mpUserProfile> - The user profile data from Ministry Platform
   * @throws Will throw an error if the Ministry Platform query fails
   */
  public async getUserProfileByContactId(contactId: number): Promise<mpUserProfile> {
    // Query Contacts table directly to get ALL contact-related fields
    const contactRecords = await this.mp!.getTableRecords<any>({
      table: "Contacts",
      filter: `Contact_ID = ${contactId}`,
      select: "Contact_ID, First_Name, Nickname, Last_Name, Email_Address, Mobile_Phone, dp_fileUniqueId, Web_Congregation_ID",
      top: 1
    });

    if (!contactRecords || contactRecords.length === 0) {
      throw new Error(`Contact not found: ${contactId}`);
    }

    const contact = contactRecords[0];

    // Try to get User_GUID if they have a user account
    let userGuid = null;
    const userRecords = await this.mp!.getTableRecords<any>({
      table: "dp_Users",
      filter: `Contact_ID = ${contactId}`,
      select: "User_GUID",
      top: 1
    });

    if (userRecords && userRecords.length > 0) {
      userGuid = userRecords[0].User_GUID;
    }

    const profile: mpUserProfile = {
      User_GUID: userGuid,
      Contact_ID: contact.Contact_ID,
      First_Name: contact.First_Name,
      Nickname: contact.Nickname,
      Last_Name: contact.Last_Name,
      Email_Address: contact.Email_Address,
      Mobile_Phone: contact.Mobile_Phone,
      Image_GUID: contact.dp_fileUniqueId || contact.Column_6 || null,
      Web_Congregation_ID: contact.Web_Congregation_ID
    };

    return profile;
  }

  /**
   * Updates the user's selected congregation in Ministry Platform
   *
   * @param contactId - The Contact ID to update
   * @param congregationId - The Congregation ID to set as the user's selected campus
   * @returns Promise<void>
   * @throws Will throw an error if the Ministry Platform update fails
   */
  public async updateWebCongregation(contactId: number, congregationId: number): Promise<void> {
    await this.mp!.updateTableRecords("Contacts", [{
      Contact_ID: contactId,
      Web_Congregation_ID: congregationId
    }]);
  }
}