-- ===================================================================
-- EMERGENCY MIGRATION: Restore Event_RSVPs Table Structure
-- Date: 2025-11-20
-- ===================================================================
-- MP appears to have hard-coded dependency on Event_RSVPs table
-- This creates an empty table structure to satisfy MP's expectations
-- NO DATA - just the table structure
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================';
PRINT 'EMERGENCY: Restoring Event_RSVPs Table';
PRINT '========================================';
PRINT '';

-- Check if table already exists
IF OBJECT_ID('dbo.Event_RSVPs', 'U') IS NOT NULL
BEGIN
    PRINT 'Table Event_RSVPs already exists. No action needed.';
    RETURN;
END

-- Create minimal Event_RSVPs table structure
-- (Minimal fields to satisfy MP - we won't use this table)
CREATE TABLE [dbo].[Event_RSVPs] (
    [Event_RSVP_ID] INT NOT NULL IDENTITY(1,1),
    [Event_ID] INT NULL,
    [Contact_ID] INT NULL,
    [RSVP_Status_ID] INT NULL,
    [Domain_ID] INT NOT NULL DEFAULT(1),
    CONSTRAINT [PK_Event_RSVPs] PRIMARY KEY CLUSTERED ([Event_RSVP_ID] ASC)
);

-- Add foreign keys to real tables (if they exist)
IF OBJECT_ID('dbo.Events', 'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    ADD CONSTRAINT [FK_Event_RSVPs_Events]
    FOREIGN KEY ([Event_ID])
    REFERENCES [dbo].[Events] ([Event_ID]);
END

IF OBJECT_ID('dbo.Contacts', 'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    ADD CONSTRAINT [FK_Event_RSVPs_Contacts]
    FOREIGN KEY ([Contact_ID])
    REFERENCES [dbo].[Contacts] ([Contact_ID]);
END

IF OBJECT_ID('dbo.RSVP_Statuses', 'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    ADD CONSTRAINT [FK_Event_RSVPs_RSVP_Statuses]
    FOREIGN KEY ([RSVP_Status_ID])
    REFERENCES [dbo].[RSVP_Statuses] ([RSVP_Status_ID]);
END

IF OBJECT_ID('dbo.dp_Domains', 'U') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    ADD CONSTRAINT [FK_Event_RSVPs_dp_Domains]
    FOREIGN KEY ([Domain_ID])
    REFERENCES [dbo].[dp_Domains] ([Domain_ID]);
END

PRINT 'Event_RSVPs table created (empty - for MP compatibility only)';
PRINT '';
PRINT 'NOTE: This table is NOT used by our RSVP widget.';
PRINT 'We use Event_Participants instead.';
PRINT 'This table exists only to prevent MP errors.';

GO
