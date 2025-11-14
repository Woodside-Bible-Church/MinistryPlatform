-- ===================================================================
-- RSVP Email Confirmation Migration
-- ===================================================================
-- Adds support for immediate confirmation emails and scheduled reminder emails
-- Date: 2025-11-14
-- ===================================================================

-- ===================================================================
-- STEP 1: Add Email Template Fields to Congregations Table
-- ===================================================================
-- Allows each campus to have custom email templates

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Congregations') AND name = 'Confirmation_Email_Template_ID')
BEGIN
    ALTER TABLE Congregations
    ADD Confirmation_Email_Template_ID INT NULL
    CONSTRAINT FK_Congregations_Confirmation_Email_Template
    FOREIGN KEY REFERENCES dp_Communication_Templates(Communication_Template_ID);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Congregations') AND name = 'Reminder_Email_Template_ID')
BEGIN
    ALTER TABLE Congregations
    ADD Reminder_Email_Template_ID INT NULL
    CONSTRAINT FK_Congregations_Reminder_Email_Template
    FOREIGN KEY REFERENCES dp_Communication_Templates(Communication_Template_ID);
END
GO

-- ===================================================================
-- STEP 2: Add Email Template Fields to Project_RSVPs Table
-- ===================================================================
-- Provides project-wide default templates when campus-specific templates aren't configured

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Project_RSVPs') AND name = 'Default_Confirmation_Template_ID')
BEGIN
    ALTER TABLE Project_RSVPs
    ADD Default_Confirmation_Template_ID INT NULL
    CONSTRAINT FK_Project_RSVPs_Default_Confirmation_Template
    FOREIGN KEY REFERENCES dp_Communication_Templates(Communication_Template_ID);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Project_RSVPs') AND name = 'Default_Reminder_Template_ID')
BEGIN
    ALTER TABLE Project_RSVPs
    ADD Default_Reminder_Template_ID INT NULL
    CONSTRAINT FK_Project_RSVPs_Default_Reminder_Template
    FOREIGN KEY REFERENCES dp_Communication_Templates(Communication_Template_ID);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Project_RSVPs') AND name = 'Reminder_Days_Before')
BEGIN
    ALTER TABLE Project_RSVPs
    ADD Reminder_Days_Before INT NULL;
END
GO

-- Add helpful comments
EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Confirmation email template sent immediately after RSVP submission for this campus',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Congregations',
    @level2type = N'COLUMN', @level2name = N'Confirmation_Email_Template_ID';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Reminder email template sent X days before event for this campus',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Congregations',
    @level2type = N'COLUMN', @level2name = N'Reminder_Email_Template_ID';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Default confirmation email template for all campuses in this project (if campus-specific not set)',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_RSVPs',
    @level2type = N'COLUMN', @level2name = N'Default_Confirmation_Template_ID';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Default reminder email template for all campuses in this project (if campus-specific not set)',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_RSVPs',
    @level2type = N'COLUMN', @level2name = N'Default_Reminder_Template_ID';

EXEC sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Number of days before event to send reminder email (NULL = no reminder)',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_RSVPs',
    @level2type = N'COLUMN', @level2name = N'Reminder_Days_Before';
GO

-- ===================================================================
-- STEP 3: Update api_Custom_RSVP_Project_Data_JSON
-- ===================================================================
-- Modify the stored procedure to return email template configuration
-- ADD these columns to the Events SELECT statement:

/*
In api_Custom_RSVP_Project_Data_JSON, update the Events query to include:

SELECT
    ..., -- existing columns
    c.Confirmation_Email_Template_ID AS Campus_Confirmation_Template_ID,
    c.Reminder_Email_Template_ID AS Campus_Reminder_Template_ID,
    pr.Default_Confirmation_Template_ID,
    pr.Default_Reminder_Template_ID,
    pr.Reminder_Days_Before
FROM Events e
...
*/

-- ===================================================================
-- STEP 4: Template Hierarchy Logic
-- ===================================================================
-- When sending emails, use this priority order:

/*
CONFIRMATION EMAIL:
1. Congregations.Confirmation_Email_Template_ID (campus-specific)
2. Project_RSVPs.Default_Confirmation_Template_ID (project default)
3. NULL (skip confirmation email)

REMINDER EMAIL:
1. Congregations.Reminder_Email_Template_ID (campus-specific)
2. Project_RSVPs.Default_Reminder_Template_ID (project default)
3. NULL (skip reminder email)
*/

-- ===================================================================
-- NOTES FOR IMPLEMENTATION
-- ===================================================================

/*
EMAIL TYPES:

1. CONFIRMATION EMAIL (Immediate)
   - Sent immediately after RSVP submission
   - Uses /messages API endpoint
   - Action_Status: NULL (sent immediately)
   - Creates dp_Communications + dp_Communication_Messages records

2. REMINDER EMAIL (Scheduled)
   - Sent X days before event (configured via Reminder_Days_Before)
   - Uses /messages API endpoint with Start_Date in the future
   - Action_Status: "Ready to Send"
   - Creates dp_Communications + dp_Communication_Messages records
   - Schedule Date: Event_Start_Date - Reminder_Days_Before

EXAMPLE:
  Event Date: December 24, 2024 at 5:00 PM
  Reminder_Days_Before: 2
  Reminder Send Date: December 22, 2024 at 5:00 PM
*/

PRINT 'RSVP Email Confirmation Migration Complete';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Update api_Custom_RSVP_Project_Data_JSON to return template IDs';
PRINT '2. Create or update email templates in dp_Communication_Templates';
PRINT '3. Link templates to campuses (Congregations table) or projects (Project_RSVPs table)';
PRINT '4. Test RSVP submission flow with email sending';
GO
