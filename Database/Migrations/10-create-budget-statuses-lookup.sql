-- =============================================
-- Create Project_Budget_Statuses Lookup Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Create lookup table for budget statuses and convert Projects.Budget_Status to FK
-- =============================================

USE [MinistryPlatform]
GO

-- Step 1: Create lookup table
IF OBJECT_ID('dbo.Project_Budget_Statuses', 'U') IS NULL
BEGIN
    PRINT 'Creating Project_Budget_Statuses table...'

    CREATE TABLE dbo.Project_Budget_Statuses (
        Project_Budget_Status_ID INT PRIMARY KEY IDENTITY(1,1),
        Status_Name NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL,
        Sort_Order INT NULL,
        Display_Color NVARCHAR(20) NULL  -- For UI badges
    );

    PRINT 'Project_Budget_Statuses table created.'

    -- Seed with standard statuses
    PRINT 'Seeding budget statuses...'
    INSERT INTO dbo.Project_Budget_Statuses (Status_Name, Description, Sort_Order, Display_Color) VALUES
    ('Draft', 'Budget is being planned but not yet active', 1, 'gray'),
    ('Active', 'Budget is currently active and in use', 2, 'green'),
    ('Under Review', 'Budget is being reviewed for approval', 3, 'yellow'),
    ('Closed', 'Event completed, budget finalized', 4, 'blue'),
    ('Archived', 'Budget archived for historical reference', 5, 'gray');

    PRINT 'Budget statuses seeded.'
END
ELSE
    PRINT 'Project_Budget_Statuses table already exists, skipping.'

GO

-- Step 2: Convert Projects.Budget_Status from VARCHAR to FK
-- Check if old VARCHAR column exists
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budget_Status' AND system_type_id = 167) -- 167 = VARCHAR
BEGIN
    PRINT 'Converting Budget_Status from VARCHAR to FK...'

    -- Drop the old VARCHAR column
    ALTER TABLE dbo.Projects DROP COLUMN Budget_Status;
    PRINT 'Old Budget_Status column dropped.'

    -- Add new FK column
    ALTER TABLE dbo.Projects ADD Budget_Status_ID INT NULL;
    PRINT 'Budget_Status_ID column added.'

    -- Add foreign key constraint
    ALTER TABLE dbo.Projects ADD CONSTRAINT FK_Projects_BudgetStatus
        FOREIGN KEY (Budget_Status_ID) REFERENCES dbo.Project_Budget_Statuses(Project_Budget_Status_ID);
    PRINT 'Foreign key constraint added.'
END
ELSE IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'Budget_Status_ID')
BEGIN
    PRINT 'Budget_Status_ID column already exists, skipping conversion.'
END
ELSE
BEGIN
    PRINT 'Adding Budget_Status_ID column...'
    ALTER TABLE dbo.Projects ADD Budget_Status_ID INT NULL;

    ALTER TABLE dbo.Projects ADD CONSTRAINT FK_Projects_BudgetStatus
        FOREIGN KEY (Budget_Status_ID) REFERENCES dbo.Project_Budget_Statuses(Project_Budget_Status_ID);
    PRINT 'Budget_Status_ID column added with FK constraint.'
END

GO

-- Step 3: Update Field Management
PRINT 'Updating Field Management...'

-- Remove old Budget_Status entry if it exists
DELETE FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budget_Status';

-- Add Budget_Status_ID entry
IF NOT EXISTS (SELECT 1 FROM dp_Page_Fields WHERE Page_ID = 957 AND Field_Name = 'Budget_Status_ID')
BEGIN
    INSERT INTO dp_Page_Fields (Page_ID, Field_Name, Group_Name, View_Order, Field_Label, Required, Hidden)
    VALUES (957, 'Budget_Status_ID', '3. Budget', 2, 'Status', 0, 0);
    PRINT 'Added Budget_Status_ID field management.'
END
ELSE
    PRINT 'Budget_Status_ID field management already exists.'

PRINT 'Budget statuses lookup table setup complete.'
GO
