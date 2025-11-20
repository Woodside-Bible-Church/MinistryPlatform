-- ===================================================================
-- Migration: Restore RSVP_Statuses Table
-- Date: 2025-11-20
-- ===================================================================
-- This script recreates the RSVP_Statuses lookup table that was
-- mistakenly dropped in the cleanup migration.
--
-- Background:
-- - RSVP_Statuses is a pre-existing lookup table (not custom)
-- - Event_Participants.RSVP_Status_ID foreign keys to this table
-- - Accidentally dropped because it had "RSVP" in the name
-- - Need to restore with original values: 1=Yes, 2=No, 3=Maybe
--
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================';
PRINT 'Restore RSVP_Statuses Table Migration';
PRINT 'Starting: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';

-- ===================================================================
-- STEP 1: Check if table already exists
-- ===================================================================
PRINT 'STEP 1: Checking if RSVP_Statuses table exists...';
PRINT '';

IF OBJECT_ID('dbo.RSVP_Statuses', 'U') IS NOT NULL
BEGIN
    PRINT 'Table RSVP_Statuses already exists.';
    PRINT 'Migration skipped - table restoration not needed.';
    PRINT '';
    PRINT '========================================';
    PRINT 'Finished: ' + CONVERT(VARCHAR, GETDATE(), 120);
    PRINT '========================================';
    RETURN;
END
ELSE
BEGIN
    PRINT 'Table RSVP_Statuses does not exist - will create.';
END

PRINT '';

-- ===================================================================
-- STEP 2: Create RSVP_Statuses table
-- ===================================================================
PRINT 'STEP 2: Creating RSVP_Statuses table...';
PRINT '';

CREATE TABLE [dbo].[RSVP_Statuses] (
    [RSVP_Status_ID] INT NOT NULL IDENTITY(1,1),
    [RSVP_Status] NVARCHAR(50) NOT NULL,
    CONSTRAINT [PK_RSVP_Statuses] PRIMARY KEY CLUSTERED ([RSVP_Status_ID] ASC)
);

PRINT 'Table RSVP_Statuses created successfully.';
PRINT '';

-- ===================================================================
-- STEP 3: Insert lookup values
-- ===================================================================
PRINT 'STEP 3: Inserting RSVP status lookup values...';
PRINT '';

SET IDENTITY_INSERT [dbo].[RSVP_Statuses] ON;

INSERT INTO [dbo].[RSVP_Statuses] ([RSVP_Status_ID], [RSVP_Status])
VALUES
    (1, 'Yes'),
    (2, 'No'),
    (3, 'Maybe');

SET IDENTITY_INSERT [dbo].[RSVP_Statuses] OFF;

PRINT 'Inserted 3 RSVP status records.';
PRINT '';

-- ===================================================================
-- STEP 4: Recreate foreign key on Event_Participants
-- ===================================================================
PRINT 'STEP 4: Recreating foreign key constraint on Event_Participants...';
PRINT '';

-- Check if Event_Participants.RSVP_Status_ID column exists
IF EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Event_Participants]')
    AND name = 'RSVP_Status_ID'
)
BEGIN
    -- Check if FK constraint already exists
    IF NOT EXISTS (
        SELECT * FROM sys.foreign_keys
        WHERE parent_object_id = OBJECT_ID('Event_Participants')
        AND name = 'FK_Event_Participants_RSVP_Statuses'
    )
    BEGIN
        ALTER TABLE [dbo].[Event_Participants]
        ADD CONSTRAINT [FK_Event_Participants_RSVP_Statuses]
        FOREIGN KEY ([RSVP_Status_ID])
        REFERENCES [dbo].[RSVP_Statuses] ([RSVP_Status_ID]);

        PRINT 'Foreign key constraint created: FK_Event_Participants_RSVP_Statuses';
    END
    ELSE
    BEGIN
        PRINT 'Foreign key constraint already exists.';
    END
END
ELSE
BEGIN
    PRINT 'Event_Participants.RSVP_Status_ID column does not exist - FK creation skipped.';
END

PRINT '';

-- ===================================================================
-- STEP 5: Verification
-- ===================================================================
PRINT 'STEP 5: Verifying table and data...';
PRINT '';

-- Check table exists
IF OBJECT_ID('dbo.RSVP_Statuses', 'U') IS NOT NULL
BEGIN
    PRINT '✓ Table RSVP_Statuses exists.';

    -- Show all records
    PRINT '';
    PRINT 'RSVP_Statuses lookup values:';
    SELECT
        RSVP_Status_ID,
        RSVP_Status
    FROM RSVP_Statuses
    ORDER BY RSVP_Status_ID;
END
ELSE
BEGIN
    PRINT '✗ ERROR: Table was not created!';
END

PRINT '';
PRINT '========================================';
PRINT 'Migration completed successfully!';
PRINT 'Finished: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '========================================';
PRINT '';
PRINT 'NEXT STEPS:';
PRINT '1. Verify Event_Participants records can be opened in MP';
PRINT '2. Test RSVP widget functionality';
PRINT '3. Check that RSVP_Status_ID values are preserved';
PRINT '';

GO
