import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import type { Event } from "@/providers/MinistryPlatform/entities/Events";
import type { Metric } from "@/providers/MinistryPlatform/entities/Metrics";
import type { EventMetric, CreateEventMetric } from "@/providers/MinistryPlatform/entities/EventMetrics";
import type { Congregations } from "@/providers/MinistryPlatform/entities/Congregations";

export class CounterService {
  private tableService: TableService;

  constructor(token?: string) {
    const client = new MinistryPlatformClient();
    this.tableService = new TableService(client);
  }

  /**
   * Get active congregations/campuses
   * Filters to only show campuses that:
   * - Have started (Start_Date <= today)
   * - Haven't ended yet (End_Date is null OR End_Date >= today)
   * - Are available online
   */
  async getCongregations() {
    const today = new Date().toISOString().split('T')[0];
    const filter = `Start_Date <= '${today}' AND (End_Date IS NULL OR End_Date >= '${today}') AND Available_Online = 1`;

    return this.tableService.getTableRecords<Congregations>("Congregations", {
      $filter: filter,
      $select: "Congregation_ID,Congregation_Name,Congregation_Short_Name,Start_Date,End_Date,Available_Online",
      $orderby: "Congregation_Name",
    });
  }

  /**
   * Get events for a specific date and congregation
   * Finds events where the Event_Start_Date falls on the selected date
   * Only includes events with Event_Type_ID of 28 or 29
   */
  async getEvents(eventDate: string, congregationId: number) {
    const filter = `CAST(Event_Start_Date AS DATE) = '${eventDate}' AND Congregation_ID = ${congregationId} AND (Event_Type_ID = 28 OR Event_Type_ID = 29)`;
    return this.tableService.getTableRecords<Event>("Events", {
      $filter: filter,
      $select: "Event_ID,Event_Title,Event_Start_Date,Event_End_Date,Congregation_ID,Event_Type_ID",
      $orderby: "Event_Start_Date",
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
