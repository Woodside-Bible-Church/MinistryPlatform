/**
 * Prayer Service
 * High-level service for managing prayer requests using MinistryPlatform's Feedback table
 */

import { MinistryPlatformClient } from '@/providers/MinistryPlatform/core/ministryPlatformClient';
import { FeedbackEntity } from '@/providers/MinistryPlatform/entities/Feedback';
import { FeedbackTypesEntity } from '@/providers/MinistryPlatform/entities/FeedbackTypes';
import {
  CreateFeedback,
  UpdateFeedback,
  FeedbackWithRelations,
} from '@/providers/MinistryPlatform/entities/FeedbackSchema';
import { FeedbackType } from '@/providers/MinistryPlatform/entities/FeedbackTypesSchema';

export interface PrayerFilters {
  categoryId?: number;
  onlyApproved?: boolean;
  contactId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  visibilityLevel?: number; // 1=Private, 2=Staff Only, 3=Staff & Church, 4=Public, 5=Hidden: URL Required
}

export class PrayerService {
  private feedbackEntity: FeedbackEntity;
  private feedbackTypesEntity: FeedbackTypesEntity;
  private client: MinistryPlatformClient;

  constructor(accessToken: string) {
    this.client = new MinistryPlatformClient(accessToken);
    this.feedbackEntity = new FeedbackEntity(this.client);
    this.feedbackTypesEntity = new FeedbackTypesEntity(this.client);
  }

  /**
   * Get all prayer categories (Feedback Types)
   */
  async getCategories(): Promise<FeedbackType[]> {
    return this.feedbackTypesEntity.getFeedbackTypes();
  }

  /**
   * Get prayer requests with filtering
   */
  async getPrayers(filters?: PrayerFilters): Promise<FeedbackWithRelations[]> {
    const filterParts: string[] = [];

    if (filters?.categoryId) {
      filterParts.push(`Feedback_Type_ID = ${filters.categoryId}`);
    }

    if (filters?.onlyApproved) {
      filterParts.push('Approved = 1');
    }

    if (filters?.contactId) {
      filterParts.push(`Contact_ID = ${filters.contactId}`);
    }

    if (filters?.startDate) {
      filterParts.push(`Date_Submitted >= '${filters.startDate}'`);
    }

    if (filters?.endDate) {
      filterParts.push(`Date_Submitted <= '${filters.endDate}'`);
    }

    if (filters?.search) {
      const searchTerm = filters.search.replace(/'/g, "''");
      filterParts.push(`(Description LIKE '%${searchTerm}%' OR Entry_Title LIKE '%${searchTerm}%')`);
    }

    // Filter by visibility level if specified
    // TODO: Re-enable default visibility filtering once Visibility_Level_ID is populated in Feedback_Entries
    if (filters?.visibilityLevel !== undefined) {
      filterParts.push(`Visibility_Level_ID >= ${filters.visibilityLevel}`);
    }

    const $filter = filterParts.length > 0 ? filterParts.join(' AND ') : undefined;

    return this.feedbackEntity.getFeedback({
      $filter,
      $orderby: 'Date_Submitted DESC',
    });
  }

  /**
   * Get only approved prayers (public-facing)
   */
  async getApprovedPrayers(filters?: Omit<PrayerFilters, 'onlyApproved'>): Promise<FeedbackWithRelations[]> {
    return this.getPrayers({ ...filters, onlyApproved: true });
  }

  /**
   * Get prayers awaiting approval (staff only)
   */
  async getPendingPrayers(): Promise<FeedbackWithRelations[]> {
    return this.feedbackEntity.getPendingPrayers();
  }

  /**
   * Get a single prayer by ID
   */
  async getPrayerById(id: number): Promise<FeedbackWithRelations | null> {
    return this.feedbackEntity.getFeedbackById(id);
  }

  /**
   * Submit a new prayer request
   */
  async submitPrayer(prayer: CreateFeedback): Promise<FeedbackWithRelations> {
    const created = await this.feedbackEntity.createFeedback(prayer);

    // Fetch the full record with relations
    const fullRecord = await this.feedbackEntity.getFeedbackById(created.Feedback_Entry_ID);

    if (!fullRecord) {
      throw new Error('Failed to fetch created prayer request');
    }

    return fullRecord;
  }

  /**
   * Update a prayer request
   */
  async updatePrayer(prayer: UpdateFeedback): Promise<FeedbackWithRelations> {
    const updated = await this.feedbackEntity.updateFeedback(prayer);

    // Fetch the full record with relations
    const fullRecord = await this.feedbackEntity.getFeedbackById(updated.Feedback_Entry_ID);

    if (!fullRecord) {
      throw new Error('Failed to fetch updated prayer request');
    }

    return fullRecord;
  }

  /**
   * Approve a prayer request (staff action)
   */
  async approvePrayer(feedbackId: number): Promise<FeedbackWithRelations> {
    const approved = await this.feedbackEntity.approveFeedback(feedbackId);

    // Fetch the full record with relations
    const fullRecord = await this.feedbackEntity.getFeedbackById(approved.Feedback_Entry_ID);

    if (!fullRecord) {
      throw new Error('Failed to fetch approved prayer request');
    }

    return fullRecord;
  }

  /**
   * Delete a prayer request
   */
  async deletePrayer(feedbackId: number): Promise<void> {
    return this.feedbackEntity.deleteFeedback(feedbackId);
  }

  /**
   * Get prayers submitted by a specific contact
   */
  async getMyPrayers(contactId: number): Promise<FeedbackWithRelations[]> {
    return this.feedbackEntity.getFeedbackByContact(contactId);
  }

  /**
   * Mark a prayer as prayed for (could track in a custom field or separate table)
   * For now, we'll use the Ongoing_Need flag as a proxy
   */
  async markAsPrayedFor(feedbackId: number): Promise<FeedbackWithRelations> {
    // This could be enhanced with a custom table to track individual prayer actions
    // For now, we'll just update the record to indicate it's no longer ongoing
    return this.updatePrayer({
      Feedback_Entry_ID: feedbackId,
      Ongoing_Need: false,
    });
  }

  /**
   * Get prayers with dynamic response counts using stored procedure
   * This provides real-time prayer counts from Feedback_Entry_User_Responses
   */
  async getPrayersWithCounts(filters?: {
    categoryId?: number;
    onlyApproved?: boolean;
    contactId?: number;
    userContactId?: number; // For User_Has_Prayed flag
    visibilityLevel?: number;
    daysToShow?: number;
  }): Promise<unknown> {
    return this.client.callStoredProcedure('api_Custom_Feedback_With_Responses_JSON', {
      '@FeedbackTypeID': filters?.categoryId || null,
      '@OnlyApproved': filters?.onlyApproved !== false,
      '@UserContactID': filters?.userContactId || null,
      '@VisibilityLevelID': filters?.visibilityLevel !== undefined ? filters.visibilityLevel : null,
      '@DaysToShow': filters?.daysToShow || 60,
    });
  }

  /**
   * Get prayers that a specific user has prayed for
   */
  async getPrayersUserPrayedFor(contactId: number): Promise<unknown> {
    // Query Feedback_Entry_User_Responses and join to get prayer details
    // Note: MP doesn't support nested joins (e.g., Feedback_Entry_ID_Table.Contact_ID_Table.Display_Name)
    // So we only get the prayer details, not the contact who submitted it
    const responses = await this.client.get('Feedback_Entry_User_Responses', {
      $filter: `Feedback_Entry_User_Responses.Contact_ID = ${contactId} AND Feedback_Entry_User_Responses.Response_Type_ID = 1`,
      $select: 'Feedback_Entry_User_Responses.Feedback_Entry_User_Response_ID,Feedback_Entry_User_Responses.Feedback_Entry_ID,Feedback_Entry_User_Responses.Response_Date,Feedback_Entry_User_Responses.Response_Text,Feedback_Entry_ID_Table.Entry_Title,Feedback_Entry_ID_Table.Description,Feedback_Entry_ID_Table.Date_Submitted,Feedback_Entry_ID_Table.Prayer_Count,Feedback_Entry_ID_Table.Feedback_Type_ID,Feedback_Entry_ID_Table.Visibility_Level_ID,Feedback_Entry_ID_Table.Target_Date,Feedback_Entry_ID_Table.Ongoing_Need,Feedback_Entry_ID_Table.Contact_ID,Feedback_Entry_ID_Table.Anonymous_Share',
      $orderby: 'Feedback_Entry_User_Responses.Response_Date DESC',
    });

    return responses;
  }

  /**
   * Get actual prayer counts from Feedback_Entry_User_Responses table
   * Returns a map of Feedback_Entry_ID -> count
   */
  async getPrayerCounts(feedbackEntryIds: number[]): Promise<Record<number, number>> {
    if (feedbackEntryIds.length === 0) {
      return {};
    }

    // Query all responses for these prayers
    const filter = `Feedback_Entry_ID IN (${feedbackEntryIds.join(',')}) AND Response_Type_ID = 1`;
    const responses = await this.client.get('Feedback_Entry_User_Responses', {
      $filter: filter,
      $select: 'Feedback_Entry_ID',
    });

    // Count responses per prayer
    const counts: Record<number, number> = {};
    const responsesArray = Array.isArray(responses) ? responses : [];

    responsesArray.forEach((response: { Feedback_Entry_ID: number }) => {
      const id = response.Feedback_Entry_ID;
      counts[id] = (counts[id] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get all updates for multiple prayers from Feedback_Entry_Updates table
   * Returns a map of Feedback_Entry_ID -> array of updates
   */
  async getPrayerUpdates(feedbackEntryIds: number[]): Promise<Record<number, Array<{
    Feedback_Entry_Update_ID: number;
    Update_Text: string;
    Update_Date: string;
    Is_Answered: boolean;
  }>>> {
    if (feedbackEntryIds.length === 0) {
      return {};
    }

    // Query all updates for these prayers
    const filter = `Feedback_Entry_ID IN (${feedbackEntryIds.join(',')})`;
    const updates = await this.client.get('Feedback_Entry_Updates', {
      $filter: filter,
      $select: 'Feedback_Entry_Update_ID,Feedback_Entry_ID,Update_Text,Update_Date,Is_Answered',
      $orderby: 'Update_Date DESC',
    });

    // Group updates by prayer ID
    const updatesByPrayer: Record<number, Array<{
      Feedback_Entry_Update_ID: number;
      Update_Text: string;
      Update_Date: string;
      Is_Answered: boolean;
    }>> = {};

    const updatesArray = Array.isArray(updates) ? updates : [];

    updatesArray.forEach((update: {
      Feedback_Entry_ID: number;
      Feedback_Entry_Update_ID: number;
      Update_Text: string;
      Update_Date: string;
      Is_Answered: boolean | null;
    }) => {
      const id = update.Feedback_Entry_ID;
      if (!updatesByPrayer[id]) {
        updatesByPrayer[id] = [];
      }
      updatesByPrayer[id].push({
        Feedback_Entry_Update_ID: update.Feedback_Entry_Update_ID,
        Update_Text: update.Update_Text,
        Update_Date: update.Update_Date,
        Is_Answered: update.Is_Answered ?? false,
      });
    });

    return updatesByPrayer;
  }
}
