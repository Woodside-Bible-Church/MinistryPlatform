-- MinistryPlatform Feedback Response System Database Schema
-- Generic tables for tracking responses and updates to ALL feedback types
--
-- Feedback Types in MP:
-- 1 = Prayer Request
-- 2 = Praise Report
-- 3 = Comment
-- 4 = Raving Fan
-- 5 = User Removal Request
--
-- These tables are designed to work with ANY feedback type, not just prayers.
-- The Prayer Widget will filter to types 1 & 2, but other widgets can use these tables too.

-- =====================================================
-- Drop existing objects if they exist (for re-running script)
-- =====================================================

-- Drop tables in reverse order of dependencies
IF OBJECT_ID('[dbo].[Feedback_Entry_Updates]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Feedback_Entry_Updates];
GO

IF OBJECT_ID('[dbo].[Feedback_Entry_User_Responses]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Feedback_Entry_User_Responses];
GO

IF OBJECT_ID('[dbo].[Feedback_Response_Types]', 'U') IS NOT NULL
    DROP TABLE [dbo].[Feedback_Response_Types];
GO

-- =====================================================
-- Feedback_Entry_User_Responses Table
-- Tracks user responses to ANY feedback entry (prayers, praise reports, comments, etc.)
-- Named "User_Responses" to avoid conflict with existing "Responses" table
-- =====================================================

CREATE TABLE [dbo].[Feedback_Entry_User_Responses] (
    [Feedback_Entry_User_Response_ID] INT IDENTITY(1,1) NOT NULL,
    [Feedback_Entry_ID] INT NOT NULL,
    [Contact_ID] INT NOT NULL,
    [Response_Type_ID] INT NOT NULL, -- FK to Feedback_Response_Types (e.g., "Prayed", "Encouraging Word", etc.)
    [Response_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Response_Text] NVARCHAR(4000) NULL, -- Optional text response/comment
    [Domain_ID] INT NOT NULL,

    CONSTRAINT [PK_Feedback_Entry_User_Responses] PRIMARY KEY CLUSTERED ([Feedback_Entry_User_Response_ID] ASC),
    CONSTRAINT [FK_Feedback_Entry_User_Responses_Feedback] FOREIGN KEY ([Feedback_Entry_ID])
        REFERENCES [dbo].[Feedback_Entries] ([Feedback_Entry_ID]),
    CONSTRAINT [FK_Feedback_Entry_User_Responses_Contact] FOREIGN KEY ([Contact_ID])
        REFERENCES [dbo].[Contacts] ([Contact_ID]),
    CONSTRAINT [FK_Feedback_Entry_User_Responses_Domain] FOREIGN KEY ([Domain_ID])
        REFERENCES [dbo].[dp_Domains] ([Domain_ID])
);

-- Index for faster lookups by feedback entry
CREATE NONCLUSTERED INDEX [IX_Feedback_Entry_User_Responses_Entry]
    ON [dbo].[Feedback_Entry_User_Responses] ([Feedback_Entry_ID]);

-- Index for faster lookups by contact (for user's prayer history)
CREATE NONCLUSTERED INDEX [IX_Feedback_Entry_User_Responses_Contact]
    ON [dbo].[Feedback_Entry_User_Responses] ([Contact_ID], [Response_Date] DESC);

-- Composite index for checking if user already prayed for specific entry
CREATE NONCLUSTERED INDEX [IX_Feedback_Entry_User_Responses_Entry_Contact]
    ON [dbo].[Feedback_Entry_User_Responses] ([Feedback_Entry_ID], [Contact_ID]);
GO

-- =====================================================
-- Feedback_Response_Types Table (Lookup)
-- Types of responses users can make to ANY feedback entry
-- Generic enough to work across all feedback types
-- =====================================================

CREATE TABLE [dbo].[Feedback_Response_Types] (
    [Response_Type_ID] INT IDENTITY(1,1) NOT NULL,
    [Response_Type] NVARCHAR(50) NOT NULL,
    [Description] NVARCHAR(255) NULL,
    [Applicable_To_Feedback_Types] NVARCHAR(50) NULL, -- Comma-separated list of Feedback_Type_IDs (e.g., "1,2" for prayers & praise)
    [Domain_ID] INT NOT NULL,

    CONSTRAINT [PK_Feedback_Response_Types] PRIMARY KEY CLUSTERED ([Response_Type_ID] ASC),
    CONSTRAINT [FK_Feedback_Response_Types_Domain] FOREIGN KEY ([Domain_ID])
        REFERENCES [dbo].[dp_Domains] ([Domain_ID])
);
GO

-- Add FK constraint after Feedback_Response_Types is created
ALTER TABLE [dbo].[Feedback_Entry_User_Responses]
    ADD CONSTRAINT [FK_Feedback_Entry_User_Responses_Response_Type]
    FOREIGN KEY ([Response_Type_ID]) REFERENCES [dbo].[Feedback_Response_Types] ([Response_Type_ID]);
GO

-- Insert default response types with applicability
-- Domain_ID = 1 is the default domain for most MP installations
INSERT INTO [dbo].[Feedback_Response_Types] ([Response_Type], [Description], [Applicable_To_Feedback_Types], [Domain_ID])
VALUES
    -- For Prayer Requests (Type 1)
    ('Prayed', 'User prayed for this request', '1', 1),
    ('Still Praying', 'User is continuing to pray for an ongoing need', '1', 1),

    -- For Praise Reports (Type 2)
    ('Celebrate', 'User celebrated this praise report', '2', 1),
    ('Amen', 'User affirmed this praise report', '2', 1),

    -- Generic responses (applicable to multiple types)
    ('Encouraging Word', 'User left an encouraging comment', '1,2,3', 1),
    ('Like', 'User liked/appreciated this entry', '1,2,3,4', 1),
    ('Helpful', 'User found this helpful', '3,4', 1),

    -- Status updates (usually by original requester)
    ('Answered', 'Prayer was answered', '1', 1),
    ('Resolved', 'Issue was resolved', '1,3,5', 1);
GO

-- =====================================================
-- Feedback_Entry_Updates Table
-- Updates/testimonies posted by feedback entry authors
-- Works for prayer updates, praise follow-ups, etc.
-- =====================================================

CREATE TABLE [dbo].[Feedback_Entry_Updates] (
    [Feedback_Entry_Update_ID] INT IDENTITY(1,1) NOT NULL,
    [Feedback_Entry_ID] INT NOT NULL,
    [Contact_ID] INT NOT NULL, -- Person posting the update (usually original requester)
    [Update_Text] NVARCHAR(4000) NOT NULL,
    [Update_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Is_Answered] BIT NULL, -- TRUE if this update marks the prayer as answered
    [Domain_ID] INT NOT NULL,

    CONSTRAINT [PK_Feedback_Entry_Updates] PRIMARY KEY CLUSTERED ([Feedback_Entry_Update_ID] ASC),
    CONSTRAINT [FK_Feedback_Entry_Updates_Feedback] FOREIGN KEY ([Feedback_Entry_ID])
        REFERENCES [dbo].[Feedback_Entries] ([Feedback_Entry_ID]),
    CONSTRAINT [FK_Feedback_Entry_Updates_Contact] FOREIGN KEY ([Contact_ID])
        REFERENCES [dbo].[Contacts] ([Contact_ID]),
    CONSTRAINT [FK_Feedback_Entry_Updates_Domain] FOREIGN KEY ([Domain_ID])
        REFERENCES [dbo].[dp_Domains] ([Domain_ID])
);

-- Index for faster lookups by feedback entry
CREATE NONCLUSTERED INDEX [IX_Feedback_Entry_Updates_Entry]
    ON [dbo].[Feedback_Entry_Updates] ([Feedback_Entry_ID], [Update_Date] DESC);
GO

-- =====================================================
-- Stored Procedure: Get Feedback Entries with Response Counts
-- Generic proc that works for prayers, praise reports, or any feedback type
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
        f.Target_Date,
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
        f.Date_Submitted DESC;

    -- Note: Do NOT use FOR JSON PATH when calling via MinistryPlatform /procs/ API
    -- MinistryPlatform automatically converts the result to JSON
END;
GO

-- =====================================================
-- Stored Procedure: Get User Response Stats
-- Works for any response type - prayers, celebrations, etc.
-- Uses the JsonResult pattern for nested JSON structure
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

    -- Return a single JsonResult column containing the entire nested JSON structure
    -- MP will wrap this in an array: [{"JsonResult": {...}}]
    -- Client-side: const data = response[0].JsonResult;
    SELECT (
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

        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS JsonResult;
END;
GO
