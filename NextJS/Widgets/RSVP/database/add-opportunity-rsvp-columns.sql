-- ===================================================================
-- Migration: Add RSVP columns to Opportunities table
-- ===================================================================
-- Adds Project_ID and RSVP_Carousel_Name to Opportunities so that
-- serve opportunities can appear in RSVP widget carousels alongside events.
-- ===================================================================

USE [MinistryPlatform]
GO

-- Add Project_ID column (links opportunity to a project for RSVP display)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Opportunities' AND COLUMN_NAME = 'Project_ID'
)
BEGIN
    ALTER TABLE [dbo].[Opportunities]
    ADD [Project_ID] INT NULL;

    PRINT 'Added Project_ID column to Opportunities table';
END
ELSE
BEGIN
    PRINT 'Project_ID column already exists on Opportunities table';
END
GO

-- Add RSVP_Carousel_Name column (groups opportunity into a named carousel)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Opportunities' AND COLUMN_NAME = 'RSVP_Carousel_Name'
)
BEGIN
    ALTER TABLE [dbo].[Opportunities]
    ADD [RSVP_Carousel_Name] NVARCHAR(100) NULL;

    PRINT 'Added RSVP_Carousel_Name column to Opportunities table';
END
ELSE
BEGIN
    PRINT 'RSVP_Carousel_Name column already exists on Opportunities table';
END
GO

-- Add foreign key constraint to Projects table
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_NAME = 'FK_Opportunities_Project'
)
BEGIN
    ALTER TABLE [dbo].[Opportunities]
    ADD CONSTRAINT FK_Opportunities_Project
    FOREIGN KEY ([Project_ID]) REFERENCES [dbo].[Projects]([Project_ID]);

    PRINT 'Added FK_Opportunities_Project foreign key';
END
ELSE
BEGIN
    PRINT 'FK_Opportunities_Project foreign key already exists';
END
GO

-- ===================================================================
-- Usage Notes
-- ===================================================================
-- After running this migration:
-- 1. Set Project_ID on opportunities you want to appear in RSVP carousels
-- 2. Set RSVP_Carousel_Name to the carousel heading (e.g., "Serve Opportunities")
-- 3. The stored procedure will automatically include them in the carousel response
--
-- Example:
-- UPDATE Opportunities SET Project_ID = 5, RSVP_Carousel_Name = 'Serve Opportunities'
-- WHERE Opportunity_ID IN (101, 102, 103);
