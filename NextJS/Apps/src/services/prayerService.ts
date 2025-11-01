import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";

export interface Prayer {
  Feedback_Entry_ID: number;
  Entry_Title: string | null;
  Description: string;
  Date_Submitted: string;
  Approved: boolean;
  Ongoing_Need: boolean;
  Feedback_Type_ID: number;
  Contact_ID: number;
  Prayer_Count?: number;
}

export interface CreatePrayer {
  Contact_ID: number;
  Entry_Title?: string;
  Description: string;
  Feedback_Type_ID?: number;
  Date_Submitted: string;
  Approved: boolean;
  Ongoing_Need?: boolean;
  [key: string]: unknown; // Index signature for TableRecord compatibility
}

export interface PrayerUserResponse {
  Feedback_Entry_User_Response_ID?: number;
  Feedback_Entry_ID: number;
  Contact_ID: number;
  Response_Type_ID: number;
  Response_Date: string;
  Response_Text?: string;
  [key: string]: unknown; // Index signature for TableRecord compatibility
}

export interface PrayerCount {
  Feedback_Entry_ID: number;
  Prayer_Count: number;
}

export class PrayerService {
  private tableService: TableService;

  constructor(token?: string) {
    const client = new MinistryPlatformClient();
    this.tableService = new TableService(client);
  }

  /**
   * Get approved prayers for public viewing
   * Optionally filter to a specific user's prayers
   */
  async getPrayers(contactId?: number) {
    let filter = "Approved = 1";

    if (contactId) {
      // If contactId provided, show approved prayers OR user's own prayers
      filter = `Approved = 1 OR Contact_ID = ${contactId}`;
    }

    return this.tableService.getTableRecords<Prayer>("Feedback_Entries", {
      $select: "Feedback_Entry_ID,Entry_Title,Description,Date_Submitted,Approved,Ongoing_Need,Feedback_Type_ID,Contact_ID",
      $filter: filter,
      $orderby: "Date_Submitted DESC",
      $top: 50,
    });
  }

  /**
   * Search prayers by title and description
   * Only returns approved prayers
   */
  async searchPrayers(query: string, limit: number = 6) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();
    const filter = `Approved = 1 AND (Entry_Title LIKE '%${searchTerm}%' OR Description LIKE '%${searchTerm}%')`;

    return this.tableService.getTableRecords<Prayer>("Feedback_Entries", {
      $select: "Feedback_Entry_ID,Entry_Title,Description,Date_Submitted",
      $filter: filter,
      $orderby: "Date_Submitted DESC",
      $top: limit,
    });
  }

  /**
   * Create a new prayer request
   */
  async createPrayer(data: CreatePrayer) {
    const result = await this.tableService.createTableRecords("Feedback_Entries", [data]);
    return result[0];
  }

  /**
   * Get prayers by contact ID (for "My Prayers" view)
   */
  async getPrayersByContactId(contactId: number) {
    return this.tableService.getTableRecords<Prayer>("Feedback_Entries", {
      $filter: `Contact_ID = ${contactId}`,
      $select: "Feedback_Entry_ID,Entry_Title,Description,Date_Submitted,Approved,Ongoing_Need,Feedback_Type_ID",
      $orderby: "Date_Submitted DESC",
    });
  }

  /**
   * Record that a user prayed for a prayer request
   * Response_Type_ID: 1 = Prayed
   */
  async recordPrayer(data: Omit<PrayerUserResponse, 'Feedback_Entry_User_Response_ID'>) {
    const result = await this.tableService.createTableRecords("Feedback_Entry_User_Responses", [data]);
    return result[0];
  }

  /**
   * Get prayer count for a specific prayer request
   */
  async getPrayerCount(feedbackEntryId: number): Promise<number> {
    const responses = await this.tableService.getTableRecords<PrayerUserResponse>(
      "Feedback_Entry_User_Responses",
      {
        $filter: `Feedback_Entry_ID = ${feedbackEntryId} AND Response_Type_ID = 1`,
        $select: "Feedback_Entry_User_Response_ID",
      }
    );
    return responses.length;
  }

  /**
   * Get prayer counts for multiple prayers (batch operation)
   * Returns a map of Feedback_Entry_ID to count
   */
  async getPrayerCounts(feedbackEntryIds: number[]): Promise<Map<number, number>> {
    if (feedbackEntryIds.length === 0) {
      return new Map();
    }

    const idsString = feedbackEntryIds.join(",");
    const responses = await this.tableService.getTableRecords<PrayerUserResponse>(
      "Feedback_Entry_User_Responses",
      {
        $filter: `Feedback_Entry_ID IN (${idsString}) AND Response_Type_ID = 1`,
        $select: "Feedback_Entry_ID,Feedback_Entry_User_Response_ID",
      }
    );

    // Count responses per prayer
    const countsMap = new Map<number, number>();
    for (const response of responses) {
      const currentCount = countsMap.get(response.Feedback_Entry_ID) || 0;
      countsMap.set(response.Feedback_Entry_ID, currentCount + 1);
    }

    // Ensure all requested IDs have an entry (even if count is 0)
    for (const id of feedbackEntryIds) {
      if (!countsMap.has(id)) {
        countsMap.set(id, 0);
      }
    }

    return countsMap;
  }

  /**
   * Get prayers with prayer counts included
   */
  async getPrayersWithCounts(contactId?: number): Promise<Prayer[]> {
    const prayers = await this.getPrayers(contactId);

    // Get all prayer IDs
    const prayerIds = prayers.map(p => p.Feedback_Entry_ID);

    // Get counts for all prayers
    const countsMap = await this.getPrayerCounts(prayerIds);

    // Merge counts into prayer objects
    return prayers.map(prayer => ({
      ...prayer,
      Prayer_Count: countsMap.get(prayer.Feedback_Entry_ID) || 0,
    }));
  }

  /**
   * Get user prayer statistics (total prayers, streak, today count)
   */
  async getUserPrayerStats(contactId: number): Promise<{
    totalPrayers: number;
    dayStreak: number;
    todayCount: number;
  }> {
    // Get all prayer responses for this user
    const responses = await this.tableService.getTableRecords<PrayerUserResponse>(
      "Feedback_Entry_User_Responses",
      {
        $filter: `Contact_ID = ${contactId} AND Response_Type_ID = 1`,
        $select: "Response_Date",
        $orderby: "Response_Date DESC",
      }
    );

    const totalPrayers = responses.length;

    // Calculate today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];

    const todayCount = responses.filter(r => {
      const responseDate = new Date(r.Response_Date);
      const responseDateStr = responseDate.toISOString().split('T')[0];
      return responseDateStr === todayISO;
    }).length;

    // Calculate streak (consecutive days with at least one prayer)
    let dayStreak = 0;
    if (responses.length > 0) {
      // Group responses by date
      const dateSet = new Set<string>();
      for (const response of responses) {
        const date = new Date(response.Response_Date);
        const dateStr = date.toISOString().split('T')[0];
        dateSet.add(dateStr);
      }

      const uniqueDates = Array.from(dateSet).sort().reverse();

      // Check streak from today backwards
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < uniqueDates.length; i++) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (uniqueDates.includes(dateStr)) {
          dayStreak++;
          // Move to previous day
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // Streak broken
          break;
        }
      }
    }

    return {
      totalPrayers,
      dayStreak,
      todayCount,
    };
  }
}
