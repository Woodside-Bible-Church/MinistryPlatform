/**
 * MinistryPlatform Feedback Types Entity Service
 * Handles operations for the Feedback_Types table (Prayer Request Categories)
 */

import { MinistryPlatformClient } from '../core/ministryPlatformClient';
import { TableService } from '../services/tableService';
import { FeedbackType, FeedbackTypesSchema } from './FeedbackTypesSchema';
import { TableQueryParams } from '../Interfaces/mpProviderInterfaces';

export class FeedbackTypesEntity {
  private tableService: TableService;
  private readonly tableName = 'Feedback_Types';

  constructor(client: MinistryPlatformClient) {
    this.tableService = new TableService(client);
  }

  /**
   * Get all feedback types (prayer categories)
   */
  async getFeedbackTypes(params?: TableQueryParams): Promise<FeedbackType[]> {
    try {
      const data = await this.tableService.getTableRecords<FeedbackType>(
        this.tableName,
        {
          ...params,
          $select: params?.$select || 'Feedback_Type_ID,Feedback_Type,Description',
          $orderby: params?.$orderby || 'Feedback_Type',
        }
      );

      return data.map(item => FeedbackTypesSchema.parse(item));
    } catch (error) {
      console.error('Error fetching feedback types:', error);
      throw error;
    }
  }

  /**
   * Get a single feedback type by ID
   */
  async getFeedbackTypeById(id: number): Promise<FeedbackType | null> {
    try {
      const data = await this.getFeedbackTypes({
        $filter: `Feedback_Type_ID = ${id}`,
        $top: 1,
      });

      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`Error fetching feedback type ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get feedback type by name
   */
  async getFeedbackTypeByName(name: string): Promise<FeedbackType | null> {
    try {
      const data = await this.getFeedbackTypes({
        $filter: `Feedback_Type = '${name.replace(/'/g, "''")}'`,
        $top: 1,
      });

      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error(`Error fetching feedback type by name "${name}":`, error);
      throw error;
    }
  }
}
