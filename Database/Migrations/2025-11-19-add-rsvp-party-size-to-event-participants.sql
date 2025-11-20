-- ===================================================================
-- Migration: Add RSVP_Party_Size to Event_Participants
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Track party size for RSVP submissions in Event_Participants
--          This allows us to consolidate RSVP data into native MP tables
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================'
PRINT 'Adding RSVP_Party_Size to Event_Participants'
PRINT '========================================'

-- ===================================================================
-- Step 1: Add RSVP_Party_Size column if it doesn't exist
-- ===================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Event_Participants') AND name = 'RSVP_Party_Size')
BEGIN
    ALTER TABLE Event_Participants
    ADD RSVP_Party_Size INT NULL
    PRINT '  ✓ Added RSVP_Party_Size column to Event_Participants table'
END
ELSE
BEGIN
    PRINT '  ✓ RSVP_Party_Size column already exists'
END

GO

-- ===================================================================
-- Step 2: Add check constraint to ensure party size is positive
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.check_constraints
    WHERE name = 'CK_Event_Participants_RSVP_Party_Size_Positive'
    AND parent_object_id = OBJECT_ID('Event_Participants')
)
BEGIN
    ALTER TABLE Event_Participants
    ADD CONSTRAINT CK_Event_Participants_RSVP_Party_Size_Positive
    CHECK (RSVP_Party_Size IS NULL OR RSVP_Party_Size > 0)
    PRINT '  ✓ Added check constraint for positive party size values'
END
ELSE
BEGIN
    PRINT '  ✓ Check constraint already exists'
END

GO

PRINT ''
PRINT '========================================'
PRINT 'Migration Complete!'
PRINT '========================================'
PRINT ''
PRINT 'Summary:'
PRINT '  - Added RSVP_Party_Size column (nullable INT)'
PRINT '  - Added check constraint for positive values'
PRINT '  - NULL values mean party size was not collected'
PRINT ''
PRINT 'Next Steps:'
PRINT '  - Update stored procedures to use Event_Participants'
PRINT '  - Migrate data from Event_RSVPs to Event_Participants'
PRINT ''

GO
