-- ===================================================================
-- Migration: Add Project_Campuses and Confirmation_Cards to api_Custom_RSVP_Project_Details_JSON
-- ===================================================================
-- Date: 2025-11-20
-- Description: Adds Project_Campuses and Confirmation_Cards data to the stored procedure
--              so the RSVP Management app can display and edit
--              campus-specific public events, meeting instructions, and confirmation cards
-- ===================================================================

USE [MinistryPlatform]
GO

-- Drop existing procedure
IF OBJECT_ID('[dbo].[api_Custom_RSVP_Project_Details_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Project_Details_JSON];
GO

-- Create updated procedure
CREATE PROCEDURE [dbo].[api_Custom_RSVP_Project_Details_JSON]
    @Project_ID INT = NULL,
    @RSVP_Slug NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Resolve slug to Project_ID if provided
    IF @RSVP_Slug IS NOT NULL AND @Project_ID IS NULL
    BEGIN
        SELECT @Project_ID = Project_ID
        FROM Projects
        WHERE RSVP_Slug = @RSVP_Slug;
    END

    -- Validate Project_ID
    IF @Project_ID IS NULL
    BEGIN
        SELECT 'error' AS status, 'Project not found' AS message
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
        RETURN;
    END

    -- Get project info
    DECLARE @ProjectJson NVARCHAR(MAX);
    SELECT @ProjectJson = (
        SELECT TOP 1
            Project_ID,
            Project_Title,
            RSVP_Title,
            RSVP_Description,
            RSVP_Start_Date,
            RSVP_End_Date,
            RSVP_Is_Active,
            RSVP_Slug
        FROM Projects
        WHERE Project_ID = @Project_ID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- Get events for this project with RSVP counts and capacity
    DECLARE @EventsJson NVARCHAR(MAX);
    SELECT @EventsJson = (
        SELECT
            e.Event_ID,
            e.Project_ID,
            e.Event_Title,
            e.Event_Start_Date,
            e.Event_End_Date,
            e.Include_In_RSVP,
            e.RSVP_Capacity_Modifier,
            e.Congregation_ID,
            c.Congregation_Name,
            et.Event_Type,
            -- Count RSVPs for this event (unique participants)
            (SELECT COUNT(*)
             FROM Event_Participants ep
             WHERE ep.Event_ID = e.Event_ID
               AND ep.Participation_Status_ID = 2) AS RSVP_Count,
            -- Sum party sizes from RSVP_Party_Size field
            (SELECT ISNULL(SUM(ISNULL(ep.RSVP_Party_Size, 1)), 0)
             FROM Event_Participants ep
             WHERE ep.Event_ID = e.Event_ID
               AND ep.Participation_Status_ID = 2) AS Total_Attendees,
            -- Event capacity from RSVP_Capacity field
            e.RSVP_Capacity AS Capacity,
            -- Available capacity calculation (modifier is subtracted as it represents fake RSVPs)
            CASE
                WHEN e.RSVP_Capacity IS NOT NULL THEN
                    e.RSVP_Capacity -
                    ((SELECT ISNULL(SUM(ISNULL(ep.RSVP_Party_Size, 1)), 0)
                      FROM Event_Participants ep
                      WHERE ep.Event_ID = e.Event_ID
                        AND ep.Participation_Status_ID = 2) +
                     ISNULL(e.RSVP_Capacity_Modifier, 0))
                ELSE NULL
            END AS Available_Capacity
        FROM Events e
        LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
        LEFT JOIN Event_Types et ON e.Event_Type_ID = et.Event_Type_ID
        WHERE e.Project_ID = @Project_ID
          AND e.Include_In_RSVP = 1
        ORDER BY e.Event_Start_Date ASC
        FOR JSON PATH
    );

    -- Get all RSVPs for this project (from Event_Participants)
    -- Join to Contacts table to get full contact information
    DECLARE @RSVPsJson NVARCHAR(MAX);
    SELECT @RSVPsJson = (
        SELECT
            ep.Event_Participant_ID AS Event_RSVP_ID,
            ep.Event_ID,
            e.Project_ID,
            c.Contact_ID,
            c.First_Name,
            c.Last_Name,
            c.Email_Address,
            c.Mobile_Phone AS Phone_Number,
            ep._Setup_Date AS RSVP_Date,
            CAST(0 AS BIT) AS Is_New_Visitor,
            -- Get party size from RSVP_Party_Size field (default to 1 if null)
            ISNULL(ep.RSVP_Party_Size, 1) AS Party_Size,
            -- Event details
            e.Event_Title,
            e.Event_Start_Date,
            -- Campus details
            cong.Congregation_Name AS Campus_Name
        FROM Event_Participants ep
        INNER JOIN Events e ON ep.Event_ID = e.Event_ID
        INNER JOIN Contacts c ON ep.Participant_ID = c.Participant_Record
        LEFT JOIN Congregations cong ON e.Congregation_ID = cong.Congregation_ID
        WHERE e.Project_ID = @Project_ID
          AND e.Include_In_RSVP = 1
          AND ep.Participation_Status_ID = 2
        ORDER BY ep._Setup_Date DESC
        FOR JSON PATH
    );

    -- Get Project_Campuses data with Public Event details
    DECLARE @ProjectCampusesJson NVARCHAR(MAX);
    SELECT @ProjectCampusesJson = (
        SELECT
            pc.Project_Campus_ID,
            pc.Congregation_ID,
            c.Congregation_Name AS Campus_Name,
            pc.Public_Event_ID,
            e.Event_Title AS Public_Event_Title,
            e.Meeting_Instructions,
            pc.Is_Active,
            pc.Display_Order
        FROM Project_Campuses pc
        INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
        LEFT JOIN Events e ON pc.Public_Event_ID = e.Event_ID
        WHERE pc.Project_ID = @Project_ID
        ORDER BY c.Congregation_Name ASC
        FOR JSON PATH
    );

    -- Get Confirmation Cards (all cards - both global and campus-specific)
    DECLARE @ConfirmationCardsJson NVARCHAR(MAX);
    SELECT @ConfirmationCardsJson = (
        SELECT
            pcc.Project_Confirmation_Card_ID AS Card_ID,
            ct.Card_Type_ID,
            ct.Card_Type_Name,
            ct.Component_Name,
            ct.Icon_Name,
            pcc.Display_Order,
            pcc.Congregation_ID,
            c.Congregation_Name AS Campus_Name,
            -- Indicate if this is a global (all campuses) card
            CASE WHEN pcc.Congregation_ID IS NULL OR pcc.Congregation_ID = 1 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS Is_Global,
            -- Parse JSON configuration or use default
            ISNULL(
                TRY_CAST(pcc.Card_Configuration AS NVARCHAR(MAX)),
                ct.Default_Configuration
            ) AS Configuration
        FROM Project_Confirmation_Cards pcc
        INNER JOIN Card_Types ct ON pcc.Card_Type_ID = ct.Card_Type_ID
        LEFT JOIN Congregations c ON pcc.Congregation_ID = c.Congregation_ID
        WHERE pcc.Project_ID = @Project_ID
          AND pcc.Is_Active = 1
        ORDER BY pcc.Display_Order ASC
        FOR JSON PATH
    );

    -- Build final response
    DECLARE @Result NVARCHAR(MAX);
    SET @Result = N'{' +
        N'"Project":' + ISNULL(@ProjectJson, 'null') + N',' +
        N'"Events":' + ISNULL(@EventsJson, '[]') + N',' +
        N'"RSVPs":' + ISNULL(@RSVPsJson, '[]') + N',' +
        N'"Project_Campuses":' + ISNULL(@ProjectCampusesJson, '[]') + N',' +
        N'"Confirmation_Cards":' + ISNULL(@ConfirmationCardsJson, '[]') +
    N'}';

    SELECT @Result AS JsonResult;
END
GO

PRINT 'Updated stored procedure: api_Custom_RSVP_Project_Details_JSON';
PRINT 'Added Project_Campuses and Confirmation_Cards data to response';
GO
