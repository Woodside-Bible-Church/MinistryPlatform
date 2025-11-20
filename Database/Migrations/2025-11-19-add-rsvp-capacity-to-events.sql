-- ===================================================================
-- Migration: Add RSVP_Capacity to Events table
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Add nullable RSVP_Capacity field to Events table to allow
--          per-event capacity limits for RSVP system
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================'
PRINT 'Adding RSVP_Capacity to Events table'
PRINT '========================================'

-- ===================================================================
-- Step 1: Add RSVP_Capacity column if it doesn't exist
-- ===================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Events') AND name = 'RSVP_Capacity')
BEGIN
    ALTER TABLE Events
    ADD RSVP_Capacity INT NULL
    PRINT '  ✓ Added RSVP_Capacity column to Events table'
END
ELSE
BEGIN
    PRINT '  ✓ RSVP_Capacity column already exists'
END

GO

-- ===================================================================
-- Step 2: Add check constraint to ensure capacity is positive
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.check_constraints
    WHERE name = 'CK_Events_RSVP_Capacity_Positive'
    AND parent_object_id = OBJECT_ID('Events')
)
BEGIN
    ALTER TABLE Events
    ADD CONSTRAINT CK_Events_RSVP_Capacity_Positive
    CHECK (RSVP_Capacity IS NULL OR RSVP_Capacity > 0)
    PRINT '  ✓ Added check constraint for positive capacity values'
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
PRINT '  - Added RSVP_Capacity column (nullable INT)'
PRINT '  - Added check constraint for positive values'
PRINT '  - NULL values will default to unlimited capacity in app logic'
PRINT ''
PRINT 'Next Steps:'
PRINT '  - Update stored procedure to return RSVP_Capacity'
PRINT '  - Update frontend to use RSVP_Capacity instead of hardcoded 500'
PRINT ''

GO
