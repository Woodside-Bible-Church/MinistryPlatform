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
}

export class PrayerService {
  private feedbackEntity: FeedbackEntity;
  private feedbackTypesEntity: FeedbackTypesEntity;

  constructor(accessToken: string) {
    const client = new MinistryPlatformClient(accessToken);
    this.feedbackEntity = new FeedbackEntity(client);
    this.feedbackTypesEntity = new FeedbackTypesEntity(client);
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
}
