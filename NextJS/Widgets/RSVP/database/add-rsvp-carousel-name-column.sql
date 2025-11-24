-- ===================================================================
-- Add RSVP_Carousel_Name column to Events table
-- ===================================================================
-- This column is used to group non-RSVP events into themed carousels
-- that appear below the RSVP section on the widget.
--
-- Usage:
-- 1. Set Events.Project_ID to link the event to an RSVP project
-- 2. Leave Include_In_RSVP = 0 (or NULL)
-- 3. Set RSVP_Carousel_Name to group events (e.g., "Other Christmas Events")
-- 4. Events with the same carousel name will be grouped together
-- ===================================================================

USE [MinistryPlatform]
GO

-- Check if column already exists
IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Events'
    AND COLUMN_NAME = 'RSVP_Carousel_Name'
)
BEGIN
    ALTER TABLE [dbo].[Events]
    ADD [RSVP_Carousel_Name] NVARCHAR(100) NULL;

    PRINT 'Added RSVP_Carousel_Name column to Events table';
END
ELSE
BEGIN
    PRINT 'RSVP_Carousel_Name column already exists';
END
GO

-- ===================================================================
-- Example Usage:
-- ===================================================================
-- Update an event to appear in a carousel:
/*
UPDATE Events
SET
    Project_ID = 1,  -- Link to Christmas RSVP project
    Include_In_RSVP = 0,  -- Don't show in RSVP section
    RSVP_Carousel_Name = 'Other Christmas Events'  -- Group name
WHERE Event_ID = 12345;
*/
