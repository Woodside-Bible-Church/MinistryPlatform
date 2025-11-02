import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import { ProcedureService } from "@/providers/MinistryPlatform/services/procedureService";
import type { Event } from "@/providers/MinistryPlatform/entities/Events";
import type { Metric } from "@/providers/MinistryPlatform/entities/Metrics";
import type { EventMetric, CreateEventMetric } from "@/providers/MinistryPlatform/entities/EventMetrics";
import type { Congregations } from "@/providers/MinistryPlatform/entities/Congregations";

export class CounterService {
  private tableService: TableService;
  private procedureService: ProcedureService;
  private client: MinistryPlatformClient;

  constructor(token?: string) {
    this.client = new MinistryPlatformClient();
    this.tableService = new TableService(this.client);
    this.procedureService = new ProcedureService(this.client);
  }

  /**
   * Get active congregations/campuses with Campus SVG URLs
   * Uses stored procedure to fetch congregations with their Campus.svg file URLs
   * Filters to only show campuses that:
   * - Have started (Start_Date <= today)
   * - Haven't ended yet (End_Date is null OR End_Date >= today)
   * - Are available online
   */
  async getCongregations() {
    try {
      const result = await this.procedureService.executeProcedure('api_Custom_GetCongregationsWithSVG');

      // The stored proc returns JSON in a special column format
      // Result structure: [[{ JSON_F52E2B6118A111d1B10500805F49916B: "..." }]]
      if (result && result.length > 0 && result[0] && result[0].length > 0) {
        const firstRow = result[0][0] as any;
        const jsonString = firstRow.JSON_F52E2B6118A111d1B10500805F49916B;

        if (jsonString) {
          return JSON.parse(jsonString) as Congregations[];
        }
      }

      return [];
    } catch (error) {
      console.error('Error fetching congregations with SVG:', error);
      throw error;
    }
  }

  /**
   * Get events for a specific date and optionally a specific congregation
   * Finds events where the Event_Start_Date falls on the selected date
   * Only includes events with Event_Type_ID of 28 or 29
   * Only includes events where Program's Ministry_ID is 127
   * All Events columns are qualified with "Events." to avoid ambiguity when joining via Program_ID_Table
   *
   * @param congregationId - Optional congregation ID. If null/undefined, returns events for all congregations (Church Wide)
   */
  async getEvents(eventDate: string, congregationId: number | null) {
    // Base filter without congregation
    let filter = `Events.Event_Type_ID IN (28, 29) AND Program_ID_Table.Ministry_ID = 127 AND CAST(Events.Event_Start_Date AS DATE) = '${eventDate}'`;

    // Add congregation filter only if congregationId is provided (not null and not 1 for Church Wide)
    if (congregationId && congregationId !== 1) {
      filter += ` AND Events.Congregation_ID = ${congregationId}`;
    }

    return this.tableService.getTableRecords<Event>("Events", {
      $filter: filter,
      $select: "Events.Event_ID,Events.Event_Title,Events.Event_Start_Date,Events.Event_End_Date,Events.Congregation_ID,Events.Event_Type_ID,Events.Program_ID",
      $orderby: "Event_Start_Date",
    });
  }

  /**
   * Get programs by Ministry_ID
   */
  async getProgramsByMinistryId(ministryId: number) {
    return this.tableService.getTableRecords<{ Program_ID: number }>("Programs", {
      $filter: `Ministry_ID = ${ministryId}`,
      $select: "Program_ID",
    });
  }

  /**
   * Get all available metrics
   */
  async getMetrics() {
    return this.tableService.getTableRecords<Metric>("Metrics", {
      $select: "Metric_ID,Metric_Title,Is_Headcount",
      $orderby: "Metric_Title",
    });
  }

  /**
   * Submit a new event metric
   */
  async submitEventMetric(data: CreateEventMetric) {
    const result = await this.tableService.createTableRecords("Event_Metrics", [data]);
    return result[0];
  }

  /**
   * Get existing metrics for an event
   */
  async getEventMetrics(eventId: number) {
    return this.tableService.getTableRecords<EventMetric>("Event_Metrics", {
      $filter: `Event_ID = ${eventId}`,
      $select: "Event_Metric_ID,Event_ID,Metric_ID,Numerical_Value,Group_ID",
      $orderby: "Metric_ID",
    });
  }

  /**
   * Delete an event metric
   */
  async deleteEventMetric(eventMetricId: number) {
    return this.tableService.deleteTableRecords("Event_Metrics", [eventMetricId]);
  }

  /**
   * Update an event metric
   */
  async updateEventMetric(eventMetricId: number, data: Partial<CreateEventMetric>) {
    return this.tableService.updateTableRecords("Event_Metrics", [{
      Event_Metric_ID: eventMetricId,
      ...data
    }]);
  }
}
