-- Migration: Add public apps support
-- This adds a Requires_Authentication column to the Applications table
-- Allows apps to be marked as public (accessible without login)
-- while still requiring authentication for specific actions within the app

-- Add Requires_Authentication column if it doesn't exist
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Applications'
    AND COLUMN_NAME = 'Requires_Authentication'
)
BEGIN
    ALTER TABLE Applications
    ADD Requires_Authentication BIT NOT NULL DEFAULT 1;

    PRINT 'Added Requires_Authentication column to Applications table';
END
ELSE
BEGIN
    PRINT 'Requires_Authentication column already exists';
END
GO

-- Set Prayer app as public (doesn't require authentication to view)
UPDATE Applications
SET Requires_Authentication = 0
WHERE Route = '/prayer';

PRINT 'Marked Prayer app as public';
GO
