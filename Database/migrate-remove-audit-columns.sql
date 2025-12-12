-- =====================================================
-- Migration: Remove audit columns from Amenities tables
-- MinistryPlatform handles auditing through dp_Audit_Log table
-- Date: 2025-12-12
-- =====================================================

USE MinistryPlatform;
GO

PRINT 'Removing audit columns from Amenities tables...';

-- =====================================================
-- Drop Default Constraints First
-- =====================================================
-- Amenities table constraints
DECLARE @ConstraintName NVARCHAR(200);

SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('Amenities') AND c.name = '_Approved';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[Amenities] DROP CONSTRAINT [' + @ConstraintName + ']');
    PRINT 'Dropped constraint on Amenities._Approved';
END

SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('Amenities') AND c.name = '_Audit_Timestamp';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[Amenities] DROP CONSTRAINT [' + @ConstraintName + ']');
    PRINT 'Dropped constraint on Amenities._Audit_Timestamp';
END

-- Event_Amenities table constraints
SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('Event_Amenities') AND c.name = '_Approved';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[Event_Amenities] DROP CONSTRAINT [' + @ConstraintName + ']');
    PRINT 'Dropped constraint on Event_Amenities._Approved';
END

SELECT @ConstraintName = dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE c.object_id = OBJECT_ID('Event_Amenities') AND c.name = '_Audit_Timestamp';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE [dbo].[Event_Amenities] DROP CONSTRAINT [' + @ConstraintName + ']');
    PRINT 'Dropped constraint on Event_Amenities._Audit_Timestamp';
END

-- =====================================================
-- Drop Columns from Amenities Table
-- =====================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Amenities') AND name = '_Approved')
BEGIN
    ALTER TABLE [dbo].[Amenities] DROP COLUMN [_Approved];
    PRINT 'Removed _Approved from Amenities';
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Amenities') AND name = '_Audit_User_ID')
BEGIN
    ALTER TABLE [dbo].[Amenities] DROP COLUMN [_Audit_User_ID];
    PRINT 'Removed _Audit_User_ID from Amenities';
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Amenities') AND name = '_Audit_Timestamp')
BEGIN
    ALTER TABLE [dbo].[Amenities] DROP COLUMN [_Audit_Timestamp];
    PRINT 'Removed _Audit_Timestamp from Amenities';
END

-- =====================================================
-- Drop Columns from Event_Amenities Table
-- =====================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Event_Amenities') AND name = '_Approved')
BEGIN
    ALTER TABLE [dbo].[Event_Amenities] DROP COLUMN [_Approved];
    PRINT 'Removed _Approved from Event_Amenities';
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Event_Amenities') AND name = '_Audit_User_ID')
BEGIN
    ALTER TABLE [dbo].[Event_Amenities] DROP COLUMN [_Audit_User_ID];
    PRINT 'Removed _Audit_User_ID from Event_Amenities';
END

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Event_Amenities') AND name = '_Audit_Timestamp')
BEGIN
    ALTER TABLE [dbo].[Event_Amenities] DROP COLUMN [_Audit_Timestamp];
    PRINT 'Removed _Audit_Timestamp from Event_Amenities';
END

PRINT '';
PRINT 'Migration completed successfully!';
GO
