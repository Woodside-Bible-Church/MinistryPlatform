-- Add Target_Date field to Feedback_Entries table
-- This replaces the concept of "Ongoing Need" with a more specific target date
-- If Target_Date is NULL, the prayer is considered ongoing
-- If Target_Date is set, it's a specific date-based prayer request

USE [MinistryPlatform]
GO

-- Add Target_Date column if it doesn't exist
IF NOT EXISTS (
    SELECT *
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Feedback_Entries'
    AND COLUMN_NAME = 'Target_Date'
)
BEGIN
    ALTER TABLE [dbo].[Feedback_Entries]
    ADD [Target_Date] DATETIME NULL;

    PRINT 'Target_Date column added to Feedback_Entries';
END
ELSE
BEGIN
    PRINT 'Target_Date column already exists in Feedback_Entries';
END
GO

-- Add index for faster filtering by Target_Date
IF NOT EXISTS (
    SELECT *
    FROM sys.indexes
    WHERE name = 'IX_Feedback_Entries_Target_Date'
    AND object_id = OBJECT_ID('dbo.Feedback_Entries')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Feedback_Entries_Target_Date]
        ON [dbo].[Feedback_Entries] ([Target_Date] ASC)
        WHERE [Target_Date] IS NOT NULL;

    PRINT 'Index IX_Feedback_Entries_Target_Date created';
END
ELSE
BEGIN
    PRINT 'Index IX_Feedback_Entries_Target_Date already exists';
END
GO

-- Update stored procedure to include Target_Date
IF OBJECT_ID('[dbo].[api_Custom_Feedback_With_Responses_JSON]', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE [dbo].[api_Custom_Feedback_With_Responses_JSON];
    PRINT 'Dropped existing api_Custom_Feedback_With_Responses_JSON procedure';
END
GO

CREATE PROCEDURE [dbo].[api_Custom_Feedback_With_Responses_JSON]
    @FeedbackEntryID INT = NULL,
    @FeedbackTypeID INT = NULL,
    @UserContactID INT = NULL,
    @OnlyApproved BIT = 1,
    @VisibilityLevelID INT = 4,
    @DaysToShow INT = 60
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
        f.Target_Date, -- NEW FIELD
        f.Visibility_Level_ID,
        f.Care_Outcome_ID,

        -- Contact info
        c.Display_Name,
        c.First_Name,

        -- Category info
        ft.Feedback_Type,

        -- Response counts
        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID) AS Total_Response_Count,

        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Response_Type_ID = 1) AS Prayer_Count,

        (SELECT COUNT(*)
         FROM Feedback_Entry_User_Responses
         WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
         AND Response_Type_ID = 3) AS Celebration_Count,

        -- Has current user responded?
        CASE WHEN EXISTS (
            SELECT 1 FROM Feedback_Entry_User_Responses
            WHERE Feedback_Entry_ID = f.Feedback_Entry_ID
            AND Contact_ID = @UserContactID
        ) THEN 1 ELSE 0 END AS User_Has_Responded,

        -- Has current user prayed specifically?
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

        -- Days since submitted
        DATEDIFF(day, f.Date_Submitted, GETDATE()) AS Days_Since_Submitted

    FROM Feedback_Entries f
    LEFT JOIN Contacts c ON f.Contact_ID = c.Contact_ID
    LEFT JOIN Feedback_Types ft ON f.Feedback_Type_ID = ft.Feedback_Type_ID
    WHERE (@FeedbackEntryID IS NULL OR f.Feedback_Entry_ID = @FeedbackEntryID)
    AND (@FeedbackTypeID IS NULL OR f.Feedback_Type_ID = @FeedbackTypeID)
    AND (@OnlyApproved = 0 OR f.Approved = 1)
    AND (@VisibilityLevelID IS NULL OR f.Visibility_Level_ID >= @VisibilityLevelID)
    AND (
        f.Ongoing_Need = 1 -- Always show ongoing needs
        OR f.Target_Date IS NOT NULL -- Always show prayers with target dates
        OR DATEDIFF(day, f.Date_Submitted, GETDATE()) <= @DaysToShow
        OR f.Care_Outcome_ID IS NULL
        OR f.Care_Outcome_ID IN (1, 2)
    )
    ORDER BY
        -- Prioritize prayers with upcoming target dates
        CASE WHEN f.Target_Date IS NOT NULL AND f.Target_Date >= GETDATE() THEN 0 ELSE 1 END,
        -- Then ongoing needs
        CASE WHEN f.Ongoing_Need = 1 THEN 0 ELSE 1 END,
        -- Then by submission date
        f.Date_Submitted DESC;
END;
GO

PRINT 'Stored procedure api_Custom_Feedback_With_Responses_JSON updated with Target_Date field';
PRINT '';
PRINT '========================================';
PRINT 'Migration Complete!';
PRINT '========================================';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Clear MinistryPlatform database cache (Administration → Database Cache → Clear Cache)';
PRINT '2. Verify Target_Date column exists: SELECT TOP 1 * FROM Feedback_Entries';
PRINT '3. Test the stored procedure: EXEC api_Custom_Feedback_With_Responses_JSON @OnlyApproved = 1';
PRINT '';
