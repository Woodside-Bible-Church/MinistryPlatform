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

  constructor() {
    this.client = new MinistryPlatformClient();
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
   */
  async deleteAnnouncement(id: number, userId: number): Promise<void> {
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
   * Search events for dropdown
   */
  async searchEvents(query: string, limit: number = 10): Promise<Array<{
    value: number;
    label: string;
    startDate: string;
    endDate: string;
  }>> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const events = await this.tableService.getTableRecords<{
      Event_ID: number;
      Event_Title: string;
      Event_Start_Date: string;
      Event_End_Date: string;
    }>("Events", {
      $select: "Event_ID,Event_Title,Event_Start_Date,Event_End_Date",
      $filter: `Event_Title LIKE '%${query.trim()}%'`,
      $orderby: "Event_Start_Date DESC",
      $top: limit,
    });

    return events.map((e) => ({
      value: e.Event_ID,
      label: e.Event_Title,
      startDate: e.Event_Start_Date,
      endDate: e.Event_End_Date,
    }));
  }

  /**
   * Search opportunities for dropdown
   */
  async searchOpportunities(query: string, limit: number = 10): Promise<Array<{
    value: number;
    label: string;
    shiftStart: string;
    shiftEnd: string;
  }>> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const opportunities = await this.tableService.getTableRecords<{
      Opportunity_ID: number;
      Opportunity_Title: string;
      Shift_Start: string;
      Shift_End: string;
    }>("Opportunities", {
      $select: "Opportunity_ID,Opportunity_Title,Shift_Start,Shift_End",
      $filter: `Opportunity_Title LIKE '%${query.trim()}%'`,
      $orderby: "Shift_Start DESC",
      $top: limit,
    });

    return opportunities.map((o) => ({
      value: o.Opportunity_ID,
      label: o.Opportunity_Title,
      shiftStart: o.Shift_Start,
      shiftEnd: o.Shift_End,
    }));
  }
}
