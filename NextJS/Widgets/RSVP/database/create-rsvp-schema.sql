-- ===================================================================
-- RSVP Widget Database Schema
-- ===================================================================
-- Creates tables for dynamic RSVP system linked to Projects table
-- Run this on your MinistryPlatform SQL Server database
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- STEP 1: Add columns to existing Project_Events table
-- ===================================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_Events]') AND name = 'Include_In_RSVP')
BEGIN
    ALTER TABLE [dbo].[Project_Events]
    ADD [Include_In_RSVP] BIT NOT NULL DEFAULT 1;
    PRINT 'Added Include_In_RSVP column to Project_Events';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_Events]') AND name = 'RSVP_Capacity_Modifier')
BEGIN
    ALTER TABLE [dbo].[Project_Events]
    ADD [RSVP_Capacity_Modifier] INT NOT NULL DEFAULT 0;
    PRINT 'Added RSVP_Capacity_Modifier column to Project_Events';
END
GO

-- Add comment explaining the modifier column
EXEC sys.sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Adds extra count to current RSVPs to inflate capacity percentage. Use negative values to reduce appearance of fullness. Example: Event has 100 RSVPs with capacity 500 (20%). Modifier of 50 makes it show as 150/500 (30%).',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_Events',
    @level2type = N'COLUMN', @level2name = N'RSVP_Capacity_Modifier';
GO

-- ===================================================================
-- STEP 2: Create Lookup Tables
-- ===================================================================

-- Question_Types
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Question_Types]'))
BEGIN
    CREATE TABLE [dbo].[Question_Types] (
        [Question_Type_ID] INT IDENTITY(1,1) NOT NULL,
        [Question_Type_Name] NVARCHAR(50) NOT NULL,
        [Component_Name] NVARCHAR(50) NOT NULL,
        [Description] NVARCHAR(255) NULL,
        [Requires_Options] BIT NOT NULL DEFAULT 0,
        CONSTRAINT [PK_Question_Types] PRIMARY KEY CLUSTERED ([Question_Type_ID] ASC)
    );
    PRINT 'Created Question_Types table';
END
GO

-- Card_Types
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Card_Types]'))
BEGIN
    CREATE TABLE [dbo].[Card_Types] (
        [Card_Type_ID] INT IDENTITY(1,1) NOT NULL,
        [Card_Type_Name] NVARCHAR(50) NOT NULL,
        [Component_Name] NVARCHAR(50) NOT NULL,
        [Icon_Name] NVARCHAR(50) NULL,
        [Description] NVARCHAR(255) NULL,
        [Default_Configuration] NVARCHAR(MAX) NULL,
        [Requires_Configuration] BIT NOT NULL DEFAULT 0,
        CONSTRAINT [PK_Card_Types] PRIMARY KEY CLUSTERED ([Card_Type_ID] ASC)
    );
    PRINT 'Created Card_Types table';
END
GO

-- ===================================================================
-- STEP 3: Create Main RSVP Tables
-- ===================================================================

-- Project_RSVPs
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVPs]'))
BEGIN
    CREATE TABLE [dbo].[Project_RSVPs] (
        [Project_RSVP_ID] INT IDENTITY(1,1) NOT NULL,
        [Project_ID] INT NOT NULL,
        [RSVP_Title] NVARCHAR(255) NOT NULL,
        [RSVP_Description] NVARCHAR(MAX) NULL,
        [Header_Image_URL] NVARCHAR(500) NULL,
        [Start_Date] DATETIME NULL,
        [End_Date] DATETIME NULL,
        [Is_Active] BIT NOT NULL DEFAULT 1,
        [Require_Contact_Lookup] BIT NOT NULL DEFAULT 0,
        [Allow_Guest_Submission] BIT NOT NULL DEFAULT 1,
        [Confirmation_Email_Template_ID] INT NULL,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Project_RSVPs] PRIMARY KEY CLUSTERED ([Project_RSVP_ID] ASC),
        CONSTRAINT [FK_Project_RSVPs_Projects] FOREIGN KEY ([Project_ID])
            REFERENCES [dbo].[Projects]([Project_ID]),
        CONSTRAINT [FK_Project_RSVPs_Domains] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID])
    );
    PRINT 'Created Project_RSVPs table';
END
GO

-- Project_RSVP_Questions
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVP_Questions]'))
BEGIN
    CREATE TABLE [dbo].[Project_RSVP_Questions] (
        [Project_RSVP_Question_ID] INT IDENTITY(1,1) NOT NULL,
        [Project_RSVP_ID] INT NOT NULL,
        [Question_Text] NVARCHAR(500) NOT NULL,
        [Question_Type_ID] INT NOT NULL,
        [Field_Order] INT NOT NULL,
        [Is_Required] BIT NOT NULL DEFAULT 0,
        [Helper_Text] NVARCHAR(500) NULL,
        [Min_Value] INT NULL,
        [Max_Value] INT NULL,
        [Default_Value] NVARCHAR(255) NULL,
        [Placeholder_Text] NVARCHAR(255) NULL,
        [Active] BIT NOT NULL DEFAULT 1,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Project_RSVP_Questions] PRIMARY KEY CLUSTERED ([Project_RSVP_Question_ID] ASC),
        CONSTRAINT [FK_Project_RSVP_Questions_Project_RSVPs] FOREIGN KEY ([Project_RSVP_ID])
            REFERENCES [dbo].[Project_RSVPs]([Project_RSVP_ID]),
        CONSTRAINT [FK_Project_RSVP_Questions_Question_Types] FOREIGN KEY ([Question_Type_ID])
            REFERENCES [dbo].[Question_Types]([Question_Type_ID]),
        CONSTRAINT [FK_Project_RSVP_Questions_Domains] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID])
    );
    PRINT 'Created Project_RSVP_Questions table';
END
GO

-- Question_Options
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Question_Options]'))
BEGIN
    CREATE TABLE [dbo].[Question_Options] (
        [Question_Option_ID] INT IDENTITY(1,1) NOT NULL,
        [Project_RSVP_Question_ID] INT NOT NULL,
        [Option_Text] NVARCHAR(255) NOT NULL,
        [Option_Value] NVARCHAR(255) NOT NULL,
        [Display_Order] INT NOT NULL,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Question_Options] PRIMARY KEY CLUSTERED ([Question_Option_ID] ASC),
        CONSTRAINT [FK_Question_Options_Project_RSVP_Questions] FOREIGN KEY ([Project_RSVP_Question_ID])
            REFERENCES [dbo].[Project_RSVP_Questions]([Project_RSVP_Question_ID]),
        CONSTRAINT [FK_Question_Options_Domains] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID])
    );
    PRINT 'Created Question_Options table';
END
GO

-- Project_Confirmation_Cards
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Project_Confirmation_Cards]'))
BEGIN
    CREATE TABLE [dbo].[Project_Confirmation_Cards] (
        [Project_Confirmation_Card_ID] INT IDENTITY(1,1) NOT NULL,
        [Project_RSVP_ID] INT NOT NULL,
        [Card_Type_ID] INT NOT NULL,
        [Display_Order] INT NOT NULL,
        [Is_Active] BIT NOT NULL DEFAULT 1,
        [Card_Configuration] NVARCHAR(MAX) NULL,
        [Congregation_ID] INT NULL,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Project_Confirmation_Cards] PRIMARY KEY CLUSTERED ([Project_Confirmation_Card_ID] ASC),
        CONSTRAINT [FK_Project_Confirmation_Cards_Project_RSVPs] FOREIGN KEY ([Project_RSVP_ID])
            REFERENCES [dbo].[Project_RSVPs]([Project_RSVP_ID]),
        CONSTRAINT [FK_Project_Confirmation_Cards_Card_Types] FOREIGN KEY ([Card_Type_ID])
            REFERENCES [dbo].[Card_Types]([Card_Type_ID]),
        CONSTRAINT [FK_Project_Confirmation_Cards_Congregations] FOREIGN KEY ([Congregation_ID])
            REFERENCES [dbo].[Congregations]([Congregation_ID]),
        CONSTRAINT [FK_Project_Confirmation_Cards_Domains] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID])
    );
    PRINT 'Created Project_Confirmation_Cards table';
END
GO

-- Event_RSVPs
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Event_RSVPs]'))
BEGIN
    CREATE TABLE [dbo].[Event_RSVPs] (
        [Event_RSVP_ID] INT IDENTITY(1,1) NOT NULL,
        [Event_ID] INT NOT NULL,
        [Project_RSVP_ID] INT NOT NULL,
        [Contact_ID] INT NULL,
        [First_Name] NVARCHAR(50) NOT NULL,
        [Last_Name] NVARCHAR(50) NOT NULL,
        [Email_Address] NVARCHAR(100) NOT NULL,
        [Phone_Number] NVARCHAR(25) NULL,
        [Submission_Date] DATETIME NOT NULL DEFAULT GETDATE(),
        [Confirmation_Code] NVARCHAR(20) NOT NULL,
        [Is_Guest] BIT NOT NULL DEFAULT 0,
        [Event_Participant_ID] INT NULL,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Event_RSVPs] PRIMARY KEY CLUSTERED ([Event_RSVP_ID] ASC),
        CONSTRAINT [FK_Event_RSVPs_Events] FOREIGN KEY ([Event_ID])
            REFERENCES [dbo].[Events]([Event_ID]),
        CONSTRAINT [FK_Event_RSVPs_Project_RSVPs] FOREIGN KEY ([Project_RSVP_ID])
            REFERENCES [dbo].[Project_RSVPs]([Project_RSVP_ID]),
        CONSTRAINT [FK_Event_RSVPs_Contacts] FOREIGN KEY ([Contact_ID])
            REFERENCES [dbo].[Contacts]([Contact_ID]),
        CONSTRAINT [FK_Event_RSVPs_Event_Participants] FOREIGN KEY ([Event_Participant_ID])
            REFERENCES [dbo].[Event_Participants]([Event_Participant_ID]),
        CONSTRAINT [FK_Event_RSVPs_Domains] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID])
    );
    PRINT 'Created Event_RSVPs table';
END
GO

-- Event_RSVP_Answers
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Event_RSVP_Answers]'))
BEGIN
    CREATE TABLE [dbo].[Event_RSVP_Answers] (
        [Event_RSVP_Answer_ID] INT IDENTITY(1,1) NOT NULL,
        [Event_RSVP_ID] INT NOT NULL,
        [Project_RSVP_Question_ID] INT NOT NULL,
        [Answer_Text] NVARCHAR(MAX) NULL,
        [Answer_Numeric] INT NULL,
        [Answer_Boolean] BIT NULL,
        [Answer_Date] DATETIME NULL,
        [Domain_ID] INT NOT NULL DEFAULT 1,
        CONSTRAINT [PK_Event_RSVP_Answers] PRIMARY KEY CLUSTERED ([Event_RSVP_Answer_ID] ASC),
        CONSTRAINT [FK_Event_RSVP_Answers_Event_RSVPs] FOREIGN KEY ([Event_RSVP_ID])
            REFERENCES [dbo].[Event_RSVPs]([Event_RSVP_ID]),
        CONSTRAINT [FK_Event_RSVP_Answers_Project_RSVP_Questions] FOREIGN KEY ([Project_RSVP_Question_ID])
            REFERENCES [dbo].[Project_RSVP_Questions]([Project_RSVP_Question_ID]),
        CONSTRAINT [FK_Event_RSVP_Answers_Domains] FOREIGN KEY ([Domain_ID])
            REFERENCES [dbo].[dp_Domains]([Domain_ID])
    );
    PRINT 'Created Event_RSVP_Answers table';
END
GO

-- ===================================================================
-- STEP 4: Create Indexes for Performance
-- ===================================================================

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Event_RSVPs_Event_ID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Event_RSVPs_Event_ID]
    ON [dbo].[Event_RSVPs]([Event_ID] ASC);
    PRINT 'Created index IX_Event_RSVPs_Event_ID';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Event_RSVPs_Contact_ID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Event_RSVPs_Contact_ID]
    ON [dbo].[Event_RSVPs]([Contact_ID] ASC);
    PRINT 'Created index IX_Event_RSVPs_Contact_ID';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Event_RSVPs_Project_RSVP_ID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Event_RSVPs_Project_RSVP_ID]
    ON [dbo].[Event_RSVPs]([Project_RSVP_ID] ASC);
    PRINT 'Created index IX_Event_RSVPs_Project_RSVP_ID';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Event_RSVP_Answers_Event_RSVP_ID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Event_RSVP_Answers_Event_RSVP_ID]
    ON [dbo].[Event_RSVP_Answers]([Event_RSVP_ID] ASC);
    PRINT 'Created index IX_Event_RSVP_Answers_Event_RSVP_ID';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Project_RSVP_Questions_Project_RSVP_ID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Project_RSVP_Questions_Project_RSVP_ID]
    ON [dbo].[Project_RSVP_Questions]([Project_RSVP_ID] ASC);
    PRINT 'Created index IX_Project_RSVP_Questions_Project_RSVP_ID';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Project_Confirmation_Cards_Project_RSVP_ID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Project_Confirmation_Cards_Project_RSVP_ID]
    ON [dbo].[Project_Confirmation_Cards]([Project_RSVP_ID] ASC);
    PRINT 'Created index IX_Project_Confirmation_Cards_Project_RSVP_ID';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Project_Confirmation_Cards_Congregation_ID')
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Project_Confirmation_Cards_Congregation_ID]
    ON [dbo].[Project_Confirmation_Cards]([Congregation_ID] ASC);
    PRINT 'Created index IX_Project_Confirmation_Cards_Congregation_ID';
END
GO

PRINT '';
PRINT '===================================================================';
PRINT 'Schema creation complete!';
PRINT 'Next steps:';
PRINT '1. Run seed-lookup-tables.sql to populate Question_Types and Card_Types';
PRINT '2. Run seed-christmas-example.sql to create sample Christmas 2024 RSVP';
PRINT '3. Create stored procedures for API endpoints';
PRINT '===================================================================';
GO
