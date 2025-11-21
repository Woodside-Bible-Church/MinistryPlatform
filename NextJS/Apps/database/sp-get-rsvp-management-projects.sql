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
            p.Project_Type_ID,
            pt.Project_Type,
            p.RSVP_Title,
            p.RSVP_Description,
            p.RSVP_Start_Date,
            p.RSVP_End_Date,
            p.RSVP_Is_Active,
            p.RSVP_Slug,
            -- Build RSVP_Image_URL from dp_files
            RSVP_Image_URL = CASE
                WHEN IMG.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', IMG.Unique_Name, '.', IMG.Extension)
                ELSE NULL
            END,
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
        LEFT JOIN Project_Types pt ON p.Project_Type_ID = pt.Project_Type_ID
        -- Join to dp_files to get RSVP_Image.jpg file
        LEFT OUTER JOIN dp_files IMG ON IMG.Record_ID = p.Project_ID
            AND IMG.Table_Name = 'Projects'
            AND IMG.File_Name = 'RSVP_Image.jpg'
        -- Join to get ImageURL configuration setting
        LEFT OUTER JOIN dp_Configuration_Settings CS
            ON CS.Domain_ID = COALESCE(p.Domain_ID, 1)
            AND CS.Key_Name = 'ImageURL'
            AND CS.Application_Code = 'Common'
        -- Join to get Domain GUID
        LEFT OUTER JOIN dp_Domains D
            ON D.Domain_ID = COALESCE(p.Domain_ID, 1)
        WHERE p.RSVP_Is_Active = 1
        ORDER BY
            CASE WHEN p.RSVP_Start_Date IS NULL THEN 1 ELSE 0 END, -- Nulls last
            p.RSVP_Start_Date DESC
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
