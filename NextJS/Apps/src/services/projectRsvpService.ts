import { MinistryPlatformClient } from "@/providers/MinistryPlatform/core/ministryPlatformClient";
import { TableService } from "@/providers/MinistryPlatform/services/tableService";
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

  private constructor(mp: MinistryPlatformClient) {
    this.mp = mp;
    this.tableService = new TableService(mp);
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
   */
  public async getActiveRSVPProjects(): Promise<RSVPProjectList[]> {
    try {
      // Get projects where RSVP_Is_Active = true
      const projects = await this.tableService.getTableRecords<any>(
        "Projects",
        {
          $select: `
            Project_ID,
            Project_Title,
            RSVP_Title,
            RSVP_Description,
            RSVP_Start_Date,
            RSVP_End_Date,
            RSVP_Is_Active,
            RSVP_Slug
          `,
          $filter: "RSVP_Is_Active = 1",
          $orderby: "RSVP_Start_Date DESC",
        }
      );

      // For each project, count events and RSVPs
      const projectsWithCounts = await Promise.all(
        projects.map(async (project) => {
          // Count project events (now from Events table)
          const events = await this.tableService.getTableRecords<any>(
            "Events",
            {
              $filter: `Project_ID = ${project.Project_ID} AND Include_In_RSVP = 1`,
              $select: "Event_ID",
            }
          );

          // Count RSVPs across all events in this project
          const eventIds = await this.getEventIdsForProject(project.Project_ID);
          let rsvpCount = 0;

          if (eventIds.length > 0) {
            const rsvps = await this.tableService.getTableRecords<any>(
              "Event_RSVPs",
              {
                $filter: `Event_ID IN (${eventIds.join(",")})`,
                $select: "Event_RSVP_ID",
              }
            );
            rsvpCount = rsvps.length;
          }

          return {
            ...project,
            Event_Count: events.length,
            RSVP_Count: rsvpCount,
          };
        })
      );

      return projectsWithCounts;
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
  public async updateProject(data: UpdateProject): Promise<Project> {
    try {
      const result = await this.tableService.updateTableRecords<Project>(
        "Projects",
        [data as Project]
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
   * Get all events for a project with RSVP details
   */
  public async getProjectEvents(
    projectId: number
  ): Promise<ProjectEventWithDetails[]> {
    try {
      // Query Events table directly (now has Project_ID field)
      const result = await this.tableService.getTableRecords<any>(
        "Events",
        {
          $select: `
            Event_ID,
            Project_ID,
            Include_In_RSVP,
            RSVP_Capacity_Modifier,
            Event_Title,
            Event_Start_Date,
            Event_End_Date,
            Congregation_ID_Table.Congregation_Name,
            Congregation_ID,
            Event_Type_ID_Table.Event_Type
          `,
          $filter: `Project_ID = ${projectId}`,
          $orderby: "Event_Start_Date",
        }
      );

      // Get RSVP counts for each event
      const eventsWithStats = await Promise.all(
        result.map(async (event: any) => {
          const rsvps = await this.tableService.getTableRecords<any>(
            "Event_RSVPs",
            {
              $filter: `Event_ID = ${event.Event_ID}`,
              $select: "Event_RSVP_ID",
            }
          );

          const rsvpCount = rsvps.length;
          // TODO: Add totalAttendees calculation once Party_Size field name is confirmed
          const totalAttendees = rsvpCount; // Fallback: assume 1 person per RSVP

          return {
            Project_Event_ID: event.Event_ID, // Use Event_ID since Project_Event_ID no longer exists
            Project_ID: event.Project_ID,
            Event_ID: event.Event_ID,
            Include_In_RSVP: event.Include_In_RSVP,
            RSVP_Capacity_Modifier: event.RSVP_Capacity_Modifier,
            Event_Title: event.Event_Title || "",
            Event_Start_Date: event.Event_Start_Date,
            Event_End_Date: event.Event_End_Date,
            Congregation_Name: event.Congregation_ID_Table?.Congregation_Name || null,
            Congregation_ID: event.Congregation_ID || null,
            Event_Type: event.Event_Type_ID_Table?.Event_Type || null,
            RSVP_Count: rsvpCount,
            Total_Attendees: totalAttendees,
            Capacity: null, // Would come from Event table or calculation
            Available_Capacity: null,
          };
        })
      );

      return eventsWithStats;
    } catch (error) {
      console.error(`Error fetching events for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Update event RSVP settings (Include_In_RSVP, capacity modifier)
   * Now updates Events table directly instead of Project_Events
   */
  public async updateProjectEvent(
    data: UpdateProjectEvent
  ): Promise<ProjectEvent> {
    try {
      // Map Project_Event_ID to Event_ID for the update
      const updateData = {
        Event_ID: data.Project_Event_ID, // Project_Event_ID is now just Event_ID
        Include_In_RSVP: data.Include_In_RSVP,
        RSVP_Capacity_Modifier: data.RSVP_Capacity_Modifier,
      };

      const result = await this.tableService.updateTableRecords<any>(
        "Events",
        [updateData]
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
   * Get all RSVP submissions for a project
   */
  public async getProjectRSVPs(projectId: number): Promise<ProjectRSVP[]> {
    try {
      // Get all event IDs for this project
      const eventIds = await this.getEventIdsForProject(projectId);

      if (eventIds.length === 0) {
        return [];
      }

      // Get all RSVPs for these events
      // TODO: Update field names once Event_RSVPs table structure is confirmed
      const rsvps = await this.tableService.getTableRecords<any>(
        "Event_RSVPs",
        {
          $select: `
            Event_RSVP_ID,
            Event_RSVPs.Event_ID,
            First_Name,
            Last_Name,
            Event_ID_Table.Event_Title,
            Event_ID_Table.Event_Start_Date,
            Event_ID_Table_Congregation_ID_Table.Congregation_Name
          `,
          $filter: `Event_RSVPs.Event_ID IN (${eventIds.join(",")})`,
        }
      );

      return rsvps.map((r: any) => ({
        Event_RSVP_ID: r.Event_RSVP_ID,
        Event_ID: r.Event_ID,
        Contact_ID: null, // TODO: Add once field name is confirmed
        First_Name: r.First_Name || "",
        Last_Name: r.Last_Name || "",
        Email_Address: null, // TODO: Add once field name is confirmed
        Phone_Number: null, // TODO: Add once field name is confirmed
        Party_Size: 1,
        Is_New_Visitor: null, // TODO: Add once field name is confirmed
        RSVP_Date: new Date().toISOString(), // TODO: Add once field name is confirmed
        Event_Title: r.Event_ID_Table?.Event_Title || null,
        Event_Start_Date: r.Event_ID_Table?.Event_Start_Date || null,
        Campus_Name: r.Event_ID_Table_Congregation_ID_Table?.Congregation_Name || null,
      }));
    } catch (error) {
      console.error(`Error fetching RSVPs for project ${projectId}:`, error);
      throw error;
    }
  }

  /**
   * Get RSVPs for a specific event
   */
  public async getEventRSVPs(eventId: number): Promise<ProjectRSVP[]> {
    try {
      // TODO: Update field names once Event_RSVPs table structure is confirmed
      const rsvps = await this.tableService.getTableRecords<any>(
        "Event_RSVPs",
        {
          $select: `
            Event_RSVP_ID,
            Event_RSVPs.Event_ID,
            First_Name,
            Last_Name,
            Event_ID_Table.Event_Title,
            Event_ID_Table.Event_Start_Date,
            Event_ID_Table_Congregation_ID_Table.Congregation_Name
          `,
          $filter: `Event_RSVPs.Event_ID = ${eventId}`,
        }
      );

      return rsvps.map((r: any) => ({
        Event_RSVP_ID: r.Event_RSVP_ID,
        Event_ID: r.Event_ID,
        Contact_ID: null, // TODO: Add once field name is confirmed
        First_Name: r.First_Name || "",
        Last_Name: r.Last_Name || "",
        Email_Address: null, // TODO: Add once field name is confirmed
        Phone_Number: null, // TODO: Add once field name is confirmed
        Party_Size: 1,
        Is_New_Visitor: null, // TODO: Add once field name is confirmed
        RSVP_Date: new Date().toISOString(), // TODO: Add once field name is confirmed
        Event_Title: r.Event_ID_Table?.Event_Title || null,
        Event_Start_Date: r.Event_ID_Table?.Event_Start_Date || null,
        Campus_Name: r.Event_ID_Table_Congregation_ID_Table?.Congregation_Name || null,
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
