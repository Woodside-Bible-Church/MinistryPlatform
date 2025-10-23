-- Fix Stored Procedures to use correct table name
-- The table is named Feedback_Entry_User_Responses, not Feedback_Entry_Responses

-- =====================================================
-- Stored Procedure: Get Feedback Entries with Response Counts
-- Fixed to use Feedback_Entry_User_Responses
-- =====================================================

IF OBJECT_ID('[dbo].[api_Custom_Feedback_With_Responses_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_Feedback_With_Responses_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_Feedback_With_Responses_JSON]
    @FeedbackEntryID INT = NULL,
    @FeedbackTypeID INT = NULL, -- Filter by feedback type (1=Prayer, 2=Praise, NULL=all)
    @UserContactID INT = NULL,
    @OnlyApproved BIT = 1,
    @VisibilityLevelID INT = 4, -- Default to Public (4). Options: 1=Private, 2=Staff Only, 3=Staff & Church, 4=Public, 5=Hidden
    @DaysToShow INT = 60 -- Only show prayers from last X days (unless Ongoing_Need = 1)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        f.Feedback_Entry_ID,
        f.Contact_ID,
        f.Feedback_Type_ID,
        f.Entry_Title,
        f.Description,
        f.Date_Submitted,
        f.Approved,
        f.Ongoing_Need,
        f.Visibility_Level_ID,
        f.Care_Outcome_ID,

        -- Contact info
        c.Display_Name,
        c.First_Name,

        -- Category info
        ft.Feedback_Type,

        -- Response counts (all types)
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID) AS Total_Response_Count,

        -- Prayer count specifically (Response_Type_ID = 1)
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Response_Type_ID = 1) AS Prayer_Count,

        -- Celebration count for praise reports (Response_Type_ID = 3)
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Response_Type_ID = 3) AS Celebration_Count,

        -- Has current user responded to this entry?
        CASE WHEN EXISTS (
            SELECT 1 FROM Feedback_Entry_User_Responses
            WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
            AND Contact_ID = @UserContactID
        ) THEN 1 ELSE 0 END AS User_Has_Responded,

        -- Has current user prayed for this specifically? (Response_Type_ID = 1)
        CASE WHEN EXISTS (
            SELECT 1 FROM Feedback_Entry_User_Responses
            WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
            AND Contact_ID = @UserContactID
            AND Response_Type_ID = 1
        ) THEN 1 ELSE 0 END AS User_Has_Prayed,

        -- Latest update
        (SELECT TOP 1 Update_Text
         FROM Feedback_Entry_Updates
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         ORDER BY Update_Date DESC) AS Latest_Update,

        (SELECT TOP 1 Update_Date
         FROM Feedback_Entry_Updates
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         ORDER BY Update_Date DESC) AS Latest_Update_Date,

        -- Days since submitted (for filtering)
        DATEDIFF(day, f.Date_Submitted, GETDATE()) AS Days_Since_Submitted

    FROM Feedback_Entries f
    LEFT JOIN Contacts c ON f.Contact_ID = c.Contact_ID
    LEFT JOIN Feedback_Types ft ON f.Feedback_Type_ID = ft.Feedback_Type_ID
    WHERE (@FeedbackEntryID IS NULL OR f.Feedback_Entry_ID = @FeedbackEntryID)
    AND (@FeedbackTypeID IS NULL OR f.Feedback_Type_ID = @FeedbackTypeID)
    AND (@OnlyApproved = 0 OR f.Approved = 1)
    AND (@VisibilityLevelID IS NULL OR f.Visibility_Level_ID >= @VisibilityLevelID) -- Show this level and more public
    AND (
        f.Ongoing_Need = 1 -- Always show ongoing needs
        OR DATEDIFF(day, f.Date_Submitted, GETDATE()) <= @DaysToShow -- Or recent prayers
        OR f.Care_Outcome_ID IS NULL -- Or prayers without an outcome set
        OR f.Care_Outcome_ID IN (1, 2) -- Or prayers that are Pending/Assigned (not closed)
    )
    ORDER BY
        -- Prioritize ongoing needs and recent prayers
        CASE WHEN f.Ongoing_Need = 1 THEN 0 ELSE 1 END,
        f.Date_Submitted DESC
    FOR JSON PATH;
END;
GO

-- =====================================================
-- Stored Procedure: Get User Response Stats
-- Fixed to use Feedback_Entry_User_Responses and Feedback_Response_Types
-- =====================================================

IF OBJECT_ID('[dbo].[api_Custom_User_Response_Stats_JSON]', 'P') IS NOT NULL
    DROP PROCEDURE [dbo].[api_Custom_User_Response_Stats_JSON];
GO

CREATE PROCEDURE [dbo].[api_Custom_User_Response_Stats_JSON]
    @ContactID INT,
    @ResponseTypeID INT = 1 -- Default to "Prayed" (1), but can be any Response_Type_ID
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ResponseTypeName NVARCHAR(50);
    SELECT @ResponseTypeName = Response_Type FROM Feedback_Response_Types WHERE Response_Type_ID = @ResponseTypeID;

    SELECT
        @ContactID AS Contact_ID,
        @ResponseTypeID AS Response_Type_ID,
        @ResponseTypeName AS Response_Type_Name,

        -- Total responses of this type
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Contact_ID = @ContactID
         AND Response_Type_ID = @ResponseTypeID) AS Total_Responses,

        -- Responses today
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Contact_ID = @ContactID
         AND Response_Type_ID = @ResponseTypeID
         AND CAST(Response_Date AS DATE) = CAST(GETDATE() AS DATE)) AS Responses_Today,

        -- Current streak (consecutive days with this response type)
        (SELECT COUNT(DISTINCT CAST(Response_Date AS DATE))
         FROM Feedback_Entry_User_Responses r1
         WHERE Contact_ID = @ContactID
         AND Response_Type_ID = @ResponseTypeID
         AND CAST(Response_Date AS DATE) <= CAST(GETDATE() AS DATE)
         AND NOT EXISTS (
             SELECT 1
             WHERE CAST(GETDATE() AS DATE) > CAST(r1.Response_Date AS DATE)
             AND NOT EXISTS (
                 SELECT 1
                 FROM Feedback_Entry_User_Responses r2
                 WHERE r2.Contact_ID = @ContactID
                 AND r2.Response_Type_ID = @ResponseTypeID
                 AND CAST(r2.Response_Date AS DATE) = DATEADD(day, 1, CAST(r1.Response_Date AS DATE))
             )
         )) AS Current_Streak,

        -- Last response date
        (SELECT MAX(Response_Date)
         FROM Feedback_Entry_User_Responses
         WHERE Contact_ID = @ContactID
         AND Response_Type_ID = @ResponseTypeID) AS Last_Response_Date,

        -- Total unique feedback entries responded to
        (SELECT COUNT(DISTINCT Feedback_Entry_ID)
         FROM Feedback_Entry_User_Responses
         WHERE Contact_ID = @ContactID
         AND Response_Type_ID = @ResponseTypeID) AS Unique_Entries_Responded

    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER;
END;
GO
