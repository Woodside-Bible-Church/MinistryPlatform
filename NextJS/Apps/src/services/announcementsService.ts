import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import type { Announcement, AnnouncementFormData } from "@/types/announcements";

export interface AnnouncementRecord {
  Announcement_ID?: number;
  Announcement_Title: string;
  Announcement_Body: string | null;
  Active: boolean;
  Top_Priority: boolean;
  Announcement_Start_Date: string;
  Announcement_End_Date: string;
  Sort: number;
  Congregation_ID: number;
  Call_To_Action_URL: string | null;
  Call_To_Action_Label: string | null;
  Event_ID: number | null;
  Opportunity_ID: number | null;
  Domain_ID: number;
  [key: string]: unknown; // Index signature for TableRecord compatibility
}

export class AnnouncementsService {
  private client: MinistryPlatformClient;
  private tableService: TableService;

  constructor(accessToken?: string) {
    this.client = new MinistryPlatformClient(accessToken);
    this.tableService = new TableService(this.client);
  }

  /**
   * Get announcements using the custom stored procedure
   * Provides rich data with related entities and computed fields
   */
  async getAnnouncements(params?: {
    announcementID?: number;
    active?: boolean;
    congregationID?: number;
    search?: string;
  }): Promise<Announcement[]> {
    await this.client.ensureValidToken();

    const spParams = new URLSearchParams();
    if (params?.announcementID !== undefined) {
      spParams.append("Announcement_ID", params.announcementID.toString());
    }
    if (params?.active !== undefined) {
      spParams.append("Active", params.active ? "1" : "0");
    }
    if (params?.congregationID !== undefined) {
      spParams.append("Congregation_ID", params.congregationID.toString());
    }
    if (params?.search) {
      spParams.append("Search", params.search);
    }

    const endpoint = `/procs/api_custom_Announcements_Management_JSON?${spParams.toString()}`;

    try {
      const response = await this.client.get<any>(endpoint);
      console.log("Raw stored procedure response:", JSON.stringify(response, null, 2));

      // Parse the JSON result from the stored procedure
      let announcements: Announcement[];

      if (response && typeof response === 'object') {
        // MinistryPlatform stored procedures can return nested structures
        // Check for: [[{JsonResult: "..."}]] or [{JsonResult: "..."}]
        if (Array.isArray(response) && response.length > 0) {
          // Check if double-nested array: [[...]]
          if (Array.isArray(response[0]) && response[0].length > 0 && response[0][0].JsonResult) {
            // Response is [[{JsonResult: "..."}]]
            const parsed = JSON.parse(response[0][0].JsonResult);
            announcements = Array.isArray(parsed) ? parsed : [parsed];
          }
          // Check if single-nested with JsonResult: [{JsonResult: "..."}]
          else if (response[0].JsonResult) {
            // Response is [{JsonResult: "..."}]
            const parsed = JSON.parse(response[0].JsonResult);
            announcements = Array.isArray(parsed) ? parsed : [parsed];
          }
          // Already an array of announcements
          else {
            announcements = response;
          }
        } else if (response.JsonResult) {
          // Single object with JsonResult wrapper
          const parsed = JSON.parse(response.JsonResult);
          announcements = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          // Single announcement object
          announcements = [response];
        }
      } else {
        announcements = [];
      }

      return announcements;
    } catch (error) {
      console.error("Error fetching announcements from stored procedure:", error);
      throw error;
    }
  }

  /**
   * Get a single announcement by ID
   * Uses direct table access since the stored procedure doesn't support ID filtering
   */
  async getAnnouncementById(id: number): Promise<Announcement | null> {
    await this.client.ensureValidToken();

    // Use table service to get the base announcement data
    const records = await this.tableService.getTableRecords<{
      Announcement_ID: number;
      Announcement_Title: string;
      Announcement_Body: string | null;
      Active: boolean;
      Top_Priority: boolean;
      Announcement_Start_Date: string;
      Announcement_End_Date: string;
      Sort: number;
      Congregation_ID: number;
      Call_To_Action_URL: string | null;
      Call_To_Action_Label: string | null;
      Event_ID: number | null;
      Opportunity_ID: number | null;
    }>("Announcements", {
      $select: "Announcement_ID,Announcement_Title,Announcement_Body,Active,Top_Priority,Announcement_Start_Date,Announcement_End_Date,Sort,Congregation_ID,Call_To_Action_URL,Call_To_Action_Label,Event_ID,Opportunity_ID",
      $filter: `Announcement_ID=${id}`,
      $top: 1,
    });

    if (records.length === 0) {
      return null;
    }

    const record = records[0];

    // Get congregation name
    const congregations = await this.tableService.getTableRecords<{
      Congregation_Name: string;
    }>("Congregations", {
      $select: "Congregation_Name",
      $filter: `Congregation_ID=${record.Congregation_ID}`,
      $top: 1,
    });

    // Convert to Announcement type
    const announcement: Announcement = {
      ID: record.Announcement_ID,
      Title: record.Announcement_Title,
      Body: record.Announcement_Body,
      Active: record.Active,
      TopPriority: record.Top_Priority,
      StartDate: record.Announcement_Start_Date,
      EndDate: record.Announcement_End_Date,
      Sort: record.Sort,
      CongregationID: record.Congregation_ID,
      CongregationName: congregations[0]?.Congregation_Name || "",
      CallToActionURL: record.Call_To_Action_URL,
      CallToActionLabel: record.Call_To_Action_Label,
      EventID: record.Event_ID,
      OpportunityID: record.Opportunity_ID,
      ImageURL: null,
      ComputedLink: record.Call_To_Action_URL || "#",
      ComputedHeading: record.Call_To_Action_Label || record.Announcement_Title,
      Status: record.Active ? "active" : "inactive",
    };

    return announcement;
  }

  /**
   * Create a new announcement
   */
  async createAnnouncement(data: AnnouncementFormData, userId: number): Promise<AnnouncementRecord> {
    const record: AnnouncementRecord = {
      Announcement_Title: data.title,
      Announcement_Body: data.body,
      Active: data.active,
      Top_Priority: data.topPriority,
      Announcement_Start_Date: data.startDate,
      Announcement_End_Date: data.endDate,
      Sort: data.sort,
      Congregation_ID: data.congregationID,
      Call_To_Action_URL: data.callToActionURL,
      Call_To_Action_Label: data.callToActionLabel,
      Event_ID: data.eventID,
      Opportunity_ID: data.opportunityID,
      Domain_ID: 1, // Default domain
    };

    const result = await this.tableService.createTableRecords("Announcements", [record], {
      $userId: userId,
    });
    return result[0];
  }

  /**
   * Update an existing announcement
   */
  async updateAnnouncement(id: number, data: AnnouncementFormData, userId: number): Promise<void> {
    const record: AnnouncementRecord = {
      Announcement_ID: id,
      Announcement_Title: data.title,
      Announcement_Body: data.body,
      Active: data.active,
      Top_Priority: data.topPriority,
      Announcement_Start_Date: data.startDate,
      Announcement_End_Date: data.endDate,
      Sort: data.sort,
      Congregation_ID: data.congregationID,
      Call_To_Action_URL: data.callToActionURL,
      Call_To_Action_Label: data.callToActionLabel,
      Event_ID: data.eventID,
      Opportunity_ID: data.opportunityID,
      Domain_ID: 1,
    };

    await this.tableService.updateTableRecords("Announcements", [record], {
      $userId: userId,
    });
  }

  /**
   * Delete an announcement
   * First deletes related records from Announcement_Congregations (legacy table)
   */
  async deleteAnnouncement(id: number, userId: number): Promise<void> {
    // First, get all Announcement_Congregations records for this announcement
    const announcementCongregations = await this.tableService.getTableRecords<{
      Announcement_Congregation_ID: number;
    }>("Announcement_Congregations", {
      $select: "Announcement_Congregation_ID",
      $filter: `Announcement_ID=${id}`,
    });

    // Delete all related Announcement_Congregations records
    if (announcementCongregations.length > 0) {
      const idsToDelete = announcementCongregations.map(
        (ac) => ac.Announcement_Congregation_ID
      );
      await this.tableService.deleteTableRecords(
        "Announcement_Congregations",
        idsToDelete,
        {
          $userId: userId,
        }
      );
    }

    // Now delete the announcement
    await this.tableService.deleteTableRecords("Announcements", [id], {
      $userId: userId,
    });
  }

  /**
   * Bulk update sort order for announcements
   */
  async bulkUpdateSortOrder(
    updates: Array<{ id: number; sort: number }>,
    userId: number
  ): Promise<void> {
    // Get all announcements that need updating
    const records: AnnouncementRecord[] = [];

    for (const update of updates) {
      // Fetch the current announcement data
      const existing = await this.getAnnouncementById(update.id);
      if (!existing) {
        throw new Error(`Announcement ${update.id} not found`);
      }

      records.push({
        Announcement_ID: update.id,
        Announcement_Title: existing.Title,
        Announcement_Body: existing.Body,
        Active: existing.Active,
        Top_Priority: existing.TopPriority,
        Announcement_Start_Date: existing.StartDate,
        Announcement_End_Date: existing.EndDate,
        Sort: update.sort,
        Congregation_ID: existing.CongregationID,
        Call_To_Action_URL: existing.CallToActionURL,
        Call_To_Action_Label: existing.CallToActionLabel,
        Event_ID: existing.EventID,
        Opportunity_ID: existing.OpportunityID,
        Domain_ID: 1,
      });
    }

    // Update all records in bulk
    await this.tableService.updateTableRecords("Announcements", records, {
      $userId: userId,
    });
  }

  /**
   * Get congregations for dropdown
   */
  async getCongregations(): Promise<Array<{ value: number; label: string; slug: string }>> {
    const congregations = await this.tableService.getTableRecords<{
      Congregation_ID: number;
      Congregation_Name: string;
      Campus_Slug: string;
    }>("Congregations", {
      $select: "Congregation_ID,Congregation_Name,Campus_Slug",
      $filter: "End_Date IS NULL", // Only active congregations
      $orderby: "Congregation_Name ASC",
    });

    return congregations.map((c) => ({
      value: c.Congregation_ID,
      label: c.Congregation_Name,
      slug: c.Campus_Slug,
    }));
  }

  /**
   * Search events for dropdown with basic information
   * Uses Events table directly for search
   * Filters by congregation (campus) - includes selected campus and church-wide (Congregation_ID = 1)
   */
  async searchEvents(query: string, congregationID?: number, limit: number = 20): Promise<Array<{
    value: number;
    label: string;
    startDate: string;
    endDate: string;
    congregationName: string;
    link: string;
    imageUrl: string | null;
  }>> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Build filter: search query + congregation filter (selected campus OR church-wide)
    // Escape single quotes by doubling them for SQL
    const escapedQuery = query.trim().replace(/'/g, "''");
    let filter = `Event_Title LIKE '%${escapedQuery}%'`;
    if (congregationID) {
      filter += ` AND (Events.Congregation_ID = ${congregationID} OR Events.Congregation_ID = 1)`;
    }

    const events = await this.tableService.getTableRecords<{
      Event_ID: number;
      Event_Title: string;
      Event_Start_Date: string;
      Event_End_Date: string;
      Congregation_ID_Table_Congregation_Name?: string;
      "Congregation_ID_Table.Congregation_Name"?: string;
      Primary_Contact_Table_Email_Address?: string;
      [key: string]: any;
    }>("Events", {
      $select: "Event_ID,Event_Title,Event_Start_Date,Event_End_Date,Congregation_ID_Table.Congregation_Name,Primary_Contact_Table.Email_Address",
      $filter: filter,
      $orderby: "Event_ID DESC",
      $top: limit,
    });

    return events.map((e) => {
      // Try different possible property names for the congregation name
      const congregationName =
        e.Congregation_ID_Table_Congregation_Name ||
        e["Congregation_ID_Table.Congregation_Name"] ||
        e["Congregation_ID_Table_Congregation_Name"] ||
        (Object.keys(e).find(key => key.includes("Congregation_Name")) ? e[Object.keys(e).find(key => key.includes("Congregation_Name"))!] : "Unknown");

      console.log("Event record keys:", Object.keys(e));
      console.log("Event congregation name value:", congregationName);

      return {
        value: e.Event_ID,
        label: e.Event_Title,
        startDate: e.Event_Start_Date,
        endDate: e.Event_End_Date,
        congregationName: congregationName as string,
        link: `/events/${e.Event_ID}`,
        imageUrl: null, // Events table doesn't have a direct image field
      };
    });
  }

  /**
   * Search opportunities for dropdown with basic information
   * Uses Opportunities table with Program_ID_Table navigation
   * Note: Cannot filter by congregation in WHERE clause due to MinistryPlatform limitations
   */
  async searchOpportunities(query: string, congregationID?: number, limit: number = 20): Promise<Array<{
    value: number;
    label: string;
    congregationName: string;
    opportunityDate: string | null;
    durationInHours: number | null;
  }>> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Only filter by title - cannot filter by Program's Congregation_ID in WHERE clause
    const filter = `Opportunity_Title LIKE '%${query.trim()}%'`;

    const opportunities = await this.tableService.getTableRecords<{
      Opportunity_ID: number;
      Opportunity_Title: string;
      Program_ID_Table_Program_Name?: string;
      Program_ID_Table_Congregation_ID?: number;
      "Program_ID_Table.Congregation_ID"?: number;
      Program_ID_Table_Congregation_ID_Table_Congregation_Name?: string;
      "Program_ID_Table_Congregation_ID_Table.Congregation_Name"?: string;
      Opportunity_Date: string | null;
      Duration_in_Hours: number | null;
      [key: string]: any;
    }>("Opportunities", {
      $select: "Opportunity_ID,Opportunity_Title,Program_ID_Table.Program_Name,Program_ID_Table.Congregation_ID,Program_ID_Table_Congregation_ID_Table.Congregation_Name,Opportunity_Date,Duration_in_Hours",
      $filter: filter,
      $orderby: "Opportunity_ID DESC",
      $top: limit * 3, // Get more results since we'll filter client-side
    });

    console.log("Raw opportunities response:", JSON.stringify(opportunities, null, 2));

    // Try different possible property names for the congregation name and ID
    const mappedOpportunities = opportunities.map((o) => {
      const congregationName =
        o.Program_ID_Table_Congregation_ID_Table_Congregation_Name ||
        o["Program_ID_Table_Congregation_ID_Table.Congregation_Name"] ||
        (Object.keys(o).find(key => key.includes("Congregation_Name")) ? o[Object.keys(o).find(key => key.includes("Congregation_Name"))!] : "Unknown");

      // Try to get the Congregation_ID
      const congregationID =
        o.Program_ID_Table_Congregation_ID ||
        o["Program_ID_Table.Congregation_ID"] ||
        (Object.keys(o).find(key => key.includes("Congregation_ID") && !key.includes("Congregation_Name")) ? o[Object.keys(o).find(key => key.includes("Congregation_ID") && !key.includes("Congregation_Name"))!] : null);

      console.log("Opportunity record keys:", Object.keys(o));
      console.log("Congregation name value:", congregationName);
      console.log("Congregation ID value:", congregationID);

      return {
        value: o.Opportunity_ID,
        label: o.Opportunity_Title,
        congregationName: congregationName as string,
        congregationID: congregationID as number | null,
        opportunityDate: o.Opportunity_Date,
        durationInHours: o.Duration_in_Hours,
      };
    });

    // If no congregation filter, return all results
    if (!congregationID) {
      return mappedOpportunities.slice(0, limit);
    }

    // Client-side filtering: show opportunities from selected campus OR church-wide (ID 1)
    // Note: This is a workaround since we can't filter by Program's Congregation_ID in SQL
    const filtered = mappedOpportunities.filter(opp => {
      // Include if: opportunity belongs to selected congregation OR church-wide (ID 1)
      return opp.congregationID === congregationID || opp.congregationID === 1;
    });

    return filtered.slice(0, limit);
  }

  /**
   * Get Application Labels for the Announcements Widget
   */
  async getApplicationLabels(): Promise<Array<{
    Application_Label_ID: number;
    Label_Name: string;
    English: string;
  }>> {
    const labels = await this.tableService.getTableRecords<{
      Application_Label_ID: number;
      Label_Name: string;
      English: string;
    }>("dp_Application_Labels", {
      $select: "Application_Label_ID,Label_Name,English",
      $filter: "Label_Name LIKE 'customWidgets.announcementsWidget.%'",
      $orderby: "Label_Name ASC",
    });

    return labels;
  }

  /**
   * Update an Application Label
   */
  async updateApplicationLabel(
    id: number,
    english: string,
    userId: number
  ): Promise<void> {
    await this.tableService.updateTableRecords(
      "dp_Application_Labels",
      [
        {
          Application_Label_ID: id,
          English: english,
        },
      ],
      {
        $userId: userId,
      }
    );
  }
}
