-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Project_Data_JSON (Updated for Projects Table)
-- ===================================================================
-- Fetches all data needed to render the RSVP widget
-- Returns nested JSON with project, events, questions, and cards
-- NOW USES: Projects table directly instead of Project_RSVPs
-- SUPPORTS: Lookup by Project_ID (int) OR RSVP_Slug (string)
-- FILES: RSVP images from dp_Files (RSVP_BG_Image.jpg, RSVP_Image.jpg)
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
            SELECT 'error' AS status, 'Project not found with slug: ' + @RSVP_Slug AS message
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
    -- Get Project RSVP Configuration
    -- ===================================================================
    DECLARE @ProjectJson NVARCHAR(MAX);

    SELECT @ProjectJson = (
        SELECT TOP 1
            p.Project_ID,
            p.RSVP_Title,
            p.RSVP_Description,
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
            END,
            p.RSVP_Start_Date,
            p.RSVP_End_Date,
            p.RSVP_Is_Active,
            p.RSVP_Require_Contact_Lookup,
            p.RSVP_Allow_Guest_Submission,
            p.RSVP_Slug,
            -- Branding colors
            p.RSVP_Primary_Color,
            p.RSVP_Secondary_Color,
            p.RSVP_Accent_Color,
            p.RSVP_Background_Color
        FROM Projects p
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
          AND p.RSVP_Is_Active = 1
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- If no active RSVP found, return error
    IF @ProjectJson IS NULL
    BEGIN
        SELECT 'error' AS status, 'Project not found or RSVP not active' AS message
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
            -- Get capacity from Event or use override
            ISNULL(e.Participants_Expected, 500) AS Capacity,
            -- Count current RSVPs for this event
            (SELECT COUNT(*) FROM Event_RSVPs er WHERE er.Event_ID = e.Event_ID) AS Current_RSVPs,
            -- Apply the capacity modifier
            ISNULL(pe.RSVP_Capacity_Modifier, 0) AS RSVP_Capacity_Modifier,
            -- Calculate adjusted RSVP count
            (SELECT COUNT(*) FROM Event_RSVPs er WHERE er.Event_ID = e.Event_ID) + ISNULL(pe.RSVP_Capacity_Modifier, 0) AS Adjusted_RSVP_Count,
            -- Calculate capacity percentage with modifier
            CASE
                WHEN ISNULL(e.Participants_Expected, 500) = 0 THEN 0
                ELSE CAST(
                    ((SELECT COUNT(*) FROM Event_RSVPs er WHERE er.Event_ID = e.Event_ID) + ISNULL(pe.RSVP_Capacity_Modifier, 0)) * 100.0
                    / ISNULL(e.Participants_Expected, 500) AS INT
                )
            END AS Capacity_Percentage,
            -- Max_Capacity for frontend
            ISNULL(e.Participants_Expected, 500) AS Max_Capacity,
            -- Is_Available - true if capacity percentage < 100
            CASE
                WHEN ISNULL(e.Participants_Expected, 500) = 0 THEN CAST(0 AS BIT)
                WHEN ((SELECT COUNT(*) FROM Event_RSVPs er WHERE er.Event_ID = e.Event_ID) + ISNULL(pe.RSVP_Capacity_Modifier, 0)) >= ISNULL(e.Participants_Expected, 500) THEN CAST(0 AS BIT)
                ELSE CAST(1 AS BIT)
            END AS Is_Available,
            -- Campus address info for map from Locations table
            ISNULL(a.Address_Line_1, '') AS Campus_Address,
            ISNULL(a.City, '') AS Campus_City,
            ISNULL(a.[State/Region], '') AS Campus_State,
            ISNULL(a.Postal_Code, '') AS Campus_Zip
        FROM Project_Events pe
        INNER JOIN Events e ON pe.Event_ID = e.Event_ID
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
        WHERE pe.Project_ID = @Project_ID
          AND pe.Include_In_RSVP = 1
          -- Date filter removed for testing - can be added back later
          -- AND e.Event_Start_Date >= GETDATE() - 1
          AND (@Congregation_ID IS NULL OR e.Congregation_ID = @Congregation_ID)
        ORDER BY e.Event_Start_Date ASC, c.Congregation_Name ASC
        FOR JSON PATH
    );

    -- Default to empty array if no events
    IF @EventsJson IS NULL
        SET @EventsJson = '[]';

    -- ===================================================================
    -- Get Questions for this Project
    -- ===================================================================
    DECLARE @QuestionsJson NVARCHAR(MAX);

    SELECT @QuestionsJson = (
        SELECT
            q.Project_RSVP_Question_ID AS Question_ID,
            q.Question_Text,
            qt.Question_Type_Name AS Question_Type,
            qt.Component_Name,
            q.Field_Order,
            q.Is_Required,
            q.Helper_Text,
            q.Min_Value,
            q.Max_Value,
            q.Default_Value,
            q.Placeholder_Text,
            q.Icon_Name,
            -- Get options for this question (empty array if none)
            ISNULL((
                SELECT
                    qo.Question_Option_ID AS Option_ID,
                    qo.Option_Text,
                    qo.Option_Value,
                    qo.Display_Order
                FROM Question_Options qo
                WHERE qo.Project_RSVP_Question_ID = q.Project_RSVP_Question_ID
                ORDER BY qo.Display_Order ASC
                FOR JSON PATH
            ), '[]') AS Options
        FROM Project_RSVP_Questions q
        INNER JOIN Question_Types qt ON q.Question_Type_ID = qt.Question_Type_ID
        WHERE q.Project_ID = @Project_ID
          AND q.Active = 1
        ORDER BY q.Field_Order ASC
        FOR JSON PATH
    );

    -- Default to empty array if no questions
    IF @QuestionsJson IS NULL
        SET @QuestionsJson = '[]';

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

PRINT 'Created stored procedure: api_Custom_RSVP_Project_Data_JSON (Projects table schema)';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
GO

-- ===================================================================
-- Test Queries (Uncomment to test)
-- ===================================================================
/*
-- Test with Project_ID (uses Projects table)
EXEC api_Custom_RSVP_Project_Data_JSON @Project_ID = 1;

-- Test with RSVP_Slug (new method)
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2024';

-- Test with slug + campus filter
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2024', @Campus_Slug = 'lake-orion';

-- Test with slug + congregation ID
EXEC api_Custom_RSVP_Project_Data_JSON @RSVP_Slug = 'christmas-2024', @Congregation_ID = 15;
*/
