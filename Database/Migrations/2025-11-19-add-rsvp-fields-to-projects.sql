-- ===================================================================
-- Migration: Add RSVP Fields to Projects Table
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Add all RSVP-related fields to Projects table
--          so we can use Projects directly instead of Project_RSVPs
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================'
PRINT 'Adding RSVP Fields to Projects Table'
PRINT '========================================'

-- ===================================================================
-- Add Form_ID (Link to Forms table for additional questions)
-- ===================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'Form_ID')
BEGIN
    ALTER TABLE Projects
    ADD Form_ID INT NULL
    PRINT '  ✓ Added Form_ID column'
END
ELSE
BEGIN
    PRINT '  ✓ Form_ID already exists'
END

GO

-- ===================================================================
-- Add Foreign Key Constraint for Form_ID
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_Projects_Forms'
    AND parent_object_id = OBJECT_ID('Projects')
)
BEGIN
    ALTER TABLE Projects
    ADD CONSTRAINT FK_Projects_Forms
    FOREIGN KEY (Form_ID) REFERENCES Forms(Form_ID)
    PRINT '  ✓ Added foreign key constraint to Forms table'
END
ELSE
BEGIN
    PRINT '  ✓ Foreign key constraint to Forms already exists'
END

GO

-- ===================================================================
-- Verify all expected RSVP fields exist
-- ===================================================================
PRINT ''
PRINT 'Verifying all RSVP fields in Projects table:'

-- Check for all expected RSVP fields
DECLARE @MissingFields TABLE (FieldName NVARCHAR(100))

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Title')
    INSERT INTO @MissingFields VALUES ('RSVP_Title')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Description')
    INSERT INTO @MissingFields VALUES ('RSVP_Description')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Slug')
    INSERT INTO @MissingFields VALUES ('RSVP_Slug')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Is_Active')
    INSERT INTO @MissingFields VALUES ('RSVP_Is_Active')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Start_Date')
    INSERT INTO @MissingFields VALUES ('RSVP_Start_Date')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_End_Date')
    INSERT INTO @MissingFields VALUES ('RSVP_End_Date')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Require_Contact_Lookup')
    INSERT INTO @MissingFields VALUES ('RSVP_Require_Contact_Lookup')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Allow_Guest_Submission')
    INSERT INTO @MissingFields VALUES ('RSVP_Allow_Guest_Submission')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Primary_Color')
    INSERT INTO @MissingFields VALUES ('RSVP_Primary_Color')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Secondary_Color')
    INSERT INTO @MissingFields VALUES ('RSVP_Secondary_Color')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'RSVP_Accent_Color')
    INSERT INTO @MissingFields VALUES ('RSVP_Accent_Color')

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'Form_ID')
    INSERT INTO @MissingFields VALUES ('Form_ID')

-- Report missing fields
IF EXISTS (SELECT 1 FROM @MissingFields)
BEGIN
    PRINT ''
    PRINT '⚠ WARNING: The following RSVP fields are MISSING from Projects table:'
    SELECT '  - ' + FieldName AS MissingField FROM @MissingFields
    PRINT ''
    PRINT 'These fields need to be added before the stored procedures will work!'
    PRINT 'You may need to run a previous migration that adds these base RSVP fields.'
END
ELSE
BEGIN
    PRINT '  ✓ All required RSVP fields exist in Projects table'
END

GO

PRINT ''
PRINT '========================================'
PRINT 'Migration Complete!'
PRINT '========================================'
PRINT ''
PRINT 'Summary:'
PRINT '  - Added Form_ID (link to Forms table for additional questions)'
PRINT '  - Added foreign key to Forms table'
PRINT ''
PRINT 'Note: Images are accessed via dp_Files table (File_Name + Table_Name)'
PRINT '      NOT via URL fields in Projects table'
PRINT ''

GO
