-- ===================================================================
-- Update: Add Amenities to api_Custom_RSVP_Project_Details_JSON
-- ===================================================================
-- Adds Amenities_JSON to Events output in the stored procedure
-- Date: 2025-12-12
-- ===================================================================

USE [MinistryPlatform]
GO

-- Drop existing procedure
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

    -- Get project info (campus-agnostic data)
    DECLARE @ProjectJson NVARCHAR(MAX);
    SELECT @ProjectJson = (
        SELECT TOP 1
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
            p.RSVP_Require_Contact_Lookup,
            p.RSVP_Allow_Guest_Submission,
            p.RSVP_Primary_Color,
            p.RSVP_Secondary_Color,
            p.RSVP_Accent_Color,
            p.RSVP_Background_Color,
            p.RSVP_Confirmation_Email_Template_ID,
            p.RSVP_Reminder_Email_Template_ID,
            p.RSVP_Days_To_Remind,
            p.RSVP_URL,
            p.Form_ID,
            -- Build RSVP_BG_Image_URL from dp_files
            RSVP_BG_Image_URL = CASE
                WHEN BG.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', BG.Unique_Name, '.', BG.Extension)
                ELSE NULL
            END,
            -- Build RSVP_Image_URL from dp_files
            RSVP_Image_URL = CASE
                WHEN IMG.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', IMG.Unique_Name, '.', IMG.Extension)
                ELSE NULL
            END
        FROM Projects p
        LEFT JOIN Project_Types pt ON p.Project_Type_ID = pt.Project_Type_ID
        -- Join to dp_files to get RSVP_BG_Image.jpg file
        LEFT OUTER JOIN dp_files BG ON BG.Record_ID = p.Project_ID
            AND BG.Table_Name = 'Projects'
            AND BG.File_Name = 'RSVP_BG_Image.jpg'
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
        WHERE p.Project_ID = @Project_ID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
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
            cong.Congregation_Name AS Campus_Name,
            -- Form answers from Answer_Summary field
            ep.Answer_Summary
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

    -- Build campus-centric data structure
    DECLARE @CampusesJson NVARCHAR(MAX);
    SELECT @CampusesJson = (
        SELECT
            pc.Congregation_ID,
            c.Congregation_Name AS Campus_Name,
            c.Campus_Slug,
            pc.Public_Event_ID,
            pe.Event_Title AS Public_Event_Title,
            pe.Meeting_Instructions,
            -- Build Public Event Image URL from dp_files
            Public_Event_Image_URL = CASE
                WHEN PEI.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', PEI.Unique_Name, '.', PEI.Extension)
                ELSE NULL
            END,
            pc.Is_Active,
            pc.Display_Order,
            -- Events for this campus
            (SELECT
                e.Event_ID,
                e.Project_ID,
                e.Event_Title,
                e.Event_Start_Date,
                e.Event_End_Date,
                e.Include_In_RSVP,
                e.RSVP_Capacity_Modifier,
                e.Congregation_ID,
                c2.Congregation_Name,
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
                END AS Available_Capacity,
                -- **NEW: Event Amenities (childcare, ASL, etc.)**
                (SELECT
                    a.Amenity_ID,
                    a.Amenity_Name,
                    a.Amenity_Description,
                    a.Icon_Name,
                    a.Icon_Color,
                    a.Display_Order
                FROM Event_Amenities ea
                INNER JOIN Amenities a ON ea.Amenity_ID = a.Amenity_ID
                WHERE ea.Event_ID = e.Event_ID
                  AND a.Is_Active = 1
                ORDER BY a.Display_Order
                FOR JSON PATH) AS Amenities
            FROM Events e
            LEFT JOIN Congregations c2 ON e.Congregation_ID = c2.Congregation_ID
            LEFT JOIN Event_Types et ON e.Event_Type_ID = et.Event_Type_ID
            WHERE e.Project_ID = @Project_ID
              AND e.Include_In_RSVP = 1
              AND e.Congregation_ID = pc.Congregation_ID
            ORDER BY e.Event_Start_Date ASC
            FOR JSON PATH) AS Events,
            -- Confirmation Cards for this campus (includes both campus-specific and global cards)
            (SELECT
                pcc.Project_Confirmation_Card_ID AS Card_ID,
                ct.Card_Type_ID,
                ct.Card_Type_Name,
                ct.Component_Name,
                ct.Icon_Name,
                pcc.Display_Order,
                pcc.Congregation_ID,
                c3.Congregation_Name AS Campus_Name,
                -- Indicate if this is a global (all campuses) card
                CASE WHEN pcc.Congregation_ID IS NULL OR pcc.Congregation_ID = 1 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS Is_Global,
                -- Parse JSON configuration or use default
                ISNULL(
                    TRY_CAST(pcc.Card_Configuration AS NVARCHAR(MAX)),
                    ct.Default_Configuration
                ) AS Configuration
            FROM Project_Confirmation_Cards pcc
            INNER JOIN Card_Types ct ON pcc.Card_Type_ID = ct.Card_Type_ID
            LEFT JOIN Congregations c3 ON pcc.Congregation_ID = c3.Congregation_ID
            WHERE pcc.Project_ID = @Project_ID
              AND pcc.Is_Active = 1
              AND (pcc.Congregation_ID = pc.Congregation_ID OR pcc.Congregation_ID IS NULL OR pcc.Congregation_ID = 1)
            ORDER BY pcc.Display_Order ASC
            FOR JSON PATH) AS Confirmation_Cards,
            -- Carousels for this campus (events grouped by RSVP_Carousel_Name)
            (SELECT DISTINCT
                e.RSVP_Carousel_Name AS Carousel_Name,
                -- Events in this carousel for this campus
                (SELECT
                    e2.Event_ID,
                    e2.Event_Title,
                    e2.Event_Start_Date,
                    e2.Event_End_Date,
                    e2.Meeting_Instructions,
                    e2.RSVP_Carousel_Name,
                    e2.Congregation_ID,
                    c4.Congregation_Name,
                    et2.Event_Type,
                    -- Build Event Image URL from dp_files
                    Event_Image_URL = CASE
                        WHEN EI.File_ID IS NOT NULL AND CS2.Value IS NOT NULL AND D2.Domain_GUID IS NOT NULL
                        THEN CONCAT(CS2.Value, '?dn=', CONVERT(varchar(40), D2.Domain_GUID), '&fn=', EI.Unique_Name, '.', EI.Extension)
                        ELSE NULL
                    END
                FROM Events e2
                LEFT JOIN Congregations c4 ON e2.Congregation_ID = c4.Congregation_ID
                LEFT JOIN Event_Types et2 ON e2.Event_Type_ID = et2.Event_Type_ID
                -- Join to dp_files to get Event default image
                LEFT OUTER JOIN dp_files EI ON EI.Record_ID = e2.Event_ID
                    AND EI.Table_Name = 'Events'
                    AND EI.Default_Image = 1
                -- Join to get ImageURL configuration setting
                LEFT OUTER JOIN dp_Configuration_Settings CS2
                    ON CS2.Domain_ID = COALESCE(e2.Domain_ID, 1)
                    AND CS2.Key_Name = 'ImageURL'
                    AND CS2.Application_Code = 'Common'
                -- Join to get Domain GUID
                LEFT OUTER JOIN dp_Domains D2
                    ON D2.Domain_ID = COALESCE(e2.Domain_ID, 1)
                WHERE e2.RSVP_Carousel_Name = e.RSVP_Carousel_Name
                  AND e2.Project_ID = @Project_ID
                  AND e2.Congregation_ID = pc.Congregation_ID
                ORDER BY e2.Event_Start_Date ASC
                FOR JSON PATH) AS Events
            FROM Events e
            WHERE e.Project_ID = @Project_ID
              AND e.RSVP_Carousel_Name IS NOT NULL
              AND e.RSVP_Carousel_Name <> ''
              AND e.Congregation_ID = pc.Congregation_ID
            FOR JSON PATH) AS Carousels
        FROM Project_Campuses pc
        INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
        LEFT JOIN Events pe ON pc.Public_Event_ID = pe.Event_ID
        -- Join to dp_files to get Public Event default image
        LEFT OUTER JOIN dp_files PEI ON PEI.Record_ID = pe.Event_ID
            AND PEI.Table_Name = 'Events'
            AND PEI.Default_Image = 1
        -- Join to get ImageURL configuration setting
        LEFT OUTER JOIN dp_Configuration_Settings CS
            ON CS.Domain_ID = COALESCE(pe.Domain_ID, 1)
            AND CS.Key_Name = 'ImageURL'
            AND CS.Application_Code = 'Common'
        -- Join to get Domain GUID
        LEFT OUTER JOIN dp_Domains D
            ON D.Domain_ID = COALESCE(pe.Domain_ID, 1)
        WHERE pc.Project_ID = @Project_ID
          AND pc.Is_Active = 1
        ORDER BY pc.Display_Order ASC, c.Congregation_Name ASC
        FOR JSON PATH
    );

    -- Build final response
    DECLARE @Result NVARCHAR(MAX);
    SET @Result = N'{' +
        N'"Project":' + ISNULL(@ProjectJson, 'null') + N',' +
        N'"Campuses":' + ISNULL(@CampusesJson, '[]') + N',' +
        N'"RSVPs":' + ISNULL(@RSVPsJson, '[]') +
    N'}';

    SELECT @Result AS JsonResult;
END
GO

-- ===================================================================
-- Grant API Access
-- ===================================================================
-- GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Details_JSON] TO [apiuser];

PRINT 'Updated stored procedure: api_Custom_RSVP_Project_Details_JSON';
PRINT 'Added Amenities to Events output';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
PRINT 'GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Details_JSON] TO [apiuser];';
GO
