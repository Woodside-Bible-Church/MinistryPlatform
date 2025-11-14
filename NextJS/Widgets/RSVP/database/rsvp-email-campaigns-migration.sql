-- ===================================================================
-- RSVP Email Campaigns Migration
-- ===================================================================
-- Adds support for:
--   1. Simple confirmation email (always sent, configured per project)
--   2. Flexible email campaigns (optional, conditional, unlimited)
-- Date: 2025-11-14
-- ===================================================================

-- ===================================================================
-- STEP 1: Add Confirmation Template Field to Project_RSVPs
-- ===================================================================
-- Simple, reliable confirmation email sent immediately after RSVP

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Project_RSVPs') AND name = 'Confirmation_Template_ID')
BEGIN
    ALTER TABLE Project_RSVPs
    ADD Confirmation_Template_ID INT NULL
    CONSTRAINT FK_Project_RSVPs_Confirmation_Template
    FOREIGN KEY REFERENCES dp_Communication_Templates(Communication_Template_ID);
END
GO

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Email template sent immediately after RSVP submission. Required for project to send confirmations.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_RSVPs',
    @level2type = N'COLUMN', @level2name = N'Confirmation_Template_ID';
GO

-- ===================================================================
-- STEP 2: Create Email Campaigns Table
-- ===================================================================
-- Flexible system for reminders, follow-ups, and conditional emails

CREATE TABLE RSVP_Email_Campaigns (
    Campaign_ID INT PRIMARY KEY IDENTITY(1,1),
    Campaign_Name NVARCHAR(100) NOT NULL,
    Campaign_Description NVARCHAR(500) NULL,

    -- Scope
    Project_RSVP_ID INT NOT NULL,
    Congregation_ID INT NULL,  -- NULL = all campuses in project

    -- Template
    Communication_Template_ID INT NOT NULL,

    -- Timing
    Send_Timing_Type NVARCHAR(50) NOT NULL,  -- 'Days_Before_Event', 'Days_After_Event', 'Specific_DateTime'
    Send_Days_Offset INT NULL,  -- Used with 'Days_Before_Event' or 'Days_After_Event' (e.g., 2, -7)
    Send_Specific_DateTime DATETIME NULL,  -- Used with 'Specific_DateTime'

    -- Status
    Is_Active BIT NOT NULL DEFAULT 1,
    Display_Order INT NOT NULL DEFAULT 0,

    -- Audit
    Created_Date DATETIME NOT NULL DEFAULT GETDATE(),
    Created_By INT NULL,
    Modified_Date DATETIME NULL,
    Modified_By INT NULL,

    CONSTRAINT FK_RSVP_Email_Campaigns_Project FOREIGN KEY (Project_RSVP_ID) REFERENCES Project_RSVPs(Project_RSVP_ID),
    CONSTRAINT FK_RSVP_Email_Campaigns_Congregation FOREIGN KEY (Congregation_ID) REFERENCES Congregations(Congregation_ID),
    CONSTRAINT FK_RSVP_Email_Campaigns_Template FOREIGN KEY (Communication_Template_ID) REFERENCES dp_Communication_Templates(Communication_Template_ID),
    CONSTRAINT CK_RSVP_Email_Campaigns_Timing CHECK (Send_Timing_Type IN ('Days_Before_Event', 'Days_After_Event', 'Specific_DateTime'))
);
GO

-- Indexes for performance
CREATE INDEX IX_RSVP_Email_Campaigns_Project ON RSVP_Email_Campaigns(Project_RSVP_ID);
CREATE INDEX IX_RSVP_Email_Campaigns_Active ON RSVP_Email_Campaigns(Is_Active);
GO

-- Table description
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Email campaigns triggered by RSVP submissions. Supports conditional sending based on user answers.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'RSVP_Email_Campaigns';
GO

-- ===================================================================
-- STEP 3: Create Campaign Conditions Table
-- ===================================================================
-- Define conditions for when a campaign should be sent

CREATE TABLE RSVP_Email_Campaign_Conditions (
    Condition_ID INT PRIMARY KEY IDENTITY(1,1),
    Campaign_ID INT NOT NULL,

    -- Which question to check
    Question_ID INT NOT NULL,

    -- How to evaluate the answer
    Condition_Type NVARCHAR(50) NOT NULL,  -- 'Equals', 'Not_Equals', 'Contains', 'Greater_Than', 'Less_Than', 'Greater_Or_Equal', 'Less_Or_Equal', 'Is_True', 'Is_False', 'Is_Null', 'Is_Not_Null'
    Condition_Value NVARCHAR(500) NULL,  -- Value to compare against (not needed for Is_True, Is_False, Is_Null, Is_Not_Null)

    -- Audit
    Created_Date DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_RSVP_Campaign_Conditions_Campaign FOREIGN KEY (Campaign_ID) REFERENCES RSVP_Email_Campaigns(Campaign_ID) ON DELETE CASCADE,
    CONSTRAINT FK_RSVP_Campaign_Conditions_Question FOREIGN KEY (Question_ID) REFERENCES RSVP_Questions(Question_ID),
    CONSTRAINT CK_RSVP_Campaign_Conditions_Type CHECK (
        Condition_Type IN (
            'Equals', 'Not_Equals', 'Contains', 'Not_Contains',
            'Greater_Than', 'Less_Than', 'Greater_Or_Equal', 'Less_Or_Equal',
            'Is_True', 'Is_False', 'Is_Null', 'Is_Not_Null'
        )
    )
);
GO

-- Index for performance
CREATE INDEX IX_RSVP_Campaign_Conditions_Campaign ON RSVP_Email_Campaign_Conditions(Campaign_ID);
GO

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Conditions that determine if a campaign should be sent to an RSVP. All conditions for a campaign must be true (AND logic).',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'RSVP_Email_Campaign_Conditions';
GO

-- ===================================================================
-- STEP 4: Create Campaign Log Table (Optional but Recommended)
-- ===================================================================
-- Track which campaigns were sent to which RSVPs for debugging

CREATE TABLE RSVP_Email_Campaign_Log (
    Log_ID INT PRIMARY KEY IDENTITY(1,1),
    Event_RSVP_ID INT NOT NULL,
    Campaign_ID INT NULL,  -- NULL for confirmation emails
    Communication_ID INT NULL,  -- FK to dp_Communications
    Campaign_Type NVARCHAR(50) NOT NULL,  -- 'Confirmation' or 'Campaign'
    Scheduled_Send_Date DATETIME NOT NULL,
    Was_Sent BIT NOT NULL DEFAULT 0,
    Send_Date DATETIME NULL,
    Error_Message NVARCHAR(MAX) NULL,
    Created_Date DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_RSVP_Campaign_Log_RSVP FOREIGN KEY (Event_RSVP_ID) REFERENCES Event_RSVPs(Event_RSVP_ID),
    CONSTRAINT FK_RSVP_Campaign_Log_Campaign FOREIGN KEY (Campaign_ID) REFERENCES RSVP_Email_Campaigns(Campaign_ID),
    CONSTRAINT FK_RSVP_Campaign_Log_Communication FOREIGN KEY (Communication_ID) REFERENCES dp_Communications(Communication_ID)
);
GO

CREATE INDEX IX_RSVP_Campaign_Log_RSVP ON RSVP_Email_Campaign_Log(Event_RSVP_ID);
CREATE INDEX IX_RSVP_Campaign_Log_Campaign ON RSVP_Email_Campaign_Log(Campaign_ID);
GO

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Audit log of all emails scheduled for RSVPs. Useful for debugging and analytics.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'RSVP_Email_Campaign_Log';
GO

-- ===================================================================
-- EXAMPLE DATA
-- ===================================================================

/*
-- Example: Simple confirmation email (no campaigns)
UPDATE Project_RSVPs
SET Confirmation_Template_ID = 100  -- Your template ID
WHERE Project_RSVP_ID = 1;

-- Example Campaign 1: 2-day reminder (no conditions, sent to everyone)
INSERT INTO RSVP_Email_Campaigns (
    Campaign_Name,
    Campaign_Description,
    Project_RSVP_ID,
    Congregation_ID,
    Communication_Template_ID,
    Send_Timing_Type,
    Send_Days_Offset,
    Is_Active,
    Display_Order
) VALUES (
    '2-Day Reminder',
    'Reminder email sent 2 days before the event',
    1,  -- Christmas Services project
    NULL,  -- All campuses
    101,  -- Template ID
    'Days_Before_Event',
    2,  -- 2 days before
    1,  -- Active
    1   -- Order
);

-- Example Campaign 2: New visitor welcome (conditional)
INSERT INTO RSVP_Email_Campaigns (
    Campaign_Name,
    Campaign_Description,
    Project_RSVP_ID,
    Congregation_ID,
    Communication_Template_ID,
    Send_Timing_Type,
    Send_Days_Offset,
    Is_Active,
    Display_Order
) VALUES (
    'New Visitor Welcome',
    'Welcome email sent 1 day after event to new visitors',
    1,
    NULL,
    102,
    'Days_After_Event',
    1,  -- 1 day after
    1,
    2
);

-- Add condition: Only send if "Are you new?" = Yes
DECLARE @NewCampaignID INT = SCOPE_IDENTITY();
INSERT INTO RSVP_Email_Campaign_Conditions (
    Campaign_ID,
    Question_ID,
    Condition_Type,
    Condition_Value
) VALUES (
    @NewCampaignID,
    5,  -- Question ID for "Are you new to Woodside?"
    'Equals',
    'Yes'
);

-- Example Campaign 3: Large group reminder (conditional)
INSERT INTO RSVP_Email_Campaigns (
    Campaign_Name,
    Project_RSVP_ID,
    Communication_Template_ID,
    Send_Timing_Type,
    Send_Days_Offset,
    Is_Active,
    Display_Order
) VALUES (
    'Large Group Information',
    1,
    103,
    'Days_Before_Event',
    3,
    1,
    3
);

-- Add condition: Only send if party size >= 6
DECLARE @LargeGroupCampaignID INT = SCOPE_IDENTITY();
INSERT INTO RSVP_Email_Campaign_Conditions (
    Campaign_ID,
    Question_ID,  -- Question for "How many people?"
    Condition_Type,
    Condition_Value
) VALUES (
    @LargeGroupCampaignID,
    2,  -- Counter question ID
    'Greater_Or_Equal',
    '6'
);
*/

-- ===================================================================
-- NEXT STEPS
-- ===================================================================

PRINT 'RSVP Email Campaigns Migration Complete';
PRINT '';
PRINT 'DATABASE STRUCTURE:';
PRINT '  ✓ Project_RSVPs.Confirmation_Template_ID (simple confirmation)';
PRINT '  ✓ RSVP_Email_Campaigns (flexible campaign system)';
PRINT '  ✓ RSVP_Email_Campaign_Conditions (conditional logic)';
PRINT '  ✓ RSVP_Email_Campaign_Log (audit trail)';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Run sp-schedule-rsvp-emails.sql to create scheduling stored procedure';
PRINT '2. Update api_Custom_RSVP_Submit_JSON to call email scheduler';
PRINT '3. Configure confirmation template on Project_RSVPs';
PRINT '4. Create email campaigns (optional)';
GO
