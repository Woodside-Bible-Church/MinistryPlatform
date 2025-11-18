-- ===================================================================
-- Stored Procedure: api_Custom_RSVP_Project_Data_JSON
-- ===================================================================
-- Fetches all data needed to render the RSVP widget
-- Returns nested JSON with project, events, questions, and cards
-- ===================================================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('[dbo].[api_Custom_RSVP_Project_Data_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_RSVP_Project_Data_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_RSVP_Project_Data_JSON]
    @Project_RSVP_ID INT,
    @Congregation_ID INT = NULL,  -- Optional: filter events by campus ID
    @Campus_Slug NVARCHAR(50) = NULL  -- Optional: filter events by campus slug (e.g., 'lake-orion')
AS
BEGIN
    SET NOCOUNT ON;

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
    -- Get Project_RSVP Configuration
    -- ===================================================================
    DECLARE @ProjectRSVPJson NVARCHAR(MAX);

    SELECT @ProjectRSVPJson = (
        SELECT TOP 1
            pr.Project_RSVP_ID,
            pr.Project_ID,
            pr.RSVP_Title,
            pr.RSVP_Description,
            pr.Header_Image_URL,
            pr.Start_Date,
            pr.End_Date,
            pr.Is_Active,
            pr.Require_Contact_Lookup,
            pr.Allow_Guest_Submission
        FROM Project_RSVPs pr
        WHERE pr.Project_RSVP_ID = @Project_RSVP_ID
          AND pr.Is_Active = 1
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- If no active RSVP found, return error
    IF @ProjectRSVPJson IS NULL
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
        WHERE pe.Project_ID = (SELECT Project_ID FROM Project_RSVPs WHERE Project_RSVP_ID = @Project_RSVP_ID)
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
    -- Get Questions for this RSVP
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
        WHERE q.Project_RSVP_ID = @Project_RSVP_ID
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
        WHERE pcc.Project_RSVP_ID = @Project_RSVP_ID
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
        N'"Project_RSVP":' + @ProjectRSVPJson + N',' +
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
-- Make this procedure available to the API user
-- Uncomment and adjust based on your MP API user configuration
-- Example: GRANT EXECUTE ON [dbo].[api_Custom_RSVP_Project_Data_JSON] TO [YourAPIUser];

PRINT 'Created stored procedure: api_Custom_RSVP_Project_Data_JSON';
PRINT 'NOTE: Remember to grant EXECUTE permission to your API user!';
GO

-- ===================================================================
-- Test Query (Uncomment to test)
-- ===================================================================
/*
-- Test with Project_RSVP_ID = 1
EXEC api_Custom_RSVP_Project_Data_JSON @Project_RSVP_ID = 1;

-- Test with campus ID filter
EXEC api_Custom_RSVP_Project_Data_JSON @Project_RSVP_ID = 1, @Congregation_ID = 15;

-- Test with campus slug filter
EXEC api_Custom_RSVP_Project_Data_JSON @Project_RSVP_ID = 1, @Campus_Slug = 'lake-orion';
*/
