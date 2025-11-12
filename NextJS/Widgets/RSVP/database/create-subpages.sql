-- ===================================================================
-- Create Sub Pages for Projects
-- ===================================================================
-- Adds Project RSVPs as a sub page of Projects
-- Similar to how Project Events works
-- ===================================================================

USE [MinistryPlatform]
GO

-- Get the Projects Page_ID (should be consistent across MP instances)
DECLARE @ProjectsPageID INT;
SELECT @ProjectsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Projects';

-- Get the Project RSVPs Page_ID (965 from your screenshot)
DECLARE @ProjectRSVPsPageID INT = 965;

-- ===================================================================
-- 1. Add Project RSVPs as Sub Page of Projects
-- ===================================================================
IF NOT EXISTS (
    SELECT 1 FROM [dbo].[dp_Sub_Pages]
    WHERE [Parent_Page_ID] = @ProjectsPageID
    AND [Target_Page_ID] = @ProjectRSVPsPageID
)
BEGIN
    INSERT INTO [dbo].[dp_Sub_Pages] (
        [Parent_Page_ID],
        [Display_Name],
        [View_Order],
        [Parent_Record_Information],
        [Parent_Filter_Key],
        [Target_Page_Information],
        [Target_Page_ID],
        [Target_Filter_Key],
        [Select_From_Field_Name],
        [Default_Field_List],
        [Default_View],
        [Other_Dialogue_Options],
        [Messaging_Default],
        [Display_Copy],
        [On_Quick_Add],
        [System_Name],
        [Image_Reference_Field],
        [Facts_View_ID],
        [Global_Filter_ID_Field]
    )
    VALUES (
        @ProjectsPageID,                    -- Parent: Projects
        'RSVPs',                           -- Display name in sub page tab
        2,                                 -- View order (after Events which is 1)
        NULL,                              -- Parent_Record_Information
        'Project_ID',                      -- Filter key from Projects
        NULL,                              -- Target_Page_Information
        @ProjectRSVPsPageID,              -- Target page: Project RSVPs
        'Project_ID',                      -- Foreign key in Project_RSVPs
        NULL,                              -- Select_From_Field_Name
        'Project_RSVPs.RSVP_Title
,Project_RSVPs.Start_Date
,Project_RSVPs.End_Date
,Project_RSVPs.Is_Active',
        NULL,                              -- Default_View
        NULL,                              -- Other_Dialogue_Options
        0,                                 -- Messaging_Default: No
        0,                                 -- Display Copy: No
        0,                                 -- On_Quick_Add: No
        NULL,                              -- System_Name
        NULL,                              -- Image_Reference_Field
        NULL,                              -- Facts_View_ID
        NULL                               -- Global_Filter_ID_Field
    );
    PRINT 'Created Sub Page: Projects -> RSVPs';
END

-- ===================================================================
-- 2. Add Project RSVP Questions as Sub Page of Project RSVPs
-- ===================================================================
DECLARE @ProjectRSVPQuestionsPageID INT = 966;

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[dp_Sub_Pages]
    WHERE [Parent_Page_ID] = @ProjectRSVPsPageID
    AND [Target_Page_ID] = @ProjectRSVPQuestionsPageID
)
BEGIN
    INSERT INTO [dbo].[dp_Sub_Pages] (
        [Parent_Page_ID],
        [Display_Name],
        [View_Order],
        [Parent_Filter_Key],
        [Target_Page_ID],
        [Target_Filter_Key],
        [Default_Field_List],
        [Display_Copy]
    )
    VALUES (
        @ProjectRSVPsPageID,                    -- Parent: Project RSVPs
        'Questions',                            -- Display name
        1,                                      -- View order
        'Project_RSVP_ID',                     -- Filter key
        @ProjectRSVPQuestionsPageID,           -- Target page
        'Project_RSVP_ID',                     -- Foreign key
        'Project_RSVP_Questions.Question_Text
,Project_RSVP_Questions.Question_Type_ID_Table.Question_Type_Name
,Project_RSVP_Questions.Field_Order
,Project_RSVP_Questions.Is_Required
,Project_RSVP_Questions.Active',
        0
    );
    PRINT 'Created Sub Page: Project RSVPs -> Questions';
END

-- ===================================================================
-- 3. Add Question Options as Sub Page of Project RSVP Questions
-- ===================================================================
DECLARE @QuestionOptionsPageID INT = 967;

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[dp_Sub_Pages]
    WHERE [Parent_Page_ID] = @ProjectRSVPQuestionsPageID
    AND [Target_Page_ID] = @QuestionOptionsPageID
)
BEGIN
    INSERT INTO [dbo].[dp_Sub_Pages] (
        [Parent_Page_ID],
        [Display_Name],
        [View_Order],
        [Parent_Filter_Key],
        [Target_Page_ID],
        [Target_Filter_Key],
        [Default_Field_List],
        [Display_Copy]
    )
    VALUES (
        @ProjectRSVPQuestionsPageID,           -- Parent: Project RSVP Questions
        'Options',                             -- Display name
        1,                                     -- View order
        'Project_RSVP_Question_ID',           -- Filter key
        @QuestionOptionsPageID,                -- Target page
        'Project_RSVP_Question_ID',           -- Foreign key
        'Question_Options.Option_Text
,Question_Options.Option_Value
,Question_Options.Display_Order',
        0
    );
    PRINT 'Created Sub Page: Project RSVP Questions -> Options';
END

-- ===================================================================
-- 4. Add Project Confirmation Cards as Sub Page of Project RSVPs
-- ===================================================================
DECLARE @ProjectConfirmationCardsPageID INT = 968;

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[dp_Sub_Pages]
    WHERE [Parent_Page_ID] = @ProjectRSVPsPageID
    AND [Target_Page_ID] = @ProjectConfirmationCardsPageID
)
BEGIN
    INSERT INTO [dbo].[dp_Sub_Pages] (
        [Parent_Page_ID],
        [Display_Name],
        [View_Order],
        [Parent_Filter_Key],
        [Target_Page_ID],
        [Target_Filter_Key],
        [Default_Field_List],
        [Display_Copy]
    )
    VALUES (
        @ProjectRSVPsPageID,                    -- Parent: Project RSVPs
        'Confirmation Cards',                   -- Display name
        2,                                      -- View order (after Questions)
        'Project_RSVP_ID',                     -- Filter key
        @ProjectConfirmationCardsPageID,       -- Target page
        'Project_RSVP_ID',                     -- Foreign key
        'Project_Confirmation_Cards.Card_Type_ID_Table.Card_Type_Name
,Project_Confirmation_Cards.Display_Order
,Project_Confirmation_Cards.Congregation_ID_Table.Congregation_Name
,Project_Confirmation_Cards.Is_Active',
        0
    );
    PRINT 'Created Sub Page: Project RSVPs -> Confirmation Cards';
END

-- ===================================================================
-- 5. Add Event RSVPs as Sub Page of Project RSVPs
-- ===================================================================
DECLARE @EventRSVPsPageID INT = 969;

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[dp_Sub_Pages]
    WHERE [Parent_Page_ID] = @ProjectRSVPsPageID
    AND [Target_Page_ID] = @EventRSVPsPageID
)
BEGIN
    INSERT INTO [dbo].[dp_Sub_Pages] (
        [Parent_Page_ID],
        [Display_Name],
        [View_Order],
        [Parent_Filter_Key],
        [Target_Page_ID],
        [Target_Filter_Key],
        [Default_Field_List],
        [Display_Copy]
    )
    VALUES (
        @ProjectRSVPsPageID,                    -- Parent: Project RSVPs
        'Submitted RSVPs',                      -- Display name
        3,                                      -- View order
        'Project_RSVP_ID',                     -- Filter key
        @EventRSVPsPageID,                     -- Target page
        'Project_RSVP_ID',                     -- Foreign key
        'Event_RSVPs.Event_ID_Table.Event_Title
,Event_RSVPs.Contact_ID_Table.Display_Name
,Event_RSVPs.First_Name
,Event_RSVPs.Last_Name
,Event_RSVPs.Email_Address
,Event_RSVPs.Submission_Date
,Event_RSVPs.Confirmation_Code',
        0
    );
    PRINT 'Created Sub Page: Project RSVPs -> Submitted RSVPs';
END

-- ===================================================================
-- 6. Add Event RSVP Answers as Sub Page of Event RSVPs
-- ===================================================================
DECLARE @EventRSVPAnswersPageID INT = 970;

IF NOT EXISTS (
    SELECT 1 FROM [dbo].[dp_Sub_Pages]
    WHERE [Parent_Page_ID] = @EventRSVPsPageID
    AND [Target_Page_ID] = @EventRSVPAnswersPageID
)
BEGIN
    INSERT INTO [dbo].[dp_Sub_Pages] (
        [Parent_Page_ID],
        [Display_Name],
        [View_Order],
        [Parent_Filter_Key],
        [Target_Page_ID],
        [Target_Filter_Key],
        [Default_Field_List],
        [Display_Copy]
    )
    VALUES (
        @EventRSVPsPageID,                      -- Parent: Event RSVPs
        'Answers',                              -- Display name
        1,                                      -- View order
        'Event_RSVP_ID',                       -- Filter key
        @EventRSVPAnswersPageID,               -- Target page
        'Event_RSVP_ID',                       -- Foreign key
        'Event_RSVP_Answers.Project_RSVP_Question_ID_Table.Question_Text
,Event_RSVP_Answers.Answer_Text
,Event_RSVP_Answers.Answer_Numeric
,Event_RSVP_Answers.Answer_Boolean
,Event_RSVP_Answers.Answer_Date',
        0
    );
    PRINT 'Created Sub Page: Event RSVPs -> Answers';
END

-- ===================================================================
-- Summary
-- ===================================================================
PRINT '';
PRINT '===================================================================';
PRINT 'Sub Pages Created Successfully!';
PRINT '';
PRINT 'Created sub page hierarchy:';
PRINT '  Projects';
PRINT '    └── RSVPs (Project RSVPs)';
PRINT '         ├── Questions';
PRINT '         │    └── Options';
PRINT '         ├── Confirmation Cards';
PRINT '         └── Submitted RSVPs';
PRINT '              └── Answers';
PRINT '';
PRINT 'Users can now navigate through these pages in MinistryPlatform!';
PRINT '===================================================================';
GO
