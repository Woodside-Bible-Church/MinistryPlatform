-- ===================================================================
-- Create Sample Christmas 2024 RSVP Configuration
-- ===================================================================
-- This creates a complete working example for Christmas services
-- Run this AFTER create-rsvp-schema.sql and seed-lookup-tables.sql
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- STEP 1: Create a Project (if not exists)
-- ===================================================================
-- Note: Assumes Projects table exists from Project Budgets app
-- Adjust Project_ID as needed based on your existing data

DECLARE @ProjectID INT;
DECLARE @ProjectRSVPID INT;

-- Check if Projects table exists
IF OBJECT_ID(N'[dbo].[Projects]', N'U') IS NULL
BEGIN
    PRINT 'WARNING: Projects table does not exist yet';
    PRINT 'Please create a Project manually in MinistryPlatform and update @ProjectID below';
    PRINT 'OR run the Project Budgets database schema first';
    PRINT '';

    -- Use a placeholder Project_ID
    -- IMPORTANT: Replace this with your actual Project_ID
    SET @ProjectID = 1;

    PRINT 'Using placeholder Project_ID = 1';
    PRINT 'You MUST update this to your actual Project_ID!';
END
ELSE
BEGIN
    -- Check if Christmas 2024 project exists
    SELECT @ProjectID = Project_ID FROM Projects WHERE Project_Title = 'Christmas Services 2024';

    IF @ProjectID IS NULL
    BEGIN
        -- Create the project using actual Projects table columns
        INSERT INTO Projects (
            Project_Title,
            Project_Coordinator,
            Project_Start,
            Project_End,
            Project_Approved,
            Domain_ID
        )
        VALUES (
            'Christmas Services 2024',
            1,  -- Default coordinator Contact_ID - update as needed
            '2024-12-24',
            '2024-12-25',
            1,  -- Approved
            1   -- Domain_ID
        );

        SET @ProjectID = SCOPE_IDENTITY();
        PRINT 'Created new Project: Christmas Services 2024 (ID: ' + CAST(@ProjectID AS NVARCHAR) + ')';
    END
    ELSE
    BEGIN
        PRINT 'Using existing Project: Christmas Services 2024 (ID: ' + CAST(@ProjectID AS NVARCHAR) + ')';
    END
END

-- ===================================================================
-- STEP 2: Create Project_RSVP Configuration
-- ===================================================================

-- Check if RSVP config already exists for this project
SELECT @ProjectRSVPID = Project_RSVP_ID FROM Project_RSVPs WHERE Project_ID = @ProjectID;

IF @ProjectRSVPID IS NULL
BEGIN
    INSERT INTO Project_RSVPs (
        Project_ID,
        RSVP_Title,
        RSVP_Description,
        Header_Image_URL,
        Start_Date,
        End_Date,
        Is_Active,
        Require_Contact_Lookup,
        Allow_Guest_Submission,
        Domain_ID
    )
    VALUES (
        @ProjectID,
        'Christmas Services 2024',
        'Join us for a special Christmas celebration! Reserve your spot for one of our services across all 14 Woodside campuses.',
        '/assets/christmas-header.jpg',
        '2024-11-01 00:00:00',  -- RSVPs open November 1
        '2024-12-25 23:59:59',  -- RSVPs close end of Christmas Day
        1,  -- Is_Active
        0,  -- Don't require contact lookup
        1,  -- Allow guests
        1   -- Domain_ID
    );

    SET @ProjectRSVPID = SCOPE_IDENTITY();
    PRINT 'Created Project_RSVP (ID: ' + CAST(@ProjectRSVPID AS NVARCHAR) + ')';
END
ELSE
BEGIN
    PRINT 'Project_RSVP already exists (ID: ' + CAST(@ProjectRSVPID AS NVARCHAR) + ')';
END

-- ===================================================================
-- STEP 3: Add RSVP Questions
-- ===================================================================

-- Question 1: How many people?
IF NOT EXISTS (SELECT 1 FROM Project_RSVP_Questions WHERE Project_RSVP_ID = @ProjectRSVPID AND Field_Order = 1)
BEGIN
    INSERT INTO Project_RSVP_Questions (
        Project_RSVP_ID,
        Question_Text,
        Question_Type_ID,
        Field_Order,
        Is_Required,
        Helper_Text,
        Min_Value,
        Max_Value,
        Default_Value,
        Placeholder_Text,
        Active,
        Domain_ID
    )
    VALUES (
        @ProjectRSVPID,
        'How many people?',
        1,  -- Counter type
        1,  -- First question
        1,  -- Required
        NULL,
        1,  -- Min 1 person
        99, -- Max 99 people
        '1',
        NULL,
        1,  -- Active
        1   -- Domain_ID
    );
    PRINT 'Added question: How many people?';
END

-- Question 2: First time visitor?
IF NOT EXISTS (SELECT 1 FROM Project_RSVP_Questions WHERE Project_RSVP_ID = @ProjectRSVPID AND Field_Order = 2)
BEGIN
    INSERT INTO Project_RSVP_Questions (
        Project_RSVP_ID,
        Question_Text,
        Question_Type_ID,
        Field_Order,
        Is_Required,
        Helper_Text,
        Min_Value,
        Max_Value,
        Default_Value,
        Placeholder_Text,
        Active,
        Domain_ID
    )
    VALUES (
        @ProjectRSVPID,
        'This is my first visit to Woodside',
        2,  -- Checkbox type
        2,  -- Second question
        0,  -- Not required
        'We''d love to help you find your way and make you feel welcome.',
        NULL,
        NULL,
        'false',
        NULL,
        1,  -- Active
        1   -- Domain_ID
    );
    PRINT 'Added question: This is my first visit to Woodside';
END

-- ===================================================================
-- STEP 4: Add Confirmation Cards
-- ===================================================================

-- Card 1: What to Expect (Instructions)
IF NOT EXISTS (SELECT 1 FROM Project_Confirmation_Cards WHERE Project_RSVP_ID = @ProjectRSVPID AND Card_Type_ID = 1)
BEGIN
    INSERT INTO Project_Confirmation_Cards (
        Project_RSVP_ID,
        Card_Type_ID,
        Display_Order,
        Is_Active,
        Card_Configuration,
        Congregation_ID,
        Domain_ID
    )
    VALUES (
        @ProjectRSVPID,
        1,  -- Instructions card
        1,  -- First card
        1,  -- Active
        '{
            "title": "What to Expect",
            "bullets": [
                {
                    "icon": "Clock",
                    "text": "Arrive early to find parking and get settled"
                },
                {
                    "icon": "Baby",
                    "text": "Kids programming available for all ages"
                },
                {
                    "icon": "Music",
                    "text": "Services last approximately 60 minutes"
                },
                {
                    "icon": "Heart",
                    "text": "Dress casually - come as you are!"
                }
            ]
        }',
        NULL,  -- All campuses
        1
    );
    PRINT 'Added card: What to Expect';
END

-- Card 2: QR Code for Check-in
IF NOT EXISTS (SELECT 1 FROM Project_Confirmation_Cards WHERE Project_RSVP_ID = @ProjectRSVPID AND Card_Type_ID = 3)
BEGIN
    INSERT INTO Project_Confirmation_Cards (
        Project_RSVP_ID,
        Card_Type_ID,
        Display_Order,
        Is_Active,
        Card_Configuration,
        Congregation_ID,
        Domain_ID
    )
    VALUES (
        @ProjectRSVPID,
        3,  -- QR Code card
        2,  -- Second card
        1,  -- Active
        '{
            "title": "Check-In Code",
            "description": "Show this code when you arrive for faster check-in",
            "includeConfirmationNumber": true
        }',
        NULL,  -- All campuses
        1
    );
    PRINT 'Added card: Check-In Code';
END

-- Card 3: Share with Friends
IF NOT EXISTS (SELECT 1 FROM Project_Confirmation_Cards WHERE Project_RSVP_ID = @ProjectRSVPID AND Card_Type_ID = 4)
BEGIN
    INSERT INTO Project_Confirmation_Cards (
        Project_RSVP_ID,
        Card_Type_ID,
        Display_Order,
        Is_Active,
        Card_Configuration,
        Congregation_ID,
        Domain_ID
    )
    VALUES (
        @ProjectRSVPID,
        4,  -- Share card
        3,  -- Third card
        1,  -- Active
        '{
            "title": "Invite a Friend",
            "description": "Invite your friends and family to join you!",
            "enabledMethods": ["sms", "email", "facebook"]
        }',
        NULL,  -- All campuses
        1
    );
    PRINT 'Added card: Invite a Friend';
END

-- Card 4: Add to Calendar
IF NOT EXISTS (SELECT 1 FROM Project_Confirmation_Cards WHERE Project_RSVP_ID = @ProjectRSVPID AND Card_Type_ID = 5)
BEGIN
    INSERT INTO Project_Confirmation_Cards (
        Project_RSVP_ID,
        Card_Type_ID,
        Display_Order,
        Is_Active,
        Card_Configuration,
        Congregation_ID,
        Domain_ID
    )
    VALUES (
        @ProjectRSVPID,
        5,  -- Add to Calendar card
        4,  -- Fourth card
        1,  -- Active
        '{
            "title": "Save the Date",
            "description": "Add this event to your calendar",
            "providers": ["google", "apple", "outlook", "ics"]
        }',
        NULL,  -- All campuses
        1
    );
    PRINT 'Added card: Save the Date';
END

-- ===================================================================
-- STEP 5: Link Events to Project (Example)
-- ===================================================================
-- This assumes you have Events already created in MinistryPlatform
-- Adjust Event_IDs based on your actual data

PRINT '';
PRINT 'NOTE: You need to link your Events to this Project via Project_Events table';
PRINT 'Example:';
PRINT '  INSERT INTO Project_Events (Project_ID, Event_ID, Include_In_RSVP, RSVP_Capacity_Modifier, Domain_ID)';
PRINT '  VALUES (' + CAST(@ProjectID AS NVARCHAR) + ', YOUR_EVENT_ID, 1, 0, 1);';
PRINT '';

-- ===================================================================
-- Summary
-- ===================================================================

PRINT '===================================================================';
PRINT 'Christmas 2024 RSVP Configuration Complete!';
PRINT '';
PRINT 'Project ID: ' + CAST(@ProjectID AS NVARCHAR);
PRINT 'Project_RSVP ID: ' + CAST(@ProjectRSVPID AS NVARCHAR);
PRINT '';
PRINT 'Configuration includes:';
PRINT '  - 2 Questions (How many people?, First time visitor?)';
PRINT '  - 4 Confirmation Cards (What to Expect, QR Code, Share, Calendar)';
PRINT '';
PRINT 'Next steps:';
PRINT '  1. Link your Events to the Project via Project_Events table';
PRINT '  2. Create the stored procedures (api_Custom_RSVP_Project_Data_JSON)';
PRINT '  3. Test the RSVP widget with this configuration';
PRINT '===================================================================';
GO
