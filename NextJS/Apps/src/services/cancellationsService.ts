import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import { FileService } from "@/providers/MinistryPlatform/services/fileService";
import type {
  Cancellation,
  CancellationFormData,
  CancellationService,
  CancellationServiceFormData,
  CancellationUpdate,
  CancellationUpdateFormData,
  CancellationStatusOption,
} from "@/types/cancellations";

// MinistryPlatform record types (snake_case)
export interface CancellationRecord {
  Congregation_Cancellation_ID?: number;
  Congregation_ID: number;
  Cancellation_Status_ID: number;
  Reason: string | null;
  Expected_Resume_Time: string | null;
  Start_Date: string;
  End_Date: string | null;
  Domain_ID: number;
  [key: string]: unknown;
}

export interface CancellationServiceRecord {
  Congregation_Cancellation_Service_ID?: number;
  Congregation_Cancellation_ID: number;
  Service_Name: string;
  Service_Status: string;
  Details: string | null;
  Sort_Order: number;
  Domain_ID: number;
  [key: string]: unknown;
}

export interface CancellationUpdateRecord {
  Congregation_Cancellation_Update_ID?: number;
  Congregation_Cancellation_ID: number;
  Update_Message: string;
  Update_Timestamp?: string;  // Optional - DB sets via GETDATE() default
  Domain_ID: number;
  [key: string]: unknown;
}

export class CancellationsService {
  private client: MinistryPlatformClient;
  private tableService: TableService;
  private fileService: FileService;

  constructor(accessToken?: string) {
    this.client = new MinistryPlatformClient(accessToken);
    this.tableService = new TableService(this.client);
    this.fileService = new FileService(this.client);
  }

  /**
   * Get all cancellations with optional filters
   */
  async getCancellations(params?: {
    congregationID?: number;
    activeOnly?: boolean;
  }): Promise<Cancellation[]> {
    await this.client.ensureValidToken();

    let filter = "Congregation_Cancellations.Domain_ID=1";
    if (params?.congregationID) {
      filter += ` AND Congregation_Cancellations.Congregation_ID=${params.congregationID}`;
    }
    if (params?.activeOnly) {
      const now = new Date().toISOString();
      filter += ` AND Congregation_Cancellations.Start_Date <= '${now}' AND (Congregation_Cancellations.End_Date IS NULL OR Congregation_Cancellations.End_Date > '${now}')`;
    }

    // Get base cancellation records - prefix columns with table name to avoid ambiguity
    const records = await this.tableService.getTableRecords<{
      Congregation_Cancellation_ID: number;
      Congregation_ID: number;
      Cancellation_Status_ID: number;
      Reason: string | null;
      Expected_Resume_Time: string | null;
      Start_Date: string;
      End_Date: string | null;
      Domain_ID: number;
    }>("Congregation_Cancellations", {
      $select: "Congregation_Cancellations.Congregation_Cancellation_ID,Congregation_Cancellations.Congregation_ID,Congregation_Cancellations.Cancellation_Status_ID,Congregation_Cancellations.Reason,Congregation_Cancellations.Expected_Resume_Time,Congregation_Cancellations.Start_Date,Congregation_Cancellations.End_Date,Congregation_Cancellations.Domain_ID",
      $filter: filter,
      $orderby: "Congregation_Cancellations.Start_Date DESC",
    });

    // Fetch lookup data for congregations, statuses, and SVG URLs
    const [congregationsMap, statusesMap, svgUrlsMap] = await Promise.all([
      this.getCongregationsMap(),
      this.getStatusesMap(),
      this.getCampusSvgUrls(),
    ]);

    // Get services and updates for each cancellation
    const cancellations: Cancellation[] = [];

    for (const record of records) {
      const services = await this.getServicesForCancellation(record.Congregation_Cancellation_ID);
      const updates = await this.getUpdatesForCancellation(record.Congregation_Cancellation_ID);

      const statusName = statusesMap.get(record.Cancellation_Status_ID) || 'Open';
      const congregationName = congregationsMap.get(record.Congregation_ID) || 'Unknown';
      const now = new Date();
      const startDate = new Date(record.Start_Date);
      const endDate = record.End_Date ? new Date(record.End_Date) : null;
      const isActive = startDate <= now && (!endDate || endDate > now);

      cancellations.push({
        ID: record.Congregation_Cancellation_ID,
        CongregationID: record.Congregation_ID,
        CongregationName: congregationName,
        CampusSvgUrl: svgUrlsMap.get(record.Congregation_ID) || null,
        StatusID: record.Cancellation_Status_ID,
        StatusName: statusName,
        Status: this.mapStatusName(statusName),
        Reason: record.Reason,
        ExpectedResumeTime: record.Expected_Resume_Time,
        StartDate: record.Start_Date,
        EndDate: record.End_Date,
        DomainID: record.Domain_ID,
        Services: services,
        Updates: updates,
        IsActive: isActive,
      });
    }

    return cancellations;
  }

  /**
   * Get a map of congregation IDs to names
   */
  private async getCongregationsMap(): Promise<Map<number, string>> {
    const congregations = await this.tableService.getTableRecords<{
      Congregation_ID: number;
      Congregation_Name: string;
    }>("Congregations", {
      $select: "Congregation_ID,Congregation_Name",
    });

    const map = new Map<number, string>();
    for (const c of congregations) {
      map.set(c.Congregation_ID, c.Congregation_Name);
    }
    return map;
  }

  /**
   * Get a map of status IDs to names
   */
  private async getStatusesMap(): Promise<Map<number, string>> {
    const statuses = await this.tableService.getTableRecords<{
      Cancellation_Status_ID: number;
      Status_Name: string;
    }>("__CancellationStatuses", {
      $select: "Cancellation_Status_ID,Status_Name",
    });

    const map = new Map<number, string>();
    for (const s of statuses) {
      map.set(s.Cancellation_Status_ID, s.Status_Name);
    }
    return map;
  }

  /**
   * Get a single cancellation by ID with related data
   */
  async getCancellationById(id: number): Promise<Cancellation | null> {
    await this.client.ensureValidToken();

    const records = await this.tableService.getTableRecords<{
      Congregation_Cancellation_ID: number;
      Congregation_ID: number;
      Cancellation_Status_ID: number;
      Reason: string | null;
      Expected_Resume_Time: string | null;
      Start_Date: string;
      End_Date: string | null;
      Domain_ID: number;
    }>("Congregation_Cancellations", {
      $select: "Congregation_Cancellations.Congregation_Cancellation_ID,Congregation_Cancellations.Congregation_ID,Congregation_Cancellations.Cancellation_Status_ID,Congregation_Cancellations.Reason,Congregation_Cancellations.Expected_Resume_Time,Congregation_Cancellations.Start_Date,Congregation_Cancellations.End_Date,Congregation_Cancellations.Domain_ID",
      $filter: `Congregation_Cancellations.Congregation_Cancellation_ID=${id}`,
      $top: 1,
    });

    if (records.length === 0) {
      return null;
    }

    const record = records[0];

    // Fetch lookup data
    const [congregationsMap, statusesMap] = await Promise.all([
      this.getCongregationsMap(),
      this.getStatusesMap(),
    ]);

    const services = await this.getServicesForCancellation(id);
    const updates = await this.getUpdatesForCancellation(id);

    const statusName = statusesMap.get(record.Cancellation_Status_ID) || 'Open';
    const congregationName = congregationsMap.get(record.Congregation_ID) || 'Unknown';
    const now = new Date();
    const startDate = new Date(record.Start_Date);
    const endDate = record.End_Date ? new Date(record.End_Date) : null;
    const isActive = startDate <= now && (!endDate || endDate > now);

    return {
      ID: record.Congregation_Cancellation_ID,
      CongregationID: record.Congregation_ID,
      CongregationName: congregationName,
      StatusID: record.Cancellation_Status_ID,
      StatusName: statusName,
      Status: this.mapStatusName(statusName),
      Reason: record.Reason,
      ExpectedResumeTime: record.Expected_Resume_Time,
      StartDate: record.Start_Date,
      EndDate: record.End_Date,
      DomainID: record.Domain_ID,
      Services: services,
      Updates: updates,
      IsActive: isActive,
    };
  }

  /**
   * Create a new cancellation
   */
  async createCancellation(data: CancellationFormData, userId: number): Promise<CancellationRecord> {
    const record: CancellationRecord = {
      Congregation_ID: data.congregationID,
      Cancellation_Status_ID: data.statusID,
      Reason: data.reason,
      Expected_Resume_Time: data.expectedResumeTime,
      Start_Date: data.startDate,
      End_Date: data.endDate,
      Domain_ID: 1,
    };

    const result = await this.tableService.createTableRecords("Congregation_Cancellations", [record], {
      $userId: userId,
    });
    return result[0];
  }

  /**
   * Update an existing cancellation
   */
  async updateCancellation(id: number, data: CancellationFormData, userId: number): Promise<void> {
    const record: CancellationRecord = {
      Congregation_Cancellation_ID: id,
      Congregation_ID: data.congregationID,
      Cancellation_Status_ID: data.statusID,
      Reason: data.reason,
      Expected_Resume_Time: data.expectedResumeTime,
      Start_Date: data.startDate,
      End_Date: data.endDate,
      Domain_ID: 1,
    };

    await this.tableService.updateTableRecords("Congregation_Cancellations", [record], {
      $userId: userId,
    });
  }

  /**
   * Delete a cancellation and all related records
   */
  async deleteCancellation(id: number, userId: number): Promise<void> {
    // First delete related services
    const services = await this.getServicesForCancellation(id);
    if (services.length > 0) {
      const serviceIds = services.map(s => s.ID);
      await this.tableService.deleteTableRecords("Congregation_Cancellation_Services", serviceIds, {
        $userId: userId,
      });
    }

    // Delete related updates
    const updates = await this.getUpdatesForCancellation(id);
    if (updates.length > 0) {
      const updateIds = updates.map(u => u.ID);
      await this.tableService.deleteTableRecords("Congregation_Cancellation_Updates", updateIds, {
        $userId: userId,
      });
    }

    // Now delete the cancellation
    await this.tableService.deleteTableRecords("Congregation_Cancellations", [id], {
      $userId: userId,
    });
  }

  /**
   * End a cancellation by setting End_Date
   */
  async endCancellation(id: number, userId: number): Promise<void> {
    const record = {
      Congregation_Cancellation_ID: id,
      End_Date: new Date().toISOString(),
    };

    await this.tableService.updateTableRecords("Congregation_Cancellations", [record], {
      $userId: userId,
    });
  }

  // ==================== Services ====================

  /**
   * Get services for a cancellation
   */
  async getServicesForCancellation(cancellationId: number): Promise<CancellationService[]> {
    const records = await this.tableService.getTableRecords<{
      Congregation_Cancellation_Service_ID: number;
      Congregation_Cancellation_ID: number;
      Service_Name: string;
      Service_Status: string;
      Details: string | null;
      Sort_Order: number;
    }>("Congregation_Cancellation_Services", {
      $select: "Congregation_Cancellation_Services.Congregation_Cancellation_Service_ID,Congregation_Cancellation_Services.Congregation_Cancellation_ID,Congregation_Cancellation_Services.Service_Name,Congregation_Cancellation_Services.Service_Status,Congregation_Cancellation_Services.Details,Congregation_Cancellation_Services.Sort_Order",
      $filter: `Congregation_Cancellation_Services.Congregation_Cancellation_ID=${cancellationId}`,
      $orderby: "Congregation_Cancellation_Services.Sort_Order ASC, Congregation_Cancellation_Services.Service_Name ASC",
    });

    return records.map(r => ({
      ID: r.Congregation_Cancellation_Service_ID,
      CancellationID: r.Congregation_Cancellation_ID,
      ServiceName: r.Service_Name,
      ServiceStatus: r.Service_Status as 'cancelled' | 'modified' | 'delayed',
      Details: r.Details,
      SortOrder: r.Sort_Order,
    }));
  }

  /**
   * Add a service to a cancellation
   */
  async addService(
    cancellationId: number,
    data: CancellationServiceFormData,
    userId: number
  ): Promise<CancellationServiceRecord> {
    const record: CancellationServiceRecord = {
      Congregation_Cancellation_ID: cancellationId,
      Service_Name: data.serviceName,
      Service_Status: data.serviceStatus,
      Details: data.details,
      Sort_Order: data.sortOrder,
      Domain_ID: 1,
    };

    const result = await this.tableService.createTableRecords(
      "Congregation_Cancellation_Services",
      [record],
      { $userId: userId }
    );
    return result[0];
  }

  /**
   * Update a service
   */
  async updateService(
    serviceId: number,
    data: CancellationServiceFormData,
    userId: number
  ): Promise<void> {
    const record = {
      Congregation_Cancellation_Service_ID: serviceId,
      Service_Name: data.serviceName,
      Service_Status: data.serviceStatus,
      Details: data.details,
      Sort_Order: data.sortOrder,
    };

    await this.tableService.updateTableRecords("Congregation_Cancellation_Services", [record], {
      $userId: userId,
    });
  }

  /**
   * Delete a service
   */
  async deleteService(serviceId: number, userId: number): Promise<void> {
    await this.tableService.deleteTableRecords("Congregation_Cancellation_Services", [serviceId], {
      $userId: userId,
    });
  }

  // ==================== Updates ====================

  /**
   * Get updates for a cancellation
   */
  async getUpdatesForCancellation(cancellationId: number): Promise<CancellationUpdate[]> {
    const records = await this.tableService.getTableRecords<{
      Congregation_Cancellation_Update_ID: number;
      Congregation_Cancellation_ID: number;
      Update_Message: string;
      Update_Timestamp: string;
    }>("Congregation_Cancellation_Updates", {
      $select: "Congregation_Cancellation_Updates.Congregation_Cancellation_Update_ID,Congregation_Cancellation_Updates.Congregation_Cancellation_ID,Congregation_Cancellation_Updates.Update_Message,Congregation_Cancellation_Updates.Update_Timestamp",
      $filter: `Congregation_Cancellation_Updates.Congregation_Cancellation_ID=${cancellationId}`,
      $orderby: "Congregation_Cancellation_Updates.Update_Timestamp DESC",
    });

    return records.map(r => ({
      ID: r.Congregation_Cancellation_Update_ID,
      CancellationID: r.Congregation_Cancellation_ID,
      Message: r.Update_Message,
      Timestamp: r.Update_Timestamp,
    }));
  }

  /**
   * Add an update to a cancellation
   */
  async addUpdate(
    cancellationId: number,
    data: CancellationUpdateFormData,
    userId: number
  ): Promise<CancellationUpdateRecord> {
    // Don't send Update_Timestamp - let the database use GETDATE() default
    // This ensures the timestamp reflects the server's local time
    const record = {
      Congregation_Cancellation_ID: cancellationId,
      Update_Message: data.message,
      Domain_ID: 1,
    };

    const result = await this.tableService.createTableRecords(
      "Congregation_Cancellation_Updates",
      [record],
      { $userId: userId }
    );
    return result[0];
  }

  /**
   * Delete an update
   */
  async deleteUpdate(updateId: number, userId: number): Promise<void> {
    await this.tableService.deleteTableRecords("Congregation_Cancellation_Updates", [updateId], {
      $userId: userId,
    });
  }

  // ==================== Lookups ====================

  /**
   * Get cancellation statuses for dropdown
   */
  async getCancellationStatuses(): Promise<CancellationStatusOption[]> {
    const statuses = await this.tableService.getTableRecords<{
      Cancellation_Status_ID: number;
      Status_Name: string;
    }>("__CancellationStatuses", {
      $select: "Cancellation_Status_ID,Status_Name",
      $orderby: "Cancellation_Status_ID ASC",
    });

    return statuses.map(s => ({
      value: s.Cancellation_Status_ID,
      label: s.Status_Name,
      status: this.mapStatusName(s.Status_Name),
    }));
  }

  /**
   * Get congregations for dropdown
   */
  async getCongregations(): Promise<Array<{ value: number; label: string; slug?: string }>> {
    const congregations = await this.tableService.getTableRecords<{
      Congregation_ID: number;
      Congregation_Name: string;
      Campus_Slug?: string;
    }>("Congregations", {
      $select: "Congregation_ID,Congregation_Name,Campus_Slug",
      $filter: "End_Date IS NULL AND Available_Online = 1 AND Congregation_ID <> 1",
      $orderby: "Congregation_Name ASC",
    });

    return congregations.map(c => ({
      value: c.Congregation_ID,
      label: c.Congregation_Name,
      slug: c.Campus_Slug,
    }));
  }

  /**
   * Get Application Labels for the Cancellations Widget
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
      $filter: "Label_Name LIKE 'customWidgets.cancellationsWidget.%'",
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
      [{ Application_Label_ID: id, English: english }],
      { $userId: userId }
    );
  }

  // ==================== Helpers ====================

  private mapStatusName(statusName: string): 'open' | 'modified' | 'closed' {
    const lower = statusName.toLowerCase();
    if (lower === 'closed') return 'closed';
    if (lower === 'modified') return 'modified';
    return 'open';
  }

  /**
   * Get campus SVG URLs for all congregations
   * Returns a map of Congregation_ID -> SVG URL
   */
  async getCampusSvgUrls(): Promise<Map<number, string>> {
    const svgMap = new Map<number, string>();

    try {
      // Get all congregations
      const congregations = await this.tableService.getTableRecords<{
        Congregation_ID: number;
      }>("Congregations", {
        $select: "Congregation_ID",
        $filter: "End_Date IS NULL AND Available_Online = 1 AND Congregation_ID <> 1",
      });

      console.log(`[CampusSvg] Fetching files for ${congregations.length} congregations`);

      // Fetch files for each congregation in parallel
      const filePromises = congregations.map(async (c) => {
        try {
          const files = await this.fileService.getFilesByRecord("Congregations", c.Congregation_ID);
          console.log(`[CampusSvg] Congregation ${c.Congregation_ID} has ${files.length} files:`, files.map(f => f.FileName));

          // Find the Campus.svg file
          const svgFile = files.find(f => f.FileName === "Campus.svg");
          if (svgFile?.UniqueFileId) {
            // Construct the file URL using the unique file ID
            // This endpoint doesn't require authentication
            // Base URL already includes /ministryplatformapi, so just add /files
            const baseUrl = process.env.MINISTRY_PLATFORM_BASE_URL || "";
            const url = `${baseUrl}/files/${svgFile.UniqueFileId}`;
            console.log(`[CampusSvg] Congregation ${c.Congregation_ID} SVG URL: ${url}`);
            svgMap.set(c.Congregation_ID, url);
          }
        } catch (err) {
          // Silently ignore errors for individual congregations
          console.warn(`[CampusSvg] Failed to fetch files for congregation ${c.Congregation_ID}:`, err);
        }
      });

      await Promise.all(filePromises);
      console.log(`[CampusSvg] Found SVG URLs for ${svgMap.size} congregations`);
    } catch (err) {
      console.error("[CampusSvg] Error fetching campus SVG URLs:", err);
    }

    return svgMap;
  }
}
