-- =============================================
-- Migration: Fix RSVP Email Template Schema
-- =============================================
-- This migration fixes the Projects table RSVP-related columns:
-- 1. Removes incorrect columns (RSVP_Confirmation_Template_ID)
-- 2. Adds proper FK to dp_Communication_Templates for email templates
-- 3. Adds reminder email template and days to remind fields
-- 4. Reorders columns for better organization
--
-- NOTE: This is a non-destructive migration. Data will be preserved.
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Starting RSVP Email Template Schema Fix Migration...';
GO

-- =============================================
-- Step 1: Check if migration is needed
-- =============================================
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('Projects')
    AND name = 'RSVP_Reminder_Email_Template_ID'
)
BEGIN
    PRINT 'Migration needed - proceeding...';

    -- =============================================
    -- Step 2: Add new columns (if they don't exist)
    -- =============================================

    -- Add RSVP_Reminder_Email_Template_ID
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Reminder_Email_Template_ID')
    BEGIN
        ALTER TABLE Projects
        ADD RSVP_Reminder_Email_Template_ID INT NULL;

        PRINT '✓ Added RSVP_Reminder_Email_Template_ID column';
    END

    -- Add RSVP_Days_To_Remind
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Days_To_Remind')
    BEGIN
        ALTER TABLE Projects
        ADD RSVP_Days_To_Remind INT NULL;

        PRINT '✓ Added RSVP_Days_To_Remind column';
    END

    -- =============================================
    -- Step 3: Rename incorrect column if it exists
    -- =============================================

    IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Confirmation_Template_ID')
    BEGIN
        -- If RSVP_Confirmation_Email_Template_ID doesn't exist yet, rename the old one
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Confirmation_Email_Template_ID')
        BEGIN
            EXEC sp_rename 'Projects.RSVP_Confirmation_Template_ID', 'RSVP_Confirmation_Email_Template_ID', 'COLUMN';
            PRINT '✓ Renamed RSVP_Confirmation_Template_ID to RSVP_Confirmation_Email_Template_ID';
        END
        ELSE
        BEGIN
            -- Both exist - drop the old one after copying data if needed
            EXEC('UPDATE Projects SET RSVP_Confirmation_Email_Template_ID = RSVP_Confirmation_Template_ID WHERE RSVP_Confirmation_Email_Template_ID IS NULL');
            ALTER TABLE Projects DROP COLUMN RSVP_Confirmation_Template_ID;
            PRINT '✓ Removed duplicate RSVP_Confirmation_Template_ID column';
        END
    END

    -- =============================================
    -- Step 4: Add Foreign Key Constraints
    -- =============================================

    -- FK for Confirmation Email Template
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_Projects_RSVP_Confirmation_Email_Template'
    )
    BEGIN
        ALTER TABLE Projects
        ADD CONSTRAINT FK_Projects_RSVP_Confirmation_Email_Template
        FOREIGN KEY (RSVP_Confirmation_Email_Template_ID)
        REFERENCES dp_Communication_Templates(Communication_Template_ID);

        PRINT '✓ Added FK constraint for RSVP_Confirmation_Email_Template_ID';
    END

    -- FK for Reminder Email Template
    IF NOT EXISTS (
        SELECT 1 FROM sys.foreign_keys
        WHERE name = 'FK_Projects_RSVP_Reminder_Email_Template'
    )
    BEGIN
        ALTER TABLE Projects
        ADD CONSTRAINT FK_Projects_RSVP_Reminder_Email_Template
        FOREIGN KEY (RSVP_Reminder_Email_Template_ID)
        REFERENCES dp_Communication_Templates(Communication_Template_ID);

        PRINT '✓ Added FK constraint for RSVP_Reminder_Email_Template_ID';
    END

    PRINT 'Migration completed successfully!';
END
ELSE
BEGIN
    PRINT 'Migration already applied - skipping.';
END
GO

-- =============================================
-- Step 5: Verify the schema
-- =============================================
PRINT '';
PRINT 'Current RSVP-related columns in Projects table:';
SELECT
    c.name AS Column_Name,
    t.name AS Data_Type,
    c.max_length AS Max_Length,
    c.is_nullable AS Is_Nullable,
    CASE
        WHEN fk.name IS NOT NULL THEN 'FK: ' + OBJECT_NAME(fk.referenced_object_id) + '.' + COL_NAME(fk.referenced_object_id, fkc.referenced_column_id)
        ELSE ''
    END AS Foreign_Key
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN sys.foreign_key_columns fkc ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
LEFT JOIN sys.foreign_keys fk ON fkc.constraint_object_id = fk.object_id
WHERE c.object_id = OBJECT_ID('Projects')
AND c.name LIKE 'RSVP%'
ORDER BY c.column_id;
GO

PRINT '';
PRINT '=============================================';
PRINT 'Next Steps:';
PRINT '1. Update the stored procedure: sp-get-rsvp-project-details.sql';
PRINT '2. Update TypeScript types to match new schema';
PRINT '3. Update UI to support Reminder Email Template';
PRINT '4. Test all RSVP functionality';
PRINT '=============================================';
GO
