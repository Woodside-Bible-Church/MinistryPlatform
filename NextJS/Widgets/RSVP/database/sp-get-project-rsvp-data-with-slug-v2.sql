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
            -- Count current RSVPs for this event (using Event_Participants now)
            (SELECT COUNT(*) FROM Event_Participants ep
             WHERE ep.Event_ID = e.Event_ID
             AND ep.Participation_Status_ID = 2) AS Current_RSVPs,
            -- Apply the capacity modifier from Events table
            ISNULL(e.RSVP_Capacity_Modifier, 0) AS RSVP_Capacity_Modifier,
            -- Calculate adjusted RSVP count
            (SELECT COUNT(*) FROM Event_Participants ep
             WHERE ep.Event_ID = e.Event_ID
             AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0) AS Adjusted_RSVP_Count,
            -- Calculate capacity percentage with modifier (NULL capacity = unlimited = 0%)
            CASE
                WHEN e.RSVP_Capacity IS NULL THEN 0  -- Unlimited capacity shows as 0%
                WHEN e.RSVP_Capacity = 0 THEN 0
                ELSE CAST(
                    ((SELECT COUNT(*) FROM Event_Participants ep
                      WHERE ep.Event_ID = e.Event_ID
                      AND ep.Participation_Status_ID = 2) + ISNULL(e.RSVP_Capacity_Modifier, 0)) * 100.0
                    / e.RSVP_Capacity AS INT
                )
            END AS Capacity_Percentage,
            -- Max_Capacity for frontend (use 9999 to represent unlimited for JSON compatibility)
            ISNULL(e.RSVP_Capacity, 9999) AS Max_Capacity,
            -- Is_Available - false only if capacity is set AND reached/exceeded
            CASE
                WHEN e.RSVP_Capacity IS NULL THEN CAST(1 AS BIT)  -- NULL = unlimited = always available
                WHEN e.RSVP_Capacity = 0 THEN CAST(0 AS BIT)
                WHEN ((SELECT COUNT(*) FROM Event_Participants ep
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
            ISNULL(e.Minor_Registration, 0) AS Minor_Registration
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
                ff.Field_Label AS Question_Text,
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
    -- Return Combined JSON Response
    -- ===================================================================
    DECLARE @Result NVARCHAR(MAX);

    SET @Result = N'{' +
        N'"Project":' + @ProjectJson + N',' +
        N'"Events":' + @EventsJson + N',' +
        N'"Questions":' + @QuestionsJson + N',' +
        N'"Confirmation_Cards":' + @CardsJson +
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
