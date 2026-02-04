/**
 * MinistryPlatform Feedback Entity Service
 * Handles CRUD operations for the Feedback table (Prayer Requests)
 */

import { MinistryPlatformClient } from '../core/ministryPlatformClient';
import { TableService } from '../services/tableService';
import {
  Feedback,
  CreateFeedback,
  UpdateFeedback,
  FeedbackWithRelations,
  FeedbackSchema,
  CreateFeedbackSchema,
  UpdateFeedbackSchema,
  FeedbackWithRelationsSchema
} from './FeedbackSchema';
import { TableQueryParams } from '../Interfaces/mpProviderInterfaces';

export class FeedbackEntity {
  private tableService: TableService;
  private readonly tableName = 'Feedback_Entries';

  constructor(client: MinistryPlatformClient) {
    this.tableService = new TableService(client);
  }

  /**
   * Get all feedback/prayer requests with optional filtering
   */
  async getFeedback(params?: TableQueryParams): Promise<FeedbackWithRelations[]> {
    try {
      const data = await this.tableService.getTableRecords<FeedbackWithRelations>(
        this.tableName,
        {
          ...params,
          $select: params?.$select || 'Feedback_Entries.Feedback_Entry_ID,Feedback_Entries.Contact_ID,Feedback_Entries.Feedback_Type_ID,Feedback_Entries.Description,Feedback_Entries.Date_Submitted,Feedback_Entries.Approved,Feedback_Entries.Ongoing_Need,Feedback_Entries.Entry_Title,Feedback_Entries.Prayer_Count,Feedback_Entries.Anonymous_Share,Feedback_Entries.Prayer_Notifications,Contact_ID_Table.Display_Name,Contact_ID_Table.First_Name,Feedback_Type_ID_Table.Feedback_Type',
        }
      );

      return data.map(item => FeedbackWithRelationsSchema.parse(item));
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  }

  /**
   * Get approved prayer requests (public-facing)
   */
  async getApprovedPrayers(params?: TableQueryParams): Promise<FeedbackWithRelations[]> {
    return this.getFeedback({
      ...params,
      $filter: `Feedback_Entries.Approved = 1 ${params?.$filter ? ` AND ${params.$filter}` : ''}`,
      $orderby: 'Date_Submitted DESC',
    });
  }

  /**
   * Get pending prayer requests (for staff approval)
   */
  async getPendingPrayers(params?: TableQueryParams): Promise<FeedbackWithRelations[]> {
    return this.getFeedback({
      ...params,
      $filter: `Feedback_Entries.Approved = 0 OR Feedback_Entries.Approved IS NULL ${params?.$filter ? ` AND ${params.$filter}` : ''}`,
      $orderby: 'Date_Submitted DESC',
    });
  }

  /**
   * Get a single feedback/prayer request by ID
   */
  async getFeedbackById(id: number): Promise<FeedbackWithRelations | null> {
    try {
      const data = await this.getFeedback({
        $filter: `Feedback_Entries.Feedback_Entry_ID = ${id}`,
        $top: 1,
      });

      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`Error fetching feedback ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new prayer request
   */
  async createFeedback(feedback: CreateFeedback): Promise<Feedback> {
    try {
      console.error('[Feedback.createFeedback] Called with:', JSON.stringify(feedback, null, 2));

      // Validate input
      const validatedData = CreateFeedbackSchema.parse({
        ...feedback,
        Date_Submitted: feedback.Date_Submitted || new Date().toISOString(),
        Approved: feedback.Approved ?? false,
      });

      console.error('[Feedback.createFeedback] Validated data:', JSON.stringify(validatedData, null, 2));

      const recordToCreate = {
        ...validatedData,
        Domain_ID: 1, // Default domain
        Visibility_Level_ID: 4, // 4 = Public (displayed on public prayer wall)
        Prayer_Count: 0, // Initialize prayer count to 0
        Anonymous_Share: feedback.Anonymous_Share ?? false,
        Prayer_Notifications: feedback.Prayer_Notifications ?? false,
      } as Feedback;

      console.error('[Feedback.createFeedback] Record to create:', JSON.stringify(recordToCreate, null, 2));

      const result = await this.tableService.createTableRecords<Feedback>(
        this.tableName,
        [recordToCreate]
      );

      return FeedbackSchema.parse(result[0]);
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  /**
   * Update an existing prayer request
   */
  async updateFeedback(feedback: UpdateFeedback): Promise<Feedback> {
    try {
      const validatedData = UpdateFeedbackSchema.parse(feedback);

      const result = await this.tableService.updateTableRecords<Feedback>(
        this.tableName,
        [validatedData as Feedback]
      );

      return FeedbackSchema.parse(result[0]);
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  /**
   * Approve a prayer request (staff action)
   */
  async approveFeedback(feedbackId: number): Promise<Feedback> {
    return this.updateFeedback({
      Feedback_Entry_ID: feedbackId,
      Approved: true,
    });
  }

  /**
   * Delete a prayer request
   */
  async deleteFeedback(feedbackId: number): Promise<void> {
    try {
      await this.tableService.deleteTableRecords(this.tableName, [feedbackId]);
    } catch (error) {
      console.error(`Error deleting feedback ${feedbackId}:`, error);
      throw error;
    }
  }

  /**
   * Get prayer requests by contact ID
   */
  async getFeedbackByContact(contactId: number, params?: TableQueryParams): Promise<FeedbackWithRelations[]> {
    return this.getFeedback({
      ...params,
      $filter: `Feedback_Entries.Contact_ID = ${contactId} ${params?.$filter ? ` AND ${params.$filter}` : ''}`,
      $orderby: 'Date_Submitted DESC',
    });
  }

  /**
   * Get prayer requests by feedback type (category)
   */
  async getFeedbackByType(feedbackTypeId: number, params?: TableQueryParams): Promise<FeedbackWithRelations[]> {
    return this.getFeedback({
      ...params,
      $filter: `Feedback_Entries.Feedback_Type_ID = ${feedbackTypeId} ${params?.$filter ? ` AND ${params.$filter}` : ''}`,
      $orderby: 'Date_Submitted DESC',
    });
  }
}
