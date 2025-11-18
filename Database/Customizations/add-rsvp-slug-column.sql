-- ===================================================================
-- Migration: Add RSVP_Slug column to Project_RSVPs table
-- ===================================================================
-- Adds a URL-friendly slug field for easier widget embedding
-- Example: christmas-2024, easter-services-2025
-- ===================================================================

USE [MinistryPlatform]
GO

-- Add RSVP_Slug column if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVPs]') AND name = 'RSVP_Slug')
BEGIN
    ALTER TABLE [dbo].[Project_RSVPs]
    ADD [RSVP_Slug] NVARCHAR(100) NULL;

    PRINT 'Added RSVP_Slug column to Project_RSVPs table';
END
ELSE
BEGIN
    PRINT 'RSVP_Slug column already exists';
END
GO

-- Add unique index on RSVP_Slug for fast lookups and uniqueness
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Project_RSVPs_RSVP_Slug')
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Project_RSVPs_RSVP_Slug]
    ON [dbo].[Project_RSVPs]([RSVP_Slug] ASC)
    WHERE [RSVP_Slug] IS NOT NULL;  -- Partial index: only enforce uniqueness when slug is not NULL

    PRINT 'Created unique index UQ_Project_RSVPs_RSVP_Slug';
END
ELSE
BEGIN
    PRINT 'Index UQ_Project_RSVPs_RSVP_Slug already exists';
END
GO

-- Add description for column
EXEC sys.sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'URL-friendly slug for widget embedding (e.g., "christmas-2024"). Must be unique. Used as alternative to Project_RSVP_ID for widget data-params.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_RSVPs',
    @level2type = N'COLUMN', @level2name = N'RSVP_Slug';
GO

PRINT '';
PRINT '===================================================================';
PRINT 'Migration complete!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Update existing Project_RSVPs records with slugs:';
PRINT '   UPDATE Project_RSVPs SET RSVP_Slug = ''christmas-2024'' WHERE Project_RSVP_ID = 1;';
PRINT '';
PRINT '2. Update stored procedure to support slug lookups';
PRINT '3. Widget can now use: data-params="@Project=christmas-2024"';
PRINT '===================================================================';
GO
