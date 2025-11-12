-- ===================================================================
-- Create Pages Records for RSVP Tables
-- ===================================================================
-- This makes the RSVP tables accessible via MinistryPlatform API
-- Run this AFTER create-rsvp-schema.sql
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- 1. Question_Types Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Question_Types')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Question Types',
        'Question Type',
        'Lookup table for RSVP question types (Counter, Checkbox, Text, etc.)',
        1000,
        'Question_Types',
        'Question_Type_ID',
        'Question_Types.Question_Type_ID
,Question_Types.Question_Type_Name
,Question_Types.Component_Name
,Question_Types.Description',
        'Question_Types.Question_Type_Name',
        1
    );
    PRINT 'Created Page: Question Types';
END

-- ===================================================================
-- 2. Card_Types Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Card_Types')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Card Types',
        'Card Type',
        'Lookup table for RSVP confirmation card types (Map, QR Code, Share, etc.)',
        1001,
        'Card_Types',
        'Card_Type_ID',
        'Card_Types.Card_Type_ID
,Card_Types.Card_Type_Name
,Card_Types.Component_Name
,Card_Types.Icon_Name
,Card_Types.Description',
        'Card_Types.Card_Type_Name',
        1
    );
    PRINT 'Created Page: Card Types';
END

-- ===================================================================
-- 3. Project_RSVPs Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Project_RSVPs')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Project RSVPs',
        'Project RSVP',
        'RSVP configurations for projects',
        1002,
        'Project_RSVPs',
        'Project_RSVP_ID',
        'Project_RSVPs.Project_RSVP_ID
,Project_RSVPs.Project_ID_Table.Project_Title
,Project_RSVPs.RSVP_Title
,Project_RSVPs.RSVP_Description
,Project_RSVPs.Start_Date
,Project_RSVPs.End_Date
,Project_RSVPs.Is_Active',
        'Project_RSVPs.RSVP_Title',
        1
    );
    PRINT 'Created Page: Project RSVPs';
END

-- ===================================================================
-- 4. Project_RSVP_Questions Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Project_RSVP_Questions')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Project RSVP Questions',
        'Project RSVP Question',
        'Custom questions for RSVP forms',
        1003,
        'Project_RSVP_Questions',
        'Project_RSVP_Question_ID',
        'Project_RSVP_Questions.Project_RSVP_Question_ID
,Project_RSVP_Questions.Project_RSVP_ID_Table.RSVP_Title
,Project_RSVP_Questions.Question_Text
,Project_RSVP_Questions.Question_Type_ID_Table.Question_Type_Name
,Project_RSVP_Questions.Field_Order
,Project_RSVP_Questions.Is_Required
,Project_RSVP_Questions.Active',
        'Project_RSVP_Questions.Question_Text',
        1
    );
    PRINT 'Created Page: Project RSVP Questions';
END

-- ===================================================================
-- 5. Question_Options Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Question_Options')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Question Options',
        'Question Option',
        'Options for dropdown, radio, and multi-select questions',
        1004,
        'Question_Options',
        'Question_Option_ID',
        'Question_Options.Question_Option_ID
,Question_Options.Project_RSVP_Question_ID_Table.Question_Text
,Question_Options.Option_Text
,Question_Options.Option_Value
,Question_Options.Display_Order',
        'Question_Options.Option_Text',
        1
    );
    PRINT 'Created Page: Question Options';
END

-- ===================================================================
-- 6. Project_Confirmation_Cards Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Project_Confirmation_Cards')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Project Confirmation Cards',
        'Project Confirmation Card',
        'Confirmation page cards for RSVP widgets',
        1005,
        'Project_Confirmation_Cards',
        'Project_Confirmation_Card_ID',
        'Project_Confirmation_Cards.Project_Confirmation_Card_ID
,Project_Confirmation_Cards.Project_RSVP_ID_Table.RSVP_Title
,Project_Confirmation_Cards.Card_Type_ID_Table.Card_Type_Name
,Project_Confirmation_Cards.Display_Order
,Project_Confirmation_Cards.Congregation_ID_Table.Congregation_Name
,Project_Confirmation_Cards.Is_Active',
        'Project_Confirmation_Cards.Card_Type_ID_Table.Card_Type_Name',
        1
    );
    PRINT 'Created Page: Project Confirmation Cards';
END

-- ===================================================================
-- 7. Event_RSVPs Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Event_RSVPs')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Event RSVPs',
        'Event RSVP',
        'Submitted RSVPs for events',
        1006,
        'Event_RSVPs',
        'Event_RSVP_ID',
        'Event_RSVPs.Event_RSVP_ID
,Event_RSVPs.Event_ID_Table.Event_Title
,Event_RSVPs.Contact_ID_Table.Display_Name
,Event_RSVPs.First_Name
,Event_RSVPs.Last_Name
,Event_RSVPs.Email_Address
,Event_RSVPs.Submission_Date
,Event_RSVPs.Confirmation_Code
,Event_RSVPs.Is_Guest',
        'Event_RSVPs.First_Name + '' '' + Event_RSVPs.Last_Name + '' ('' + Event_RSVPs.Confirmation_Code + '')''',
        1
    );
    PRINT 'Created Page: Event RSVPs';
END

-- ===================================================================
-- 8. Event_RSVP_Answers Page
-- ===================================================================
IF NOT EXISTS (SELECT 1 FROM [dbo].[dp_Pages] WHERE [Table_Name] = 'Event_RSVP_Answers')
BEGIN
    INSERT INTO [dbo].[dp_Pages] (
        [Display_Name],
        [Singular_Name],
        [Description],
        [View_Order],
        [Table_Name],
        [Primary_Key],
        [Default_Field_List],
        [Selected_Record_Expression],
        [Display_Copy]
    )
    VALUES (
        'Event RSVP Answers',
        'Event RSVP Answer',
        'User answers to RSVP questions',
        1007,
        'Event_RSVP_Answers',
        'Event_RSVP_Answer_ID',
        'Event_RSVP_Answers.Event_RSVP_Answer_ID
,Event_RSVP_Answers.Event_RSVP_ID_Table.Confirmation_Code
,Event_RSVP_Answers.Project_RSVP_Question_ID_Table.Question_Text
,Event_RSVP_Answers.Answer_Text
,Event_RSVP_Answers.Answer_Numeric
,Event_RSVP_Answers.Answer_Boolean
,Event_RSVP_Answers.Answer_Date',
        'Event_RSVP_Answers.Project_RSVP_Question_ID_Table.Question_Text',
        1
    );
    PRINT 'Created Page: Event RSVP Answers';
END

-- ===================================================================
-- Summary
-- ===================================================================
PRINT '';
PRINT '===================================================================';
PRINT 'RSVP Pages Created Successfully!';
PRINT '';
PRINT 'Created 8 Pages for API access:';
PRINT '  - Question Types';
PRINT '  - Card Types';
PRINT '  - Project RSVPs';
PRINT '  - Project RSVP Questions';
PRINT '  - Question Options';
PRINT '  - Project Confirmation Cards';
PRINT '  - Event RSVPs';
PRINT '  - Event RSVP Answers';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Grant API permissions via MinistryPlatform Admin Console';
PRINT '  2. Add stored procedures to API_Procedures table (if needed)';
PRINT '  3. Test API access with your OAuth credentials';
PRINT '===================================================================';
GO
