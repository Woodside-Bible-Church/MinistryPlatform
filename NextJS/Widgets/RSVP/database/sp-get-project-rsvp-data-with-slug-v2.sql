-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Project_Data_JSON (v2 - Native MP Tables)
-- ===================================================================
-- Fetches all data needed to render the RSVP widget
-- Returns nested JSON with project, events, form fields, and cards
-- NOW USES: Projects table, Forms/Form_Fields (native MP)
-- ALWAYS INCLUDES: Implicit "How many people?" counter question
-- ===================================================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Project_Data_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Project_Data_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Project_Data_JSON]
    @Project_ID INT = NULL,  -- Can be NULL if @RSVP_Slug is provided
    @RSVP_Slug NVARCHAR(100) = NULL,  -- Optional: lookup by slug instead of ID
    @Congregation_ID INT = NULL,  -- Optional: filter events by campus ID
    @Campus_Slug NVARCHAR(50) = NULL  -- Optional: filter events by campus slug
AS
BEGIN
    SET NOCOUNT ON;

    -- ===================================================================
    -- Resolve RSVP_Slug to Project_ID if slug is provided
    -- ===================================================================
    IF @RSVP_Slug IS NOT NULL AND @Project_ID IS NULL
    BEGIN
        SELECT @Project_ID = Project_ID
        FROM Projects
        WHERE RSVP_Slug = @RSVP_Slug AND RSVP_Is_Active = 1;

        IF @Project_ID IS NULL
        BEGIN
            SELECT 'error' AS status, 'Project RSVP not found with slug: ' + @RSVP_Slug AS message
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
            RETURN;
        END
    END

    -- Validate that we have a Project_ID at this point
    IF @Project_ID IS NULL
    BEGIN
        SELECT 'error' AS status, 'Either Project_ID or RSVP_Slug must be provided' AS message
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
        RETURN;
    END

    -- ===================================================================
    -- Resolve Campus_Slug to Congregation_ID if provided
    -- ===================================================================
    IF @Campus_Slug IS NOT NULL AND @Congregation_ID IS NULL
    BEGIN
        SELECT @Congregation_ID = Congregation_ID
        FROM Congregations
        WHERE Campus_Slug = @Campus_Slug;
    END

    -- ===================================================================
    -- Get Project Configuration (from Projects table)
    -- ===================================================================
    DECLARE @ProjectJson NVARCHAR(MAX);

    SELECT @ProjectJson = (
        SELECT TOP 1
            p.Project_ID,
            p.RSVP_Title,
            p.RSVP_Description,
            p.RSVP_Start_Date AS Start_Date,
            p.RSVP_End_Date AS End_Date,
            p.RSVP_Is_Active AS Is_Active,
            p.RSVP_Require_Contact_Lookup AS Require_Contact_Lookup,
            p.RSVP_Allow_Guest_Submission AS Allow_Guest_Submission,
            p.RSVP_Slug,
            p.RSVP_Primary_Color,
            p.RSVP_Secondary_Color,
            p.RSVP_Accent_Color,
            p.RSVP_Background_Color,
            p.Form_ID,  -- Link to optional additional questions form
            -- Get background image from dp_Files
            RSVP_BG_Image_URL = CASE
                WHEN F_BG.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', F_BG.Unique_Name, '.', F_BG.Extension)
                ELSE NULL
            END,
            -- Get header/logo image from dp_Files
            RSVP_Image_URL = CASE
                WHEN F_Header.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', F_Header.Unique_Name, '.', F_Header.Extension)
                ELSE NULL
            END
        FROM Projects p
        -- Join to dp_files for background image
        LEFT OUTER JOIN dp_files F_BG ON F_BG.Record_ID = p.Project_ID
            AND F_BG.Table_Name = 'Projects'
            AND F_BG.File_Name LIKE 'RSVP_BG_Image%'
        -- Join to dp_files for header image
        LEFT OUTER JOIN dp_files F_Header ON F_Header.Record_ID = p.Project_ID
            AND F_Header.Table_Name = 'Projects'
            AND F_Header.File_Name LIKE 'RSVP_Image%'
        -- Join to get ImageURL configuration setting
        LEFT OUTER JOIN dp_Configuration_Settings CS
            ON CS.Domain_ID = COALESCE(p.Domain_ID, 1)
            AND CS.Key_Name = 'ImageURL'
            AND CS.Application_Code = 'Common'
        -- Join to get Domain GUID
        LEFT OUTER JOIN dp_Domains D
            ON D.Domain_ID = COALESCE(p.Domain_ID, 1)
        WHERE p.Project_ID = @Project_ID
          AND p.RSVP_Is_Active = 1
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- If no active RSVP found, return error
    IF @ProjectJson IS NULL
    BEGIN
        SELECT 'error' AS status, 'Project RSVP not found or inactive' AS message
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
        RETURN;
    END

    -- ===================================================================
    -- Get Events linked to this Project
    -- ===================================================================
    DECLARE @EventsJson NVARCHAR(MAX);

    SELECT @EventsJson = (
        SELECT
            e.Event_ID,
            e.Event_Title,
            e.Event_Start_Date,
            e.Event_End_Date,
            e.Event_Type_ID,
            e.Congregation_ID,
            ISNULL(c.Congregation_Name, '') AS Campus_Name,
            ISNULL(c.Campus_Slug, '') AS Campus_Slug,
            -- Build Campus SVG URL from dp_files
            Campus_SVG_URL = CASE
                WHEN F.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', F.Unique_Name, '.', F.Extension)
                ELSE NULL
            END,
            ISNULL(l.Location_Name, '') AS Campus_Location,
            -- Get capacity from RSVP_Capacity field (use 9999 to represent unlimited for JSON compatibility)
            ISNULL(e.RSVP_Capacity, 9999) AS Capacity,
            -- Count current RSVPs for this event (number of Event_Participant records)
            (SELECT COUNT(*) FROM Event_Participants ep
             WHERE ep.Event_ID = e.Event_ID
             AND ep.Participation_Status_ID = 2) AS Current_RSVPs,
            -- Apply the capacity modifier from Events table
            ISNULL(e.RSVP_Capacity_Modifier, 0) AS RSVP_Capacity_Modifier,
            -- Calculate adjusted attendee count (sum of party sizes + modifier)
            (SELECT SUM(ISNULL(ep.RSVP_Party_Size, 1)) FROM Event_Participants ep
             WHERE ep.Event_ID = e.Event_ID
             AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0) AS Adjusted_RSVP_Count,
            -- Calculate capacity percentage with modifier (NULL capacity = unlimited = 0%)
            CASE
                WHEN e.RSVP_Capacity IS NULL THEN 0  -- Unlimited capacity shows as 0%
                WHEN e.RSVP_Capacity = 0 THEN 0
                ELSE ROUND(
                    ((SELECT SUM(ISNULL(ep.RSVP_Party_Size, 1)) FROM Event_Participants ep
                      WHERE ep.Event_ID = e.Event_ID
                      AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0
                    / e.RSVP_Capacity, 0
                )
            END AS Capacity_Percentage,
            -- Max_Capacity for frontend (use 9999 to represent unlimited for JSON compatibility)
            ISNULL(e.RSVP_Capacity, 9999) AS Max_Capacity,
            -- Is_Available - false only if capacity is set AND reached/exceeded
            CASE
                WHEN e.RSVP_Capacity IS NULL THEN CAST(1 AS BIT)  -- NULL = unlimited = always available
                WHEN e.RSVP_Capacity = 0 THEN CAST(0 AS BIT)
                WHEN ((SELECT SUM(ISNULL(ep.RSVP_Party_Size, 1)) FROM Event_Participants ep
                       WHERE ep.Event_ID = e.Event_ID
                       AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) >= e.RSVP_Capacity THEN CAST(0 AS BIT)
                ELSE CAST(1 AS BIT)
            END AS Is_Available,
            -- Campus address info for map from Locations table
            ISNULL(a.Address_Line_1, '') AS Campus_Address,
            ISNULL(a.City, '') AS Campus_City,
            ISNULL(a.[State/Region], '') AS Campus_State,
            ISNULL(a.Postal_Code, '') AS Campus_Zip,
            -- Minor Registration - allow parents to register children without email
            ISNULL(e.Minor_Registration, 0) AS Minor_Registration,
            -- Event Amenities (childcare, ASL interpretation, etc.)
            Amenities = (
                SELECT
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
                FOR JSON PATH
            )
        FROM Events e
        LEFT JOIN Congregations c ON e.Congregation_ID = c.Congregation_ID
        LEFT JOIN Locations l ON c.Location_ID = l.Location_ID
        LEFT JOIN Addresses a ON l.Address_ID = a.Address_ID
        -- Join to dp_files to get Campus.svg file
        LEFT OUTER JOIN dp_files F ON F.Record_ID = c.Congregation_ID
            AND F.Table_Name = 'Congregations'
            AND F.File_Name = 'Campus.svg'
        -- Join to get ImageURL configuration setting
        LEFT OUTER JOIN dp_Configuration_Settings CS
            ON CS.Domain_ID = COALESCE(c.Domain_ID, 1)
            AND CS.Key_Name = 'ImageURL'
            AND CS.Application_Code = 'Common'
        -- Join to get Domain GUID
        LEFT OUTER JOIN dp_Domains D
            ON D.Domain_ID = COALESCE(c.Domain_ID, 1)
        WHERE e.Project_ID = @Project_ID
          AND e.Include_In_RSVP = 1
          AND (@Congregation_ID IS NULL OR e.Congregation_ID = @Congregation_ID)
        ORDER BY e.Event_Start_Date ASC, c.Congregation_Name ASC
        FOR JSON PATH
    );

    -- Default to empty array if no events
    IF @EventsJson IS NULL
        SET @EventsJson = '[]';

    -- ===================================================================
    -- Build Questions Array
    -- ALWAYS includes implicit "How many people?" counter
    -- THEN adds any additional form fields if Form_ID is linked
    -- ===================================================================
    DECLARE @QuestionsJson NVARCHAR(MAX);
    DECLARE @FormID INT;

    -- Get Form_ID from Project if one is linked
    SELECT @FormID = Form_ID
    FROM Projects
    WHERE Project_ID = @Project_ID;

    -- Start building questions array with implicit party size counter
    DECLARE @ImplicitQuestion NVARCHAR(MAX) = N'[{"Question_ID":0,"Question_Text":"How many people?","Question_Type":"Counter","Component_Name":"Counter","Field_Order":0,"Is_Required":true,"Helper_Text":"How many people will be attending with you?","Min_Value":1,"Max_Value":99,"Default_Value":1,"Placeholder_Text":null,"Icon_Name":"Users","Options":[],"Custom_Field_Configuration":"{\"component\":\"Counter\",\"min_value\":1,\"max_value\":99,\"default_value\":1,\"step\":1,\"icon\":\"Users\",\"helper_text\":\"How many people will be attending with you?\"}"}]';

    -- If there's a linked form, get additional questions
    IF @FormID IS NOT NULL
    BEGIN
        DECLARE @AdditionalQuestionsJson NVARCHAR(MAX);

        SELECT @AdditionalQuestionsJson = (
            SELECT
                ff.Form_Field_ID AS Question_ID,
                COALESCE(NULLIF(ff.Alternate_Label, ''), ff.Field_Label) AS Question_Text,
                fft.Field_Type AS Question_Type,
                -- Extract component name from Custom_Field_Configuration JSON or use Field_Type as fallback
                ISNULL(
                    JSON_VALUE(ff.Custom_Field_Configuration, '$.component'),
                    fft.Field_Type
                ) AS Component_Name,
                ff.Field_Order + 1 AS Field_Order,  -- +1 because party size is 0
                ff.Required AS Is_Required,
                JSON_VALUE(ff.Custom_Field_Configuration, '$.helper_text') AS Helper_Text,
                CAST(JSON_VALUE(ff.Custom_Field_Configuration, '$.min_value') AS INT) AS Min_Value,
                CAST(JSON_VALUE(ff.Custom_Field_Configuration, '$.max_value') AS INT) AS Max_Value,
                JSON_VALUE(ff.Custom_Field_Configuration, '$.default_value') AS Default_Value,
                JSON_VALUE(ff.Custom_Field_Configuration, '$.placeholder') AS Placeholder_Text,
                JSON_VALUE(ff.Custom_Field_Configuration, '$.icon') AS Icon_Name,
                -- Get options from Custom_Field_Configuration JSON if present
                ISNULL(
                    JSON_QUERY(ff.Custom_Field_Configuration, '$.options'),
                    '[]'
                ) AS Options,
                -- Include full custom configuration
                ff.Custom_Field_Configuration
            FROM Form_Fields ff
            INNER JOIN Form_Field_Types fft ON ff.Field_Type_ID = fft.Form_Field_Type_ID
            WHERE ff.Form_ID = @FormID
              AND ff.Is_Hidden = 0  -- Only show visible fields
            ORDER BY ff.Field_Order ASC
            FOR JSON PATH
        );

        -- Combine implicit question with additional questions
        IF @AdditionalQuestionsJson IS NOT NULL AND @AdditionalQuestionsJson != '[]'
        BEGIN
            -- Remove closing ] from implicit, remove opening [ from additional, combine
            SET @QuestionsJson =
                LEFT(@ImplicitQuestion, LEN(@ImplicitQuestion) - 1) + N',' +
                SUBSTRING(@AdditionalQuestionsJson, 2, LEN(@AdditionalQuestionsJson));
        END
        ELSE
        BEGIN
            -- Only implicit question (already a complete array)
            SET @QuestionsJson = @ImplicitQuestion;
        END
    END
    ELSE
    BEGIN
        -- Only implicit question (no form linked, already a complete array)
        SET @QuestionsJson = @ImplicitQuestion;
    END

    -- ===================================================================
    -- Get Campus Meeting Instructions from Project_Campuses
    -- ===================================================================
    DECLARE @CampusMeetingInstructionsJson NVARCHAR(MAX);

    SELECT @CampusMeetingInstructionsJson = (
        SELECT
            pc.Congregation_ID,
            c.Congregation_Name AS Campus_Name,
            c.Campus_Slug,
            e.Meeting_Instructions,
            -- Get campus-specific image from Public_Event_ID default image
            Campus_Image_URL = CASE
                WHEN F_Event.File_ID IS NOT NULL AND CS.Value IS NOT NULL AND D.Domain_GUID IS NOT NULL
                THEN CONCAT(CS.Value, '?dn=', CONVERT(varchar(40), D.Domain_GUID), '&fn=', F_Event.Unique_Name, '.', F_Event.Extension)
                ELSE NULL
            END
        FROM Project_Campuses pc
        INNER JOIN Congregations c ON pc.Congregation_ID = c.Congregation_ID
        LEFT JOIN Events e ON pc.Public_Event_ID = e.Event_ID
        -- Join to dp_files to get default image from Public_Event_ID
        LEFT OUTER JOIN dp_files F_Event ON F_Event.Record_ID = pc.Public_Event_ID
            AND F_Event.Table_Name = 'Events'
            AND F_Event.Default_Image = 1
        -- Join to get ImageURL configuration setting
        LEFT OUTER JOIN dp_Configuration_Settings CS
            ON CS.Domain_ID = COALESCE(c.Domain_ID, 1)
            AND CS.Key_Name = 'ImageURL'
            AND CS.Application_Code = 'Common'
        -- Join to get Domain GUID
        LEFT OUTER JOIN dp_Domains D
            ON D.Domain_ID = COALESCE(c.Domain_ID, 1)
        WHERE pc.Project_ID = @Project_ID
          AND pc.Is_Active = 1
          AND (@Congregation_ID IS NULL OR pc.Congregation_ID = @Congregation_ID)
        ORDER BY c.Congregation_Name ASC
        FOR JSON PATH
    );

    -- Default to empty array if no campus instructions
    IF @CampusMeetingInstructionsJson IS NULL
        SET @CampusMeetingInstructionsJson = '[]';

    -- ===================================================================
    -- Get Confirmation Cards
    -- ===================================================================
    DECLARE @CardsJson NVARCHAR(MAX);

    SELECT @CardsJson = (
        SELECT
            pcc.Project_Confirmation_Card_ID AS Card_ID,
            ct.Card_Type_ID,
            ct.Card_Type_Name,
            ct.Component_Name,
            ct.Icon_Name,
            pcc.Display_Order,
            pcc.Congregation_ID,
            -- Parse JSON configuration or use default
            ISNULL(
                TRY_CAST(pcc.Card_Configuration AS NVARCHAR(MAX)),
                ct.Default_Configuration
            ) AS Configuration
        FROM Project_Confirmation_Cards pcc
        INNER JOIN Card_Types ct ON pcc.Card_Type_ID = ct.Card_Type_ID
        WHERE pcc.Project_ID = @Project_ID
          AND pcc.Is_Active = 1
          -- Show cards that are either global (NULL congregation) or match the filter
          AND (pcc.Congregation_ID IS NULL OR @Congregation_ID IS NULL OR pcc.Congregation_ID = @Congregation_ID)
        ORDER BY pcc.Display_Order ASC
        FOR JSON PATH
    );

    -- Default to empty array if no cards
    IF @CardsJson IS NULL
        SET @CardsJson = '[]';

    -- ===================================================================
    -- Get Carousel Events (Non-RSVP Events grouped by carousel name)
    -- ===================================================================
    -- Events with RSVP_Carousel_Name populated will appear in themed
    -- carousels below the RSVP section
    DECLARE @CarouselsJson NVARCHAR(MAX);

    SELECT @CarouselsJson = (
        SELECT DISTINCT
            e.RSVP_Carousel_Name AS Carousel_Name,
            (
                SELECT
                    e2.Event_ID,
                    e2.Event_Title,
                    e2.Event_Start_Date,
                    e2.Event_End_Date,
                    e2.Event_Type_ID,
                    e2.Congregation_ID,
                    ISNULL(c2.Congregation_Name, '') AS Campus_Name,
                    ISNULL(c2.Campus_Slug, '') AS Campus_Slug,
                    ISNULL(l2.Location_Name, '') AS Campus_Location,
                    e2.Description,
                    -- Get event image URL from dp_files (default image)
                    Event_Image_URL = CASE
                        WHEN F_Event.File_ID IS NOT NULL AND CS2.Value IS NOT NULL AND D2.Domain_GUID IS NOT NULL
                        THEN CONCAT(CS2.Value, '?dn=', CONVERT(varchar(40), D2.Domain_GUID), '&fn=', F_Event.Unique_Name, '.', F_Event.Extension)
                        ELSE NULL
                    END,
                    -- Get event URL: Use External_Registration_URL if provided, otherwise use details page
                    Event_URL = CASE
                        WHEN e2.External_Registration_URL IS NOT NULL AND LEN(e2.External_Registration_URL) > 0
                        THEN e2.External_Registration_URL
                        ELSE CONCAT('https://woodsidebible.org/events/details/?id=', e2.Event_ID)
                    END
                FROM Events e2
                LEFT JOIN Congregations c2 ON e2.Congregation_ID = c2.Congregation_ID
                LEFT JOIN Locations l2 ON c2.Location_ID = l2.Location_ID
                -- Join to dp_files to get event default image
                LEFT OUTER JOIN dp_files F_Event ON F_Event.Record_ID = e2.Event_ID
                    AND F_Event.Table_Name = 'Events'
                    AND F_Event.Default_Image = 1
                -- Join to get ImageURL configuration setting
                LEFT OUTER JOIN dp_Configuration_Settings CS2
                    ON CS2.Domain_ID = COALESCE(e2.Domain_ID, 1)
                    AND CS2.Key_Name = 'ImageURL'
                    AND CS2.Application_Code = 'Common'
                -- Join to get Domain GUID
                LEFT OUTER JOIN dp_Domains D2
                    ON D2.Domain_ID = COALESCE(e2.Domain_ID, 1)
                WHERE e2.Project_ID = @Project_ID
                  AND e2.RSVP_Carousel_Name = e.RSVP_Carousel_Name
                  AND (e2.Include_In_RSVP IS NULL OR e2.Include_In_RSVP = 0)
                  AND (@Congregation_ID IS NULL OR e2.Congregation_ID = @Congregation_ID)
                ORDER BY e2.Event_Start_Date ASC
                FOR JSON PATH
            ) AS Events
        FROM Events e
        WHERE e.Project_ID = @Project_ID
          AND e.RSVP_Carousel_Name IS NOT NULL
          AND (e.Include_In_RSVP IS NULL OR e.Include_In_RSVP = 0)
          AND (@Congregation_ID IS NULL OR e.Congregation_ID = @Congregation_ID)
        ORDER BY e.RSVP_Carousel_Name ASC
        FOR JSON PATH
    );

    -- Default to empty array if no carousel events
    IF @CarouselsJson IS NULL
        SET @CarouselsJson = '[]';

    -- ===================================================================
    -- Return Combined JSON Response
    -- ===================================================================
    DECLARE @Result NVARCHAR(MAX);

    SET @Result = N'{' +
        N'"Project":' + @ProjectJson + N',' +
        N'"Events":' + @EventsJson + N',' +
        N'"Questions":' + @QuestionsJson + N',' +
        N'"Confirmation_Cards":' + @CardsJson + N',' +
        N'"Campus_Meeting_Instructions":' + @CampusMeetingInstructionsJson + N',' +
        N'"Carousels":' + @CarouselsJson +
    N'}';

    SELECT @Result AS JsonResult;
END
GO

-- ===================================================================
-- Grant API Access
-- ===================================================================
-- Uncomment and adjust based on your MP API user configuration
-- Example: GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Data_JSON] TO [YourAPIUser];

PRINT 'Created stored procedure: api_Custom_RSVP_Project_Data_JSON (v2 - Native MP Tables)';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
GO

-- ===================================================================
-- Test Queries (Uncomment to test)
-- ===================================================================
/*
-- Test with Project_ID
EXEC api_Custom_RSVP_Project_Data_JSON @Project_ID = 1;

-- Test with RSVP_Slug
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2025';

-- Test with slug + campus filter
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2025', @Campus_Slug = 'lake-orion';

-- Test with slug + congregation ID
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2025', @Congregation_ID = 15;
*/
