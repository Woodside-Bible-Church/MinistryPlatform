-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Management_Projects_JSON
-- ===================================================================
-- Returns all active RSVP projects with event counts and RSVP counts
-- For use in the RSVP Management app
-- ===================================================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Management_Projects_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Management_Projects_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Management_Projects_JSON]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT (
        SELECT
            p.Project_ID,
            p.Project_Title,
            p.RSVP_Title,
            p.RSVP_Description,
            p.RSVP_Start_Date,
            p.RSVP_End_Date,
            p.RSVP_Is_Active,
            p.RSVP_Slug,
            -- Count events for this project
            (SELECT COUNT(*)
             FROM Events e
             WHERE e.Project_ID = p.Project_ID
               AND e.Include_In_RSVP = 1) AS Event_Count,
            -- Count RSVPs for this project (using Event_Participants)
            (SELECT COUNT(DISTINCT ep.Participant_ID)
             FROM Event_Participants ep
             INNER JOIN Events e ON ep.Event_ID = e.Event_ID
             WHERE e.Project_ID = p.Project_ID
               AND e.Include_In_RSVP = 1
               AND ep.Participation_Status_ID = 2) AS RSVP_Count
        FROM Projects p
        WHERE p.RSVP_Is_Active = 1
        ORDER BY p.RSVP_Start_Date DESC
        FOR JSON PATH
    ) AS JsonResult;
END
GO

-- ===================================================================
-- Grant API Access
-- ===================================================================
-- GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Management_Projects_JSON] TO [apiuser];

PRINT 'Created stored procedure: api_Custom_RSVP_Management_Projects_JSON';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
PRINT 'GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Management_Projects_JSON] TO [apiuser];';
GO

-- ===================================================================
-- Test Query (Uncomment to test)
-- ===================================================================
/*
EXEC api_Custom_RSVP_Management_Projects_JSON;
*/
