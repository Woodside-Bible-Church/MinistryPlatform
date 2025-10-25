-- =====================================================
-- Unified Prayer Widget Data Stored Procedure
-- Returns all widget data in a single nested JSON structure
--
-- This replaces multiple API calls with one comprehensive call that includes:
-- 1. Widget configuration (from dp_Configuration_Settings)
-- 2. Widget labels/text (from Application_Labels or parameters)
-- 3. User stats (prayer count, streak, etc.)
-- 4. My Requests (user's own prayer submissions)
-- 5. Prayer Partners (prayers the user has prayed for)
-- 6. Community Needs (other prayers, excluding duplicates)
--
-- Usage:
--   EXEC api_Custom_Prayer_Widget_Data_JSON @ContactID = 123
--
-- IMPORTANT TODOS TO RESOLVE BEFORE PRODUCTION:
--   1. Line ~159-165: Determine correct method to check if user is staff
--      (currently defaults to non-staff). Check dp_Users, dp_User_Security_Roles,
--      or another table to identify staff members.
--   2. Line ~239-245: Verify Visibility_Level_ID values (4=Public, 3=Members, etc.)
--      and join to actual Visibility_Levels table if available.
--   3. Line ~249-251: Verify Care_Outcome_ID logic for Is_Answered flag.
--      Which Care_Outcome_ID values indicate an answered prayer?
--   4. Line ~295: ✓ DONE - Contact images now retrieved from dp_files table.
--   5. Line ~377-380: Fix campus filter field name (Congregation_ID doesn't exist).
--      Determine correct field: Household_ID, Congregation_Name, or join to another table.
-- =====================================================

IF OBJECT_ID('[dbo].[api_Custom_Prayer_Widget_Data_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_Prayer_Widget_Data_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_Prayer_Widget_Data_JSON]
    @ContactID INT = NULL,  -- Current user's Contact_ID (null if not logged in)
    @DomainID INT = 1       -- Domain_ID for multi-tenant support
AS
BEGIN
    SET NOCOUNT ON;

    -- =====================================================
    -- STEP 1: Load Configuration Settings from dp_Configuration_Settings
    -- =====================================================

    -- Frontend-exposed configuration (returned in JSON)
    DECLARE @Default_Card_Layout NVARCHAR(10) = 'stack';
    DECLARE @Allow_Anonymous BIT = 0;
    DECLARE @Show_Contact_Names BIT = 1;
    DECLARE @Require_Approval BIT = 1;

    -- Server-side only configuration (used in WHERE clauses, NOT returned)
    DECLARE @Filter_By_Campus BIT = 0;
    DECLARE @Campus_IDs NVARCHAR(100) = NULL;
    DECLARE @Enabled_Types NVARCHAR(50) = '1,2'; -- Prayer Request (1) and Praise Report (2)
    DECLARE @Days_To_Show INT = 60;
    DECLARE @ImageURL NVARCHAR(500) = NULL; -- Base URL for images

    -- Load settings from dp_Configuration_Settings table if they exist
    -- Format: Application_Code = 'CUSTOMWIDGETS', Key_Name = 'PrayerWidget{Setting}'

    -- Frontend settings
    SELECT @Default_Card_Layout = ISNULL(cs.Value, @Default_Card_Layout)
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetDefaultCardLayout'
    AND cs.Domain_ID = @DomainID;

    SELECT @Allow_Anonymous = ISNULL(CAST(cs.Value AS BIT), @Allow_Anonymous)
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetAllowAnonymous'
    AND cs.Domain_ID = @DomainID;

    SELECT @Show_Contact_Names = ISNULL(CAST(cs.Value AS BIT), @Show_Contact_Names)
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetShowContactNames'
    AND cs.Domain_ID = @DomainID;

    SELECT @Require_Approval = ISNULL(CAST(cs.Value AS BIT), @Require_Approval)
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetRequireApproval'
    AND cs.Domain_ID = @DomainID;

    -- Server-side settings (for filtering only)
    SELECT @Filter_By_Campus = ISNULL(CAST(cs.Value AS BIT), @Filter_By_Campus)
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetFilterByCampus'
    AND cs.Domain_ID = @DomainID;

    SELECT @Campus_IDs = cs.Value
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetCampusIDs'
    AND cs.Domain_ID = @DomainID;

    SELECT @Enabled_Types = ISNULL(cs.Value, @Enabled_Types)
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetEnabledTypes'
    AND cs.Domain_ID = @DomainID;

    SELECT @Days_To_Show = ISNULL(CAST(cs.Value AS INT), @Days_To_Show)
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'CUSTOMWIDGETS'
    AND cs.Key_Name = 'PrayerWidgetDaysToShow'
    AND cs.Domain_ID = @DomainID;

    -- Get ImageURL base and Domain GUID for building contact image URLs
    DECLARE @DomainGUID VARCHAR(40);

    SELECT @ImageURL = cs.Value
    FROM dp_Configuration_Settings cs
    WHERE cs.Application_Code = 'Common'
    AND cs.Key_Name = 'ImageURL'
    AND cs.Domain_ID = @DomainID;

    SELECT @DomainGUID = CONVERT(VARCHAR(40), Domain_GUID)
    FROM dp_Domains
    WHERE Domain_ID = @DomainID;

    -- =====================================================
    -- STEP 2: Load Application Labels
    -- =====================================================

    DECLARE @Label_Widget_Title NVARCHAR(255);
    DECLARE @Label_Widget_Subtitle NVARCHAR(255);
    DECLARE @Label_User_Stats_Total NVARCHAR(100);
    DECLARE @Label_User_Stats_Streak NVARCHAR(100);
    DECLARE @Label_User_Stats_Today NVARCHAR(100);
    DECLARE @Label_My_Requests_Title NVARCHAR(100);
    DECLARE @Label_My_Requests_Description NVARCHAR(255);
    DECLARE @Label_Prayer_Partners_Title NVARCHAR(100);
    DECLARE @Label_Prayer_Partners_Description NVARCHAR(255);
    DECLARE @Label_Community_Needs_Title NVARCHAR(100);
    DECLARE @Label_Community_Needs_Description NVARCHAR(255);

    -- Fetch labels from dp_Application_Labels
    SELECT @Label_Widget_Title = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.widget.title' AND Domain_ID = @DomainID;

    SELECT @Label_Widget_Subtitle = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.widget.subtitle' AND Domain_ID = @DomainID;

    SELECT @Label_User_Stats_Total = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.userStats.totalPrayersLabel' AND Domain_ID = @DomainID;

    SELECT @Label_User_Stats_Streak = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.userStats.streakLabel' AND Domain_ID = @DomainID;

    SELECT @Label_User_Stats_Today = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.userStats.todayLabel' AND Domain_ID = @DomainID;

    SELECT @Label_My_Requests_Title = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.myRequests.title' AND Domain_ID = @DomainID;

    SELECT @Label_My_Requests_Description = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.myRequests.description' AND Domain_ID = @DomainID;

    SELECT @Label_Prayer_Partners_Title = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.prayerPartners.title' AND Domain_ID = @DomainID;

    SELECT @Label_Prayer_Partners_Description = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.prayerPartners.description' AND Domain_ID = @DomainID;

    SELECT @Label_Community_Needs_Title = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.communityNeeds.title' AND Domain_ID = @DomainID;

    SELECT @Label_Community_Needs_Description = English FROM dp_Application_Labels
    WHERE Label_Name = 'customWidgets.prayerWidget.communityNeeds.description' AND Domain_ID = @DomainID;

    -- =====================================================
    -- STEP 3: Calculate User Stats (if logged in)
    -- =====================================================

    DECLARE @Total_Prayers INT = 0;
    DECLARE @Prayer_Streak INT = 0;
    DECLARE @Prayers_Today INT = 0;
    DECLARE @Is_Staff BIT = 0;

    IF @ContactID IS NOT NULL
    BEGIN
        -- TODO: Determine if user is staff (check User_Account, Security_Role, or other table)
        -- Placeholder logic - assumes Contact_ID < 100 is staff for testing
        -- SELECT @Is_Staff = CASE WHEN EXISTS (
        --     SELECT 1 FROM dp_Users u
        --     INNER JOIN dp_User_Security_Roles usr ON u.User_ID = usr.User_ID
        --     WHERE u.Contact_ID = @ContactID AND usr.Security_Role_ID = <STAFF_ROLE_ID>
        -- ) THEN 1 ELSE 0 END;
        SET @Is_Staff = 0; -- Default to non-staff for now
        -- Total prayers by this user (Response_Type_ID = 1 is "Prayed")
        SELECT @Total_Prayers = COUNT(*)
        FROM Feedback_Entry_User_Responses
        WHERE Contact_ID = @ContactID
        AND Response_Type_ID = 1;

        -- Prayers today
        SELECT @Prayers_Today = COUNT(*)
        FROM Feedback_Entry_User_Responses
        WHERE Contact_ID = @ContactID
        AND Response_Type_ID = 1
        AND CAST(Response_Date AS DATE) = CAST(GETDATE() AS DATE);

        -- Current streak (consecutive days with prayers)
        -- Simplified streak calculation - counts distinct consecutive days from today backwards
        SELECT @Prayer_Streak = COUNT(DISTINCT CAST(Response_Date AS DATE))
        FROM Feedback_Entry_User_Responses r1
        WHERE Contact_ID = @ContactID
        AND Response_Type_ID = 1
        AND CAST(Response_Date AS DATE) <= CAST(GETDATE() AS DATE)
        AND NOT EXISTS (
            SELECT 1
            WHERE CAST(GETDATE() AS DATE) > CAST(r1.Response_Date AS DATE)
            AND NOT EXISTS (
                SELECT 1
                FROM Feedback_Entry_User_Responses r2
                WHERE r2.Contact_ID = @ContactID
                AND r2.Response_Type_ID = 1
                AND CAST(r2.Response_Date AS DATE) = DATEADD(day, 1, CAST(r1.Response_Date AS DATE))
            )
        );
    END;

    -- =====================================================
    -- STEP 4: Build temp table with all relevant prayers
    -- =====================================================

    -- Create temp table to hold all prayers we might show
    CREATE TABLE #AllPrayers (
        Feedback_Entry_ID INT,
        Contact_ID INT,
        Feedback_Type_ID INT,
        Entry_Title NVARCHAR(500),
        Description NVARCHAR(MAX),
        Date_Submitted DATETIME,
        Approved BIT,
        Ongoing_Need BIT,
        Target_Date DATETIME,
        Visibility_Level_ID INT,
        Visibility_Label NVARCHAR(50),
        Care_Outcome_ID INT,
        Is_Answered BIT,
        Anonymous_Share BIT,
        Display_Name NVARCHAR(255),
        First_Name NVARCHAR(50),
        Last_Name NVARCHAR(50),
        Contact_Image NVARCHAR(500),
        Feedback_Type NVARCHAR(50),
        Prayer_Count INT,
        Celebration_Count INT,
        User_Has_Prayed BIT,
        User_Prayer_Date DATETIME,
        User_Prayer_Message NVARCHAR(4000),
        Latest_Update NVARCHAR(4000),
        Latest_Update_Date DATETIME,
        Is_My_Request BIT,
        Is_Prayer_Partner BIT
    );

    -- Insert all prayers that match our criteria
    INSERT INTO #AllPrayers
    SELECT
        f.Feedback_Entry_ID,
        f.Contact_ID,
        f.Feedback_Type_ID,
        f.Entry_Title,
        f.Description,
        f.Date_Submitted,
        f.Approved,
        f.Ongoing_Need,
        f.Target_Date,
        f.Visibility_Level_ID,

        -- TODO: Join to Visibility_Levels table to get label (placeholder for now)
        CASE
            WHEN f.Visibility_Level_ID = 4 THEN 'Public'
            WHEN f.Visibility_Level_ID = 3 THEN 'Members Only'
            WHEN f.Visibility_Level_ID = 2 THEN 'Staff Only'
            ELSE 'Private'
        END AS Visibility_Label,

        f.Care_Outcome_ID,

        -- Is_Answered: Check if Care_Outcome_ID indicates answered prayer
        -- TODO: Verify which Care_Outcome_ID values mean "answered"
        CASE WHEN f.Care_Outcome_ID IS NOT NULL THEN 1 ELSE 0 END AS Is_Answered,

        -- Anonymous Share flag
        ISNULL(f.Anonymous_Share, 0) AS Anonymous_Share,

        -- Contact info (respect @Show_Contact_Names setting AND Anonymous_Share flag)
        -- If Anonymous_Share is true, always show "Anonymous" regardless of settings
        CASE
            WHEN ISNULL(f.Anonymous_Share, 0) = 1 THEN 'Anonymous'
            WHEN @Show_Contact_Names = 1 THEN c.Display_Name
            ELSE 'Anonymous'
        END AS Display_Name,
        CASE
            WHEN ISNULL(f.Anonymous_Share, 0) = 1 THEN NULL
            WHEN @Show_Contact_Names = 1 THEN c.First_Name
            ELSE NULL
        END AS First_Name,
        CASE
            WHEN ISNULL(f.Anonymous_Share, 0) = 1 THEN NULL
            WHEN @Show_Contact_Names = 1 THEN c.Last_Name
            ELSE NULL
        END AS Last_Name,

        -- Contact Image URL (from dp_files)
        CASE
            WHEN ISNULL(f.Anonymous_Share, 0) = 1 THEN NULL
            WHEN @Show_Contact_Names = 0 THEN NULL
            WHEN cf.File_ID IS NULL THEN NULL
            ELSE (@ImageURL + '?dn=' + @DomainGUID
                  + '&fn=' + CONVERT(VARCHAR(40), cf.Unique_Name) + '.' + cf.Extension)
        END AS Contact_Image,

        -- Category info
        ft.Feedback_Type,

        -- Prayer count (Response_Type_ID = 1)
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Response_Type_ID = 1) AS Prayer_Count,

        -- Celebration count for praise reports (Response_Type_ID = 3)
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Response_Type_ID = 3) AS Celebration_Count,

        -- Has current user prayed for this?
        CASE WHEN EXISTS (
            SELECT 1 FROM Feedback_Entry_User_Responses
            WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
            AND Contact_ID = @ContactID
            AND Response_Type_ID = 1
        ) THEN 1 ELSE 0 END AS User_Has_Prayed,

        -- When did user pray and what message did they leave?
        (SELECT TOP 1 Response_Date
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Contact_ID = @ContactID
         AND Response_Type_ID = 1
         ORDER BY Response_Date DESC) AS User_Prayer_Date,

        (SELECT TOP 1 Response_Text
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Contact_ID = @ContactID
         AND Response_Type_ID = 1
         ORDER BY Response_Date DESC) AS User_Prayer_Message,

        -- Latest update
        (SELECT TOP 1 Update_Text
         FROM Feedback_Entry_Updates
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         ORDER BY Update_Date DESC) AS Latest_Update,

        (SELECT TOP 1 Update_Date
         FROM Feedback_Entry_Updates
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         ORDER BY Update_Date DESC) AS Latest_Update_Date,

        -- Classification flags
        CASE WHEN f.Contact_ID = @ContactID THEN 1 ELSE 0 END AS Is_My_Request,

        CASE WHEN EXISTS (
            SELECT 1 FROM Feedback_Entry_User_Responses
            WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
            AND Contact_ID = @ContactID
            AND Response_Type_ID = 1
        ) AND f.Contact_ID != @ContactID THEN 1 ELSE 0 END AS Is_Prayer_Partner

    FROM Feedback_Entries f
    LEFT JOIN Contacts c ON f.Contact_ID = c.Contact_ID
    LEFT JOIN Feedback_Types ft ON f.Feedback_Type_ID = ft.Feedback_Type_ID
    LEFT JOIN dp_files cf ON cf.Record_ID = c.Contact_ID
        AND cf.Table_Name = 'Contacts'
        AND cf.Default_Image = 1
    WHERE
        -- Filter by enabled feedback types
        f.Feedback_Type_ID IN (SELECT value FROM STRING_SPLIT(@Enabled_Types, ','))

        -- Approval filter (if @Require_Approval = 1, only show approved)
        AND (@Require_Approval = 0 OR f.Approved = 1 OR f.Contact_ID = @ContactID)

        -- Visibility filter
        -- 4 = Public (everyone), 3 = Members Only (logged in), 2 = Staff Only (staff), 1 = Private (owner only)
        AND (
            f.Visibility_Level_ID >= 4 -- Public
            OR (f.Visibility_Level_ID >= 3 AND @ContactID IS NOT NULL) -- Members Only (logged in)
            OR (f.Visibility_Level_ID >= 2 AND @Is_Staff = 1) -- Staff Only
            OR f.Contact_ID = @ContactID -- Own prayers regardless of visibility
        )

        -- Campus filter (if enabled)
        -- TODO: Determine correct field name for campus filtering (Congregation_ID doesn't exist)
        -- Possible fields: Household_ID, Congregation_Name, or join to another table
        AND (@Filter_By_Campus = 0 OR @Campus_IDs IS NULL)
        -- AND (@Filter_By_Campus = 0 OR @Campus_IDs IS NULL OR c.[CORRECT_FIELD] IN (SELECT value FROM STRING_SPLIT(@Campus_IDs, ',')))

        -- Date filter (show recent, ongoing, or user's own prayers)
        AND (
            f.Ongoing_Need = 1 -- Always show ongoing needs
            OR DATEDIFF(day, f.Date_Submitted, GETDATE()) <= @Days_To_Show -- Recent prayers
            OR f.Contact_ID = @ContactID -- User's own prayers
            OR EXISTS ( -- Prayers user has prayed for
                SELECT 1 FROM Feedback_Entry_User_Responses
                WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
                AND Contact_ID = @ContactID
            )
        );

    -- =====================================================
    -- STEP 5: Return the complete nested JSON structure
    -- =====================================================

    SELECT (
        SELECT
            -- Widget Title & Subtitle
            @Label_Widget_Title AS Widget_Title,
            @Label_Widget_Subtitle AS Widget_Subtitle,

            -- Frontend Configuration (only settings the client needs)
            (SELECT
                @Default_Card_Layout AS Default_Card_Layout,
                @Allow_Anonymous AS Allow_Anonymous,
                @Show_Contact_Names AS Show_Contact_Names,
                @Require_Approval AS Require_Approval
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ) AS Configuration,

            -- User Info (logged-in user's contact details with image)
            CASE WHEN @ContactID IS NOT NULL THEN
                (SELECT
                    @ContactID AS Contact_ID,
                    c.First_Name,
                    c.Last_Name,
                    c.Display_Name,
                    -- User's profile image from dp_files
                    CASE
                        WHEN cf.File_ID IS NULL THEN NULL
                        ELSE (@ImageURL + '?dn=' + @DomainGUID
                              + '&fn=' + CONVERT(VARCHAR(40), cf.Unique_Name) + '.' + cf.Extension)
                    END AS Image_URL
                 FROM Contacts c
                 LEFT JOIN dp_files cf ON cf.Record_ID = c.Contact_ID
                    AND cf.Table_Name = 'Contacts'
                    AND cf.Default_Image = 1
                 WHERE c.Contact_ID = @ContactID
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            ELSE NULL END AS User_Info,

            -- User Stats (null if not logged in, with labels)
            CASE WHEN @ContactID IS NOT NULL THEN
                (SELECT
                    (SELECT
                        @Label_User_Stats_Total AS Label,
                        @Total_Prayers AS Count
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Total_Prayers,
                    (SELECT
                        @Label_User_Stats_Streak AS Label,
                        @Prayer_Streak AS Count
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Prayer_Streak,
                    (SELECT
                        @Label_User_Stats_Today AS Label,
                        @Prayers_Today AS Count
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Prayers_Today
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                )
            ELSE NULL END AS User_Stats,

            -- My Requests Section
            (SELECT
                @Label_My_Requests_Title AS Title,
                @Label_My_Requests_Description AS Description,
                (SELECT COUNT(*) FROM #AllPrayers WHERE Is_My_Request = 1) AS Total_Count,
                (SELECT
                    p.Feedback_Entry_ID,
                    p.Entry_Title AS Title,
                    p.Description,

                    -- Nested Type object
                    (SELECT
                        p.Feedback_Type AS Label,
                        p.Feedback_Type_ID AS ID
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS [Type],

                    -- Nested Visibility object
                    (SELECT
                        p.Visibility_Level_ID AS Level_ID,
                        p.Visibility_Label AS Label
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Visibility,

                    -- Nested Status object
                    (SELECT
                        p.Approved,
                        CASE WHEN p.Approved = 0 THEN 'Pending Review' ELSE NULL END AS Approval_Badge,
                        p.Ongoing_Need,
                        p.Is_Answered
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Status,

                    -- Nested Dates object
                    (SELECT
                        p.Date_Submitted AS Submitted,
                        p.Target_Date AS Target
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Dates,

                    -- Nested Counts object
                    (SELECT
                        p.Prayer_Count AS Prayers,
                        p.Celebration_Count AS Celebrations
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Counts,

                    -- Nested Latest_Update object
                    (SELECT
                        p.Latest_Update AS [Text],
                        p.Latest_Update_Date AS [Date]
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Latest_Update,

                    -- All Updates array (oldest to newest)
                    (SELECT
                        u.Feedback_Entry_Update_ID,
                        u.Update_Text,
                        u.Update_Date,
                        ISNULL(u.Is_Answered, 0) AS Is_Answered
                     FROM Feedback_Entry_Updates u
                     WHERE u.Feedback_Entry_ID = p.Feedback_Entry_ID
                     ORDER BY u.Update_Date ASC
                     FOR JSON PATH
                    ) AS Updates,

                    -- Nested Actions object
                    (SELECT
                        CAST(1 AS BIT) AS Can_Edit,
                        CAST(CASE WHEN p.Approved = 1 THEN 1 ELSE 0 END AS BIT) AS Can_Add_Update,
                        CAST(CASE WHEN p.Approved = 1 THEN 1 ELSE 0 END AS BIT) AS Can_Mark_Answered
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Actions

                 FROM #AllPrayers p
                 WHERE p.Is_My_Request = 1
                 ORDER BY p.Date_Submitted DESC
                 FOR JSON PATH
                ) AS Items
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ) AS My_Requests,

            -- Prayer Partners Section
            (SELECT
                @Label_Prayer_Partners_Title AS Title,
                @Label_Prayer_Partners_Description AS Description,
                (SELECT COUNT(*) FROM #AllPrayers WHERE Is_Prayer_Partner = 1) AS Total_Count,
                (SELECT
                    p.Feedback_Entry_ID,
                    p.Entry_Title AS Title,
                    p.Description,

                    -- Nested Requester object
                    (SELECT
                        p.Display_Name,
                        p.First_Name,
                        p.Last_Name,
                        p.Contact_Image AS [Image]
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Requester,

                    -- Nested Type object
                    (SELECT
                        p.Feedback_Type AS Label,
                        p.Feedback_Type_ID AS ID
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS [Type],

                    -- Nested Visibility object
                    (SELECT
                        p.Visibility_Level_ID AS Level_ID,
                        p.Visibility_Label AS Label
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Visibility,

                    -- Nested Dates object (includes My_Prayer date)
                    (SELECT
                        p.Date_Submitted AS Submitted,
                        p.User_Prayer_Date AS My_Prayer
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Dates,

                    -- Nested My_Response object
                    (SELECT
                        p.User_Prayer_Message AS [Message]
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS My_Response,

                    -- Nested Counts object
                    (SELECT
                        p.Prayer_Count AS Prayers,
                        p.Celebration_Count AS Celebrations
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Counts,

                    -- Nested Latest_Update object
                    (SELECT
                        p.Latest_Update AS [Text],
                        p.Latest_Update_Date AS [Date]
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Latest_Update,

                    -- Nested Actions object
                    (SELECT
                        CAST(1 AS BIT) AS Can_Pray_Again
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Actions

                 FROM #AllPrayers p
                 WHERE p.Is_Prayer_Partner = 1
                 ORDER BY p.User_Prayer_Date DESC
                 FOR JSON PATH
                ) AS Items
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ) AS Prayer_Partners,

            -- Community Needs Section
            (SELECT
                @Label_Community_Needs_Title AS Title,
                @Label_Community_Needs_Description AS Description,
                (SELECT COUNT(*) FROM #AllPrayers WHERE Is_My_Request = 0 AND Is_Prayer_Partner = 0) AS Total_Count,
                (SELECT
                    p.Feedback_Entry_ID,
                    p.Entry_Title AS Title,
                    p.Description,

                    -- Nested Requester object
                    (SELECT
                        p.Display_Name,
                        p.First_Name,
                        p.Last_Name,
                        p.Contact_Image AS [Image]
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Requester,

                    -- Nested Type object
                    (SELECT
                        p.Feedback_Type AS Label,
                        p.Feedback_Type_ID AS ID
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS [Type],

                    -- Nested Visibility object
                    (SELECT
                        p.Visibility_Level_ID AS Level_ID,
                        p.Visibility_Label AS Label
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Visibility,

                    -- Nested Dates object
                    (SELECT
                        p.Date_Submitted AS Submitted,
                        p.Target_Date AS Target
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Dates,

                    -- Nested Status object (minimal for Community Needs)
                    (SELECT
                        p.Ongoing_Need
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Status,

                    -- Nested Counts object
                    (SELECT
                        p.Prayer_Count AS Prayers,
                        p.Celebration_Count AS Celebrations
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Counts,

                    -- Nested Latest_Update object
                    (SELECT
                        p.Latest_Update AS [Text],
                        p.Latest_Update_Date AS [Date]
                     FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    ) AS Latest_Update

                 FROM #AllPrayers p
                 WHERE p.Is_My_Request = 0 AND p.Is_Prayer_Partner = 0
                 ORDER BY
                    CASE WHEN p.Ongoing_Need = 1 THEN 0 ELSE 1 END,
                    p.Date_Submitted DESC
                 FOR JSON PATH
                ) AS Items
             FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
            ) AS Community_Needs

        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS JsonResult;

    -- Clean up
    DROP TABLE #AllPrayers;

END;
GO

-- =====================================================
-- Configuration Settings Setup Instructions
-- =====================================================
--
-- To configure this widget, use the prayer-widget-configuration.sql script
-- which inserts records into dp_Configuration_Settings with format:
--
-- Application_Code: 'CUSTOMWIDGETS'
-- Key_Name: 'PrayerWidget{Setting}'
--
-- Frontend-Exposed Settings (returned in Configuration object):
--   PrayerWidgetDefaultCardLayout: 'stack' (or 'list')
--   PrayerWidgetAllowAnonymous: '0' (1=yes, 0=no)
--   PrayerWidgetShowContactNames: '1' (1=yes, 0=no)
--   PrayerWidgetRequireApproval: '1' (1=yes, 0=no)
--
-- Server-Side Only Settings (used for filtering, NOT returned):
--   PrayerWidgetFilterByCampus: '0' (1=yes, 0=no)
--   PrayerWidgetCampusIDs: NULL (comma-separated Congregation_IDs)
--   PrayerWidgetEnabledTypes: '1,2' (1=Prayer, 2=Praise)
--   PrayerWidgetDaysToShow: '60'
--
-- Note: Widget title and subtitle are managed via Application Labels,
-- not Configuration Settings. See prayer-widget-labels.sql.
--
-- =====================================================
