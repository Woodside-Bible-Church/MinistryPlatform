-- ===================================================================
-- CONSOLIDATE Project_RSVPs INTO Projects TABLE
-- ===================================================================
-- This migration eliminates the Project_RSVPs table and moves all
-- RSVP-related fields directly onto the Projects table.
--
-- All fields are nullable to support projects that don't have RSVPs.
-- Fields are prefixed with "RSVP_" to clearly indicate purpose.
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '';
PRINT '===================================================================';
PRINT 'CONSOLIDATING Project_RSVPs INTO Projects TABLE';
PRINT '===================================================================';
PRINT '';

-- ===================================================================
-- STEP 1: Add RSVP columns to Projects table
-- ===================================================================
PRINT 'STEP 1: Adding RSVP columns to Projects table...';

-- RSVP_Title
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Title')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Title] NVARCHAR(255) NULL;
    PRINT '  ✓ Added RSVP_Title column';
END
ELSE
    PRINT '  - RSVP_Title column already exists';
GO

-- RSVP_Description
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Description')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Description] NVARCHAR(MAX) NULL;
    PRINT '  ✓ Added RSVP_Description column';
END
ELSE
    PRINT '  - RSVP_Description column already exists';
GO

-- RSVP_Start_Date (formerly Start_Date)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Start_Date')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Start_Date] DATETIME NULL;
    PRINT '  ✓ Added RSVP_Start_Date column';
END
ELSE
    PRINT '  - RSVP_Start_Date column already exists';
GO

-- RSVP_End_Date (formerly End_Date)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_End_Date')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_End_Date] DATETIME NULL;
    PRINT '  ✓ Added RSVP_End_Date column';
END
ELSE
    PRINT '  - RSVP_End_Date column already exists';
GO

-- RSVP_Is_Active (formerly Is_Active)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Is_Active')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Is_Active] BIT NULL DEFAULT 0;
    PRINT '  ✓ Added RSVP_Is_Active column';
END
ELSE
    PRINT '  - RSVP_Is_Active column already exists';
GO

-- RSVP_Require_Contact_Lookup (formerly Require_Contact_Lookup)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Require_Contact_Lookup')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Require_Contact_Lookup] BIT NULL DEFAULT 0;
    PRINT '  ✓ Added RSVP_Require_Contact_Lookup column';
END
ELSE
    PRINT '  - RSVP_Require_Contact_Lookup column already exists';
GO

-- RSVP_Allow_Guest_Submission (formerly Allow_Guest_Submission)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Allow_Guest_Submission')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Allow_Guest_Submission] BIT NULL DEFAULT 1;
    PRINT '  ✓ Added RSVP_Allow_Guest_Submission column';
END
ELSE
    PRINT '  - RSVP_Allow_Guest_Submission column already exists';
GO

-- RSVP_Confirmation_Email_Template_ID (formerly Confirmation_Email_Template_ID)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Confirmation_Email_Template_ID')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Confirmation_Email_Template_ID] INT NULL;
    PRINT '  ✓ Added RSVP_Confirmation_Email_Template_ID column';
END
ELSE
    PRINT '  - RSVP_Confirmation_Email_Template_ID column already exists';
GO

-- RSVP_Slug
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Slug')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Slug] NVARCHAR(100) NULL;
    PRINT '  ✓ Added RSVP_Slug column';
END
ELSE
    PRINT '  - RSVP_Slug column already exists';
GO

-- RSVP_Confirmation_Template_ID (formerly Confirmation_Template_ID)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Confirmation_Template_ID')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Confirmation_Template_ID] INT NULL;
    PRINT '  ✓ Added RSVP_Confirmation_Template_ID column';
END
ELSE
    PRINT '  - RSVP_Confirmation_Template_ID column already exists';
GO

-- RSVP_Primary_Color (branding)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Primary_Color')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Primary_Color] NVARCHAR(32) NULL;
    PRINT '  ✓ Added RSVP_Primary_Color column';
END
ELSE
    PRINT '  - RSVP_Primary_Color column already exists';
GO

-- RSVP_Secondary_Color (branding)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Secondary_Color')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Secondary_Color] NVARCHAR(32) NULL;
    PRINT '  ✓ Added RSVP_Secondary_Color column';
END
ELSE
    PRINT '  - RSVP_Secondary_Color column already exists';
GO

-- RSVP_Accent_Color (branding)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Accent_Color')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Accent_Color] NVARCHAR(32) NULL;
    PRINT '  ✓ Added RSVP_Accent_Color column';
END
ELSE
    PRINT '  - RSVP_Accent_Color column already exists';
GO

-- RSVP_Background_Color (branding)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Projects]') AND name = 'RSVP_Background_Color')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [RSVP_Background_Color] NVARCHAR(32) NULL;
    PRINT '  ✓ Added RSVP_Background_Color column';
END
ELSE
    PRINT '  - RSVP_Background_Color column already exists';
GO

-- Add unique constraint on RSVP_Slug where it's not null
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Projects_RSVP_Slug' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UQ_Projects_RSVP_Slug]
    ON [dbo].[Projects]([RSVP_Slug] ASC)
    WHERE [RSVP_Slug] IS NOT NULL;
    PRINT '  ✓ Created unique index on RSVP_Slug';
END
ELSE
    PRINT '  - Unique index on RSVP_Slug already exists';
GO

PRINT '';
PRINT 'STEP 1 Complete: All RSVP columns added to Projects table';
PRINT '';

-- ===================================================================
-- STEP 2: Migrate data from Project_RSVPs to Projects
-- ===================================================================
PRINT 'STEP 2: Migrating data from Project_RSVPs to Projects...';

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVPs]'))
BEGIN
    UPDATE p
    SET
        p.RSVP_Title = pr.RSVP_Title,
        p.RSVP_Description = pr.RSVP_Description,
        p.RSVP_Start_Date = pr.Start_Date,
        p.RSVP_End_Date = pr.End_Date,
        p.RSVP_Is_Active = pr.Is_Active,
        p.RSVP_Require_Contact_Lookup = pr.Require_Contact_Lookup,
        p.RSVP_Allow_Guest_Submission = pr.Allow_Guest_Submission,
        p.RSVP_Confirmation_Email_Template_ID = pr.Confirmation_Email_Template_ID,
        p.RSVP_Slug = pr.RSVP_Slug,
        p.RSVP_Confirmation_Template_ID = pr.Confirmation_Template_ID
    FROM [dbo].[Projects] p
    INNER JOIN [dbo].[Project_RSVPs] pr ON p.Project_ID = pr.Project_ID;

    PRINT '  ✓ Migrated ' + CAST(@@ROWCOUNT AS NVARCHAR(10)) + ' Project_RSVP records to Projects';
END
ELSE
    PRINT '  - Project_RSVPs table does not exist';
GO

-- ===================================================================
-- STEP 3: Migrate file attachments from Header_Image_URL to dp_Files
-- ===================================================================
PRINT '';
PRINT 'STEP 3: Migrating file attachments to dp_Files...';
PRINT '  NOTE: This requires manual file uploads to MinistryPlatform.';
PRINT '  After uploading files, use these queries to verify:';
PRINT '';
PRINT '  -- Background Image (RSVP_BG_Image.jpg)';
PRINT '  SELECT * FROM dp_Files WHERE Table_Name = ''Projects'' AND File_Name = ''RSVP_BG_Image.jpg'';';
PRINT '';
PRINT '  -- Card Image (RSVP_Image.jpg)';
PRINT '  SELECT * FROM dp_Files WHERE Table_Name = ''Projects'' AND File_Name = ''RSVP_Image.jpg'';';
PRINT '';
PRINT '  Manual Steps:';
PRINT '  1. Open each Project in MinistryPlatform admin';
PRINT '  2. Download the image from the old Header_Image_URL field';
PRINT '  3. Upload as ''RSVP_BG_Image.jpg'' attachment to the Project record';
PRINT '  4. Upload additional project images as ''RSVP_Image.jpg''';
PRINT '';

-- ===================================================================
-- STEP 4: Update foreign key references
-- ===================================================================
PRINT 'STEP 4: Updating foreign key references...';
PRINT '';

-- Project_RSVP_Questions: Add Project_ID column
PRINT '  Updating Project_RSVP_Questions table...';
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVP_Questions]') AND name = 'Project_ID')
BEGIN
    ALTER TABLE [dbo].[Project_RSVP_Questions]
    ADD [Project_ID] INT NULL;
    PRINT '    ✓ Added Project_ID column';
END
ELSE
    PRINT '    - Project_ID column already exists';
GO

-- Populate Project_ID in Project_RSVP_Questions
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVP_Questions]') AND name = 'Project_ID')
BEGIN
    UPDATE prq
    SET prq.Project_ID = pr.Project_ID
    FROM [dbo].[Project_RSVP_Questions] prq
    INNER JOIN [dbo].[Project_RSVPs] pr ON prq.Project_RSVP_ID = pr.Project_RSVP_ID
    WHERE prq.Project_ID IS NULL;

    DECLARE @RowsUpdated1 INT = @@ROWCOUNT;
    PRINT '    ✓ Populated ' + CAST(@RowsUpdated1 AS NVARCHAR(10)) + ' rows with Project_ID';
END
GO

-- Make Project_ID NOT NULL in Project_RSVP_Questions
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_RSVP_Questions]') AND name = 'Project_ID' AND is_nullable = 1)
BEGIN
    ALTER TABLE [dbo].[Project_RSVP_Questions]
    ALTER COLUMN [Project_ID] INT NOT NULL;
    PRINT '    ✓ Made Project_ID NOT NULL';
END
GO

-- Create index on Project_ID in Project_RSVP_Questions
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Project_RSVP_Questions_Project_ID' AND object_id = OBJECT_ID('Project_RSVP_Questions'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Project_RSVP_Questions_Project_ID]
    ON [dbo].[Project_RSVP_Questions]([Project_ID] ASC);
    PRINT '    ✓ Created index on Project_ID';
END
GO

-- Project_Confirmation_Cards: Add Project_ID column
PRINT '  Updating Project_Confirmation_Cards table...';
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_Confirmation_Cards]') AND name = 'Project_ID')
BEGIN
    ALTER TABLE [dbo].[Project_Confirmation_Cards]
    ADD [Project_ID] INT NULL;
    PRINT '    ✓ Added Project_ID column';
END
ELSE
    PRINT '    - Project_ID column already exists';
GO

-- Populate Project_ID in Project_Confirmation_Cards
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_Confirmation_Cards]') AND name = 'Project_ID')
BEGIN
    UPDATE pcc
    SET pcc.Project_ID = pr.Project_ID
    FROM [dbo].[Project_Confirmation_Cards] pcc
    INNER JOIN [dbo].[Project_RSVPs] pr ON pcc.Project_RSVP_ID = pr.Project_RSVP_ID
    WHERE pcc.Project_ID IS NULL;

    DECLARE @RowsUpdated2 INT = @@ROWCOUNT;
    PRINT '    ✓ Populated ' + CAST(@RowsUpdated2 AS NVARCHAR(10)) + ' rows with Project_ID';
END
GO

-- Make Project_ID NOT NULL in Project_Confirmation_Cards
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Project_Confirmation_Cards]') AND name = 'Project_ID' AND is_nullable = 1)
BEGIN
    ALTER TABLE [dbo].[Project_Confirmation_Cards]
    ALTER COLUMN [Project_ID] INT NOT NULL;
    PRINT '    ✓ Made Project_ID NOT NULL';
END
GO

-- Create index on Project_ID in Project_Confirmation_Cards
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Project_Confirmation_Cards_Project_ID' AND object_id = OBJECT_ID('Project_Confirmation_Cards'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Project_Confirmation_Cards_Project_ID]
    ON [dbo].[Project_Confirmation_Cards]([Project_ID] ASC);
    PRINT '    ✓ Created index on Project_ID';
END
GO

-- Event_RSVPs: Add Project_ID column
PRINT '  Updating Event_RSVPs table...';
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Event_RSVPs]') AND name = 'Project_ID')
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    ADD [Project_ID] INT NULL;
    PRINT '    ✓ Added Project_ID column';
END
ELSE
    PRINT '    - Project_ID column already exists';
GO

-- Populate Project_ID in Event_RSVPs
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Event_RSVPs]') AND name = 'Project_ID')
BEGIN
    UPDATE er
    SET er.Project_ID = pr.Project_ID
    FROM [dbo].[Event_RSVPs] er
    INNER JOIN [dbo].[Project_RSVPs] pr ON er.Project_RSVP_ID = pr.Project_RSVP_ID
    WHERE er.Project_ID IS NULL;

    DECLARE @RowsUpdated3 INT = @@ROWCOUNT;
    PRINT '    ✓ Populated ' + CAST(@RowsUpdated3 AS NVARCHAR(10)) + ' rows with Project_ID';
END
GO

-- Make Project_ID NOT NULL in Event_RSVPs
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Event_RSVPs]') AND name = 'Project_ID' AND is_nullable = 1)
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    ALTER COLUMN [Project_ID] INT NOT NULL;
    PRINT '    ✓ Made Project_ID NOT NULL';
END
GO

-- Create index on Project_ID in Event_RSVPs
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Event_RSVPs_Project_ID' AND object_id = OBJECT_ID('Event_RSVPs'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Event_RSVPs_Project_ID]
    ON [dbo].[Event_RSVPs]([Project_ID] ASC);
    PRINT '    ✓ Created index on Project_ID';
END
GO

-- RSVP_Email_Campaigns: Add Project_ID column (if table exists)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]'))
BEGIN
    PRINT '  Updating RSVP_Email_Campaigns table...';
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]') AND name = 'Project_ID')
    BEGIN
        ALTER TABLE [dbo].[RSVP_Email_Campaigns]
        ADD [Project_ID] INT NULL;
        PRINT '    ✓ Added Project_ID column';
    END
    ELSE
        PRINT '    - Project_ID column already exists';
END
ELSE
    PRINT '  - RSVP_Email_Campaigns table does not exist';
GO

-- Populate Project_ID in RSVP_Email_Campaigns
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]'))
   AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]') AND name = 'Project_ID')
BEGIN
    UPDATE rec
    SET rec.Project_ID = pr.Project_ID
    FROM [dbo].[RSVP_Email_Campaigns] rec
    INNER JOIN [dbo].[Project_RSVPs] pr ON rec.Project_RSVP_ID = pr.Project_RSVP_ID
    WHERE rec.Project_ID IS NULL;

    DECLARE @RowsUpdated4 INT = @@ROWCOUNT;
    PRINT '    ✓ Populated ' + CAST(@RowsUpdated4 AS NVARCHAR(10)) + ' rows with Project_ID';
END
GO

-- Make Project_ID NOT NULL in RSVP_Email_Campaigns
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]'))
   AND EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]') AND name = 'Project_ID' AND is_nullable = 1)
BEGIN
    ALTER TABLE [dbo].[RSVP_Email_Campaigns]
    ALTER COLUMN [Project_ID] INT NOT NULL;
    PRINT '    ✓ Made Project_ID NOT NULL';
END
GO

-- Create index on Project_ID in RSVP_Email_Campaigns
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]'))
   AND NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RSVP_Email_Campaigns_Project_ID' AND object_id = OBJECT_ID('RSVP_Email_Campaigns'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_RSVP_Email_Campaigns_Project_ID]
    ON [dbo].[RSVP_Email_Campaigns]([Project_ID] ASC);
    PRINT '    ✓ Created index on Project_ID';
END
GO

PRINT '';
PRINT 'STEP 4 Complete: All foreign keys updated';
PRINT '';

-- ===================================================================
-- STEP 5: Drop old foreign key constraints
-- ===================================================================
PRINT 'STEP 5: Dropping old foreign key constraints...';

-- Project_RSVP_Questions
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Project_RSVP_Questions_Project_RSVPs')
BEGIN
    ALTER TABLE [dbo].[Project_RSVP_Questions]
    DROP CONSTRAINT [FK_Project_RSVP_Questions_Project_RSVPs];
    PRINT '  ✓ Dropped FK_Project_RSVP_Questions_Project_RSVPs';
END

-- Project_Confirmation_Cards
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Project_Confirmation_Cards_Project_RSVPs')
BEGIN
    ALTER TABLE [dbo].[Project_Confirmation_Cards]
    DROP CONSTRAINT [FK_Project_Confirmation_Cards_Project_RSVPs];
    PRINT '  ✓ Dropped FK_Project_Confirmation_Cards_Project_RSVPs';
END

-- Event_RSVPs
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Event_RSVPs_Project_RSVPs')
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    DROP CONSTRAINT [FK_Event_RSVPs_Project_RSVPs];
    PRINT '  ✓ Dropped FK_Event_RSVPs_Project_RSVPs';
END

-- RSVP_Email_Campaigns (if exists)
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_RSVP_Email_Campaigns_Project_RSVPs')
BEGIN
    ALTER TABLE [dbo].[RSVP_Email_Campaigns]
    DROP CONSTRAINT [FK_RSVP_Email_Campaigns_Project_RSVPs];
    PRINT '  ✓ Dropped FK_RSVP_Email_Campaigns_Project_RSVPs';
END

PRINT '';

-- ===================================================================
-- STEP 6: Create new foreign key constraints
-- ===================================================================
PRINT 'STEP 6: Creating new foreign key constraints...';

-- Project_RSVP_Questions -> Projects
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Project_RSVP_Questions_Projects')
BEGIN
    ALTER TABLE [dbo].[Project_RSVP_Questions]
    ADD CONSTRAINT [FK_Project_RSVP_Questions_Projects]
    FOREIGN KEY ([Project_ID]) REFERENCES [dbo].[Projects]([Project_ID]);
    PRINT '  ✓ Created FK_Project_RSVP_Questions_Projects';
END

-- Project_Confirmation_Cards -> Projects
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Project_Confirmation_Cards_Projects')
BEGIN
    ALTER TABLE [dbo].[Project_Confirmation_Cards]
    ADD CONSTRAINT [FK_Project_Confirmation_Cards_Projects]
    FOREIGN KEY ([Project_ID]) REFERENCES [dbo].[Projects]([Project_ID]);
    PRINT '  ✓ Created FK_Project_Confirmation_Cards_Projects';
END

-- Event_RSVPs -> Projects
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Event_RSVPs_Projects')
BEGIN
    ALTER TABLE [dbo].[Event_RSVPs]
    ADD CONSTRAINT [FK_Event_RSVPs_Projects]
    FOREIGN KEY ([Project_ID]) REFERENCES [dbo].[Projects]([Project_ID]);
    PRINT '  ✓ Created FK_Event_RSVPs_Projects';
END

-- RSVP_Email_Campaigns -> Projects (if table exists)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]'))
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_RSVP_Email_Campaigns_Projects')
    BEGIN
        ALTER TABLE [dbo].[RSVP_Email_Campaigns]
        ADD CONSTRAINT [FK_RSVP_Email_Campaigns_Projects]
        FOREIGN KEY ([Project_ID]) REFERENCES [dbo].[Projects]([Project_ID]);
        PRINT '  ✓ Created FK_RSVP_Email_Campaigns_Projects';
    END
END

PRINT '';

-- ===================================================================
-- STEP 7: Drop Project_RSVP_ID columns (OPTIONAL - Can keep for transition period)
-- ===================================================================
PRINT 'STEP 7: Marking old Project_RSVP_ID columns for deprecation...';
PRINT '';
PRINT '  NOTE: Project_RSVP_ID columns are kept for backward compatibility.';
PRINT '  After all stored procedures and code are updated to use Project_ID,';
PRINT '  you can run the following commands to remove them:';
PRINT '';
PRINT '  ALTER TABLE [dbo].[Project_RSVP_Questions] DROP COLUMN [Project_RSVP_ID];';
PRINT '  ALTER TABLE [dbo].[Project_Confirmation_Cards] DROP COLUMN [Project_RSVP_ID];';
PRINT '  ALTER TABLE [dbo].[Event_RSVPs] DROP COLUMN [Project_RSVP_ID];';
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]'))
    PRINT '  ALTER TABLE [dbo].[RSVP_Email_Campaigns] DROP COLUMN [Project_RSVP_ID];';
PRINT '';

-- ===================================================================
-- STEP 8: Drop Project_RSVPs table (OPTIONAL - Keep for rollback)
-- ===================================================================
PRINT 'STEP 8: Archiving Project_RSVPs table...';
PRINT '';
PRINT '  NOTE: Project_RSVPs table is kept for safety.';
PRINT '  After verifying all data and functionality, you can drop it with:';
PRINT '';
PRINT '  DROP TABLE [dbo].[Project_RSVPs];';
PRINT '';

-- ===================================================================
-- FINAL SUMMARY
-- ===================================================================
PRINT '===================================================================';
PRINT 'MIGRATION COMPLETE!';
PRINT '===================================================================';
PRINT '';
PRINT 'Next Steps:';
PRINT '1. Update stored procedures to use Projects.RSVP_* fields';
PRINT '2. Update TypeScript types to reference Projects instead of Project_RSVPs';
PRINT '3. Upload RSVP images as attachments to Projects (RSVP_BG_Image.jpg, RSVP_Image.jpg)';
PRINT '4. Test all RSVP functionality thoroughly';
PRINT '5. After verification, drop Project_RSVP_ID columns and Project_RSVPs table';
PRINT '';
PRINT 'Database Schema Changes:';
PRINT '✓ Projects table: Added 14 RSVP-related columns (10 config + 4 branding colors)';
PRINT '✓ Data migrated from Project_RSVPs to Projects';
PRINT '✓ Project_RSVP_Questions: Now references Projects.Project_ID';
PRINT '✓ Project_Confirmation_Cards: Now references Projects.Project_ID';
PRINT '✓ Event_RSVPs: Now references Projects.Project_ID';
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RSVP_Email_Campaigns]'))
    PRINT '✓ RSVP_Email_Campaigns: Now references Projects.Project_ID';
PRINT '';
PRINT '===================================================================';
GO
