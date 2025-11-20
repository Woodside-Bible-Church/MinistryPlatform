-- ===================================================================
-- Migration: Update Project_Confirmation_Cards Table Structure
-- ===================================================================
-- Date: 2025-11-20
-- Description:
--   1. Remove Project_RSVP_ID column (old field)
--   2. Add Project_ID column (link directly to Projects)
--   3. Reorder columns for better organization in MinistryPlatform UI
--
-- WARNING: This migration will drop and recreate the table.
-- Make sure to backup your data first!
-- ===================================================================

USE [MinistryPlatform]
GO

-- ===================================================================
-- STEP 1: Backup existing data
-- ===================================================================
PRINT 'Backing up existing Project_Confirmation_Cards data...';

-- Create temporary backup table
IF OBJECT_ID('tempdb..#ProjectConfirmationCardsBackup') IS NOT NULL
    DROP TABLE #ProjectConfirmationCardsBackup;

SELECT
    pcc.Project_Confirmation_Card_ID,
    pr.Project_ID,  -- Get Project_ID from Project_RSVPs
    pcc.Card_Type_ID,
    pcc.Card_Configuration,
    pcc.Display_Order,
    pcc.Is_Active,
    pcc.Congregation_ID,
    pcc.Domain_ID
INTO #ProjectConfirmationCardsBackup
FROM Project_Confirmation_Cards pcc
INNER JOIN Project_RSVPs pr ON pcc.Project_RSVP_ID = pr.Project_RSVP_ID;

PRINT 'Backed up ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' records';
GO

-- ===================================================================
-- STEP 2: Drop existing table and constraints
-- ===================================================================
PRINT 'Dropping existing Project_Confirmation_Cards table...';

DROP TABLE IF EXISTS [dbo].[Project_Confirmation_Cards];
GO

-- ===================================================================
-- STEP 3: Create new table with updated structure
-- ===================================================================
PRINT 'Creating new Project_Confirmation_Cards table...';

CREATE TABLE [dbo].[Project_Confirmation_Cards] (
    -- Primary Key
    [Project_Confirmation_Card_ID] INT IDENTITY(1,1) NOT NULL,

    -- Foreign Keys (in desired order)
    [Project_ID] INT NOT NULL,
    [Congregation_ID] INT NULL,  -- NULL = applies to all campuses
    [Card_Type_ID] INT NOT NULL,

    -- Configuration and Settings
    [Card_Configuration] NVARCHAR(MAX) NULL,
    [Display_Order] INT NOT NULL,
    [Is_Active] BIT NOT NULL DEFAULT 1,

    -- System Fields
    [Domain_ID] INT NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT [PK_Project_Confirmation_Cards] PRIMARY KEY CLUSTERED ([Project_Confirmation_Card_ID] ASC),
    CONSTRAINT [FK_Project_Confirmation_Cards_Projects] FOREIGN KEY ([Project_ID])
        REFERENCES [dbo].[Projects]([Project_ID]),
    CONSTRAINT [FK_Project_Confirmation_Cards_Congregations] FOREIGN KEY ([Congregation_ID])
        REFERENCES [dbo].[Congregations]([Congregation_ID]),
    CONSTRAINT [FK_Project_Confirmation_Cards_Card_Types] FOREIGN KEY ([Card_Type_ID])
        REFERENCES [dbo].[Card_Types]([Card_Type_ID]),
    CONSTRAINT [FK_Project_Confirmation_Cards_Domains] FOREIGN KEY ([Domain_ID])
        REFERENCES [dbo].[dp_Domains]([Domain_ID])
);

PRINT 'Created new table structure';
GO

-- ===================================================================
-- STEP 4: Recreate indexes
-- ===================================================================
PRINT 'Creating indexes...';

CREATE NONCLUSTERED INDEX [IX_Project_Confirmation_Cards_Project_ID]
    ON [dbo].[Project_Confirmation_Cards]([Project_ID] ASC);

CREATE NONCLUSTERED INDEX [IX_Project_Confirmation_Cards_Congregation_ID]
    ON [dbo].[Project_Confirmation_Cards]([Congregation_ID] ASC);

PRINT 'Created indexes';
GO

-- ===================================================================
-- STEP 5: Restore data from backup
-- ===================================================================
PRINT 'Restoring data from backup...';

SET IDENTITY_INSERT [dbo].[Project_Confirmation_Cards] ON;

INSERT INTO [dbo].[Project_Confirmation_Cards] (
    Project_Confirmation_Card_ID,
    Project_ID,
    Congregation_ID,
    Card_Type_ID,
    Card_Configuration,
    Display_Order,
    Is_Active,
    Domain_ID
)
SELECT
    Project_Confirmation_Card_ID,
    Project_ID,
    Congregation_ID,
    Card_Type_ID,
    Card_Configuration,
    Display_Order,
    Is_Active,
    Domain_ID
FROM #ProjectConfirmationCardsBackup
ORDER BY Project_Confirmation_Card_ID;

SET IDENTITY_INSERT [dbo].[Project_Confirmation_Cards] OFF;

PRINT 'Restored ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' records';
GO

-- ===================================================================
-- STEP 6: Add column descriptions
-- ===================================================================
EXEC sys.sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Links to Projects table. Each confirmation card belongs to a project.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_Confirmation_Cards',
    @level2type = N'COLUMN', @level2name = N'Project_ID';

EXEC sys.sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'Campus-specific card. NULL means card applies to all campuses.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_Confirmation_Cards',
    @level2type = N'COLUMN', @level2name = N'Congregation_ID';

EXEC sys.sp_addextendedproperty
    @name = N'MS_Description',
    @value = N'JSON configuration specific to this card type. Schema varies by Card_Type_ID.',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'Project_Confirmation_Cards',
    @level2type = N'COLUMN', @level2name = N'Card_Configuration';
GO

-- ===================================================================
-- STEP 7: Verify migration
-- ===================================================================
PRINT '';
PRINT '===================================================================';
PRINT 'Migration Complete!';
PRINT '';
PRINT 'Table Structure:';
PRINT '  1. Project_Confirmation_Card_ID (PK)';
PRINT '  2. Project_ID (FK → Projects)';
PRINT '  3. Congregation_ID (FK → Congregations, NULL = All Campuses)';
PRINT '  4. Card_Type_ID (FK → Card_Types)';
PRINT '  5. Card_Configuration (JSON)';
PRINT '  6. Display_Order';
PRINT '  7. Is_Active';
PRINT '  8. Domain_ID (FK → dp_Domains)';
PRINT '';
PRINT 'Records migrated: ';
SELECT COUNT(*) AS Total_Records FROM Project_Confirmation_Cards;
PRINT '';
PRINT 'Next Steps:';
PRINT '  1. Update any stored procedures that reference Project_RSVP_ID';
PRINT '  2. Update MinistryPlatform page configuration to reorder columns';
PRINT '  3. Test the RSVP Management app to ensure cards display correctly';
PRINT '===================================================================';
GO
