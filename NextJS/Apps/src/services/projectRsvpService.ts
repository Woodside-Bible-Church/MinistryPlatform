import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
import { ProcedureService } from "@/providers/MinistryPlatform/services/procedureService";
import {
  Project,
  CreateProject,
  UpdateProject,
  RSVPProjectList,
} from "@/providers/MinistryPlatform/entities/ProjectSchema";
import {
  ProjectEvent,
  CreateProjectEvent,
  UpdateProjectEvent,
  ProjectEventWithDetails,
  ProjectRSVP,
} from "@/providers/MinistryPlatform/entities/ProjectEventSchema";

/**
 * Project RSVP Service
 * Business logic for managing RSVP Projects and their events
 */
export class ProjectRSVPService {
  private static instance: ProjectRSVPService;
  private mp: MinistryPlatformClient;
  private tableService: TableService;
  private procedureService: ProcedureService;

  private constructor(mp: MinistryPlatformClient) {
    this.mp = mp;
    this.tableService = new TableService(mp);
    this.procedureService = new ProcedureService(mp);
  }

  public static async getInstance(): Promise<ProjectRSVPService> {
    if (!ProjectRSVPService.instance) {
      const mp = new MinistryPlatformClient();
      await mp.ensureValidToken();
      ProjectRSVPService.instance = new ProjectRSVPService(mp);
    }
    return ProjectRSVPService.instance;
  }

  // =====================================================
  // Project Operations
  // =====================================================

  /**
   * Get all active RSVP projects
   * Uses stored procedure for better performance
   */
  public async getActiveRSVPProjects(): Promise<RSVPProjectList[]> {
    try {
      const result = await this.procedureService.executeProcedure(
        'api_Custom_RSVP_Management_Projects_JSON',
        {}
      );

      // Stored proc returns JSON in a special column format
      if (result && result.length > 0 && result[0] && result[0].length > 0) {
        const firstRow = result[0][0] as any;
        // The column name is typically JsonResult or similar
        const jsonString = firstRow.JsonResult;

        if (jsonString) {
          return JSON.parse(jsonString);
        }
      }

      return [];
    } catch (error) {
      console.error("Error fetching active RSVP projects:", error);
      throw error;
    }
  }

  /**
   * Get a single project by ID
   */
  public async getProjectById(projectId: number): Promise<Project> {
    try {
      const result = await this.tableService.getTableRecords<Project>(
        "Projects",
        {
          $filter: `Project_ID = ${projectId}`,
          $top: 1,
        }
      );

      if (!result || result.length === 0) {
        throw new Error(`Project ${projectId} not found`);
      }

      return result[0];
    } catch (error) {
      console.error(`Error fetching project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get a single project by slug
   */
  public async getProjectBySlug(slug: string): Promise<Project> {
    try {
      const result = await this.tableService.getTableRecords<Project>(
        "Projects",
        {
          $filter: `RSVP_Slug = '${slug}'`,
          $top: 1,
        }
      );

      if (!result || result.length === 0) {
        throw new Error(`Project with slug '${slug}' not found`);
      }

      return result[0];
    } catch (error) {
      console.error(`Error fetching project with slug '${slug}':`, error);
      throw error;
    }
  }

  /**
   * Update a project (RSVP fields)
   */
  public async updateProject(data: UpdateProject, userId?: number): Promise<Project> {
    try {
      const options = userId ? { $userId: userId } : {};
      const result = await this.tableService.updateTableRecords<Project>(
        "Projects",
        [data as Project],
        options
      );

      return result[0];
    } catch (error) {
      console.error("Error updating project:", error);
      throw error;
    }
  }

  // =====================================================
  // Project Events Operations
  // =====================================================

  /**
   * Get complete project details with events and RSVPs using stored procedure
   */
  public async getProjectDetails(projectIdOrSlug: number | string) {
    try {
      // MinistryPlatform API expects @ prefix for parameter names
      const params = typeof projectIdOrSlug === 'number'
        ? { '@Project_ID': projectIdOrSlug }
        : { '@RSVP_Slug': projectIdOrSlug };

      const result = await this.procedureService.executeProcedure(
        'api_Custom_RSVP_Project_Details_JSON',
        params
      );

      // Stored proc returns JSON in a special column format
      if (result && result.length > 0 && result[0] && result[0].length > 0) {
        const firstRow = result[0][0] as any;
        // The column name is typically JsonResult or similar
        const jsonString = firstRow.JsonResult;

        if (jsonString) {
          return JSON.parse(jsonString);
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching project details:`, error);
      throw error;
    }
  }

  /**
   * Update event RSVP settings (Include_In_RSVP, capacity modifier)
   * Now updates Events table directly instead of Project_Events
   */
  public async updateProjectEvent(
    data: UpdateProjectEvent,
    userId?: number
  ): Promise<ProjectEvent> {
    try {
      // Map Project_Event_ID to Event_ID for the update
      const updateData = {
        Event_ID: data.Project_Event_ID, // Project_Event_ID is now just Event_ID
        Include_In_RSVP: data.Include_In_RSVP,
        RSVP_Capacity_Modifier: data.RSVP_Capacity_Modifier,
      };

      const options = userId ? { $userId: userId } : {};
      const result = await this.tableService.updateTableRecords<any>(
        "Events",
        [updateData],
        options
      );

      // Map response back to ProjectEvent shape for compatibility
      return {
        Project_Event_ID: result[0].Event_ID,
        Project_ID: result[0].Project_ID,
        Event_ID: result[0].Event_ID,
        Include_In_RSVP: result[0].Include_In_RSVP,
        RSVP_Capacity_Modifier: result[0].RSVP_Capacity_Modifier,
      };
    } catch (error) {
      console.error("Error updating project event:", error);
      throw error;
    }
  }

  // =====================================================
  // RSVP Submissions Operations
  // =====================================================

  /**
   * Get all RSVP submissions for a project (using Event_Participants)
   */
  public async getProjectRSVPs(projectId: number): Promise<ProjectRSVP[]> {
    try {
      // Get all event IDs for this project
      const eventIds = await this.getEventIdsForProject(projectId);

      if (eventIds.length === 0) {
        return [];
      }

      // Get all participants for these events
      // Join to Contacts table to get contact information
      const participants = await this.tableService.getTableRecords<any>(
        "Event_Participants",
        {
          $select: `
            Event_Participant_ID,
            Event_Participants.Event_ID,
            Event_Participants.Participant_ID,
            Participation_Status_ID,
            Participant_Start_Date,
            Participant_ID_Table.First_Name,
            Participant_ID_Table.Last_Name,
            Participant_ID_Table.Email_Address,
            Participant_ID_Table.Mobile_Phone,
            Event_ID_Table.Event_Title,
            Event_ID_Table.Event_Start_Date,
            Event_ID_Table.Project_ID,
            Event_ID_Table_Congregation_ID_Table.Congregation_Name
          `,
          $filter: `Event_Participants.Event_ID IN (${eventIds.join(",")}) AND Participation_Status_ID = 2`,
          $orderby: "Participant_Start_Date DESC",
        }
      );

      return participants.map((p: any) => ({
        Event_RSVP_ID: p.Event_Participant_ID, // Map to Event_Participant_ID for compatibility
        Event_ID: p.Event_ID,
        Contact_ID: p.Participant_ID,
        First_Name: p.Participant_ID_Table?.First_Name || "",
        Last_Name: p.Participant_ID_Table?.Last_Name || "",
        Email_Address: p.Participant_ID_Table?.Email_Address || null,
        Phone_Number: p.Participant_ID_Table?.Mobile_Phone || null,
        Party_Size: 1, // Default to 1 per participant
        Is_New_Visitor: false, // Event_Participants doesn't track guest status
        RSVP_Date: p.Participation_Start_Date || new Date().toISOString(),
        Event_Title: p.Event_ID_Table?.Event_Title || null,
        Event_Start_Date: p.Event_ID_Table?.Event_Start_Date || null,
        Campus_Name: p.Event_ID_Table_Congregation_ID_Table?.Congregation_Name || null,
      }));
    } catch (error) {
      console.error(`Error fetching RSVPs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get RSVPs for a specific event (using Event_Participants)
   */
  public async getEventRSVPs(eventId: number): Promise<ProjectRSVP[]> {
    try {
      const participants = await this.tableService.getTableRecords<any>(
        "Event_Participants",
        {
          $select: `
            Event_Participant_ID,
            Event_Participants.Event_ID,
            Event_Participants.Participant_ID,
            Participation_Status_ID,
            Participant_Start_Date,
            Participant_ID_Table.First_Name,
            Participant_ID_Table.Last_Name,
            Participant_ID_Table.Email_Address,
            Participant_ID_Table.Mobile_Phone,
            Event_ID_Table.Event_Title,
            Event_ID_Table.Event_Start_Date,
            Event_ID_Table.Project_ID,
            Event_ID_Table_Congregation_ID_Table.Congregation_Name
          `,
          $filter: `Event_Participants.Event_ID = ${eventId} AND Participation_Status_ID = 2`,
          $orderby: "Participant_Start_Date DESC",
        }
      );

      return participants.map((p: any) => ({
        Event_RSVP_ID: p.Event_Participant_ID, // Map to Event_Participant_ID for compatibility
        Event_ID: p.Event_ID,
        Contact_ID: p.Participant_ID,
        First_Name: p.Participant_ID_Table?.First_Name || "",
        Last_Name: p.Participant_ID_Table?.Last_Name || "",
        Email_Address: p.Participant_ID_Table?.Email_Address || null,
        Phone_Number: p.Participant_ID_Table?.Mobile_Phone || null,
        Party_Size: 1, // Default to 1 per participant
        Is_New_Visitor: false, // Event_Participants doesn't track guest status
        RSVP_Date: p.Participation_Start_Date || new Date().toISOString(),
        Event_Title: p.Event_ID_Table?.Event_Title || null,
        Event_Start_Date: p.Event_ID_Table?.Event_Start_Date || null,
        Campus_Name: p.Event_ID_Table_Congregation_ID_Table?.Congregation_Name || null,
      }));
    } catch (error) {
      console.error(`Error fetching RSVPs for event ${eventId}:`, error);
      throw error;
    }
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Get all event IDs for a project (where Include_In_RSVP = true)
   * Now queries Events table directly
   */
  private async getEventIdsForProject(projectId: number): Promise<number[]> {
    try {
      const result = await this.tableService.getTableRecords<{
        Event_ID: number;
      }>("Events", {
        $filter: `Project_ID = ${projectId} AND Include_In_RSVP = 1`,
        $select: "Event_ID",
      });

      return result.map((r) => r.Event_ID);
    } catch (error) {
      console.error(`Error fetching event IDs for project ${projectId}:`, error);
      return [];
    }
  }
}

/**
 * Get singleton instance of Project RSVP service
 */
export async function getProjectRSVPService(): Promise<ProjectRSVPService> {
  return ProjectRSVPService.getInstance();
}
