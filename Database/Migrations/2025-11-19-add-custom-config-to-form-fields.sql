-- ===================================================================
-- Migration: Add Custom_Field_Configuration to Form_Fields
-- ===================================================================
-- Date: 2025-11-19
-- Purpose: Add JSON configuration field to Form_Fields to support
--          custom RSVP field types and options beyond MP's native types
-- ===================================================================

USE [MinistryPlatform]
GO

PRINT '========================================'
PRINT 'Adding Custom_Field_Configuration to Form_Fields'
PRINT '========================================'

-- ===================================================================
-- Step 1: Add Custom_Field_Configuration column if it doesn't exist
-- ===================================================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Form_Fields') AND name = 'Custom_Field_Configuration')
BEGIN
    ALTER TABLE Form_Fields
    ADD Custom_Field_Configuration NVARCHAR(MAX) NULL
    PRINT '  ✓ Added Custom_Field_Configuration column to Form_Fields table'
END
ELSE
BEGIN
    PRINT '  ✓ Custom_Field_Configuration column already exists'
END

GO

-- ===================================================================
-- Step 2: Add check constraint to ensure valid JSON
-- ===================================================================
IF NOT EXISTS (
    SELECT * FROM sys.check_constraints
    WHERE name = 'CK_Form_Fields_Custom_Config_Valid_JSON'
    AND parent_object_id = OBJECT_ID('Form_Fields')
)
BEGIN
    ALTER TABLE Form_Fields
    ADD CONSTRAINT CK_Form_Fields_Custom_Config_Valid_JSON
    CHECK (Custom_Field_Configuration IS NULL OR ISJSON(Custom_Field_Configuration) = 1)
    PRINT '  ✓ Added check constraint for valid JSON'
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
PRINT '  - Added Custom_Field_Configuration column (NVARCHAR(MAX), nullable)'
PRINT '  - Added check constraint for valid JSON format'
PRINT '  - NULL values mean use MP native field type configuration'
PRINT ''
PRINT 'Example Configuration:'
PRINT '  {'
PRINT '    "component": "Counter",'
PRINT '    "min_value": 1,'
PRINT '    "max_value": 99,'
PRINT '    "default_value": 1,'
PRINT '    "icon": "Users",'
PRINT '    "helper_text": "How many people will attend?"'
PRINT '  }'
PRINT ''

GO
