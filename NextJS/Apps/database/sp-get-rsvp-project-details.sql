-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Project_Details_JSON
-- ===================================================================
-- Returns complete project details with events and RSVPs
-- For use in the RSVP Management app detail page
-- Uses Event_Participants table (no Event_RSVPs)
-- ===================================================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Project_Details_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Project_Details_JSON];
GO

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

    -- Build final response
    DECLARE @Result NVARCHAR(MAX);
    SET @Result = N'{' +
        N'"Project":' + ISNULL(@ProjectJson, 'null') + N',' +
        N'"Events":' + ISNULL(@EventsJson, '[]') + N',' +
        N'"RSVPs":' + ISNULL(@RSVPsJson, '[]') +
    N'}';

    SELECT @Result AS JsonResult;
END
GO

-- ===================================================================
-- Grant API Access
-- ===================================================================
-- GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Details_JSON] TO [apiuser];

PRINT 'Created stored procedure: api_Custom_RSVP_Project_Details_JSON';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
PRINT 'GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Details_JSON] TO [apiuser];';
GO

-- ===================================================================
-- Test Query (Uncomment to test)
-- ===================================================================
/*
-- Test with Project_ID
EXEC api_Custom_RSVP_Project_Details_JSON @Project_ID = 1;

-- Test with slug
EXEC api_Custom_RSVP_Project_Details_JSON @RSVP_Slug = 'christmas-2025';
*/
