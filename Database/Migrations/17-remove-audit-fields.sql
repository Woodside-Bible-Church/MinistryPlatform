-- =============================================
-- Remove Audit Fields from Project_Budget_Transactions
-- Date: 2025-12-09
-- Description: Remove Created_By_User_ID, Created_Date, Modified_By_User_ID, Modified_Date
--              since MinistryPlatform has built-in audit logging
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Removing audit fields from Project_Budget_Transactions...'
PRINT ''

-- Get the Page_ID for Project_Budget_Transactions
DECLARE @PageID INT;
SELECT @PageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Transactions';

-- 1. Remove fields from dp_Page_Fields first
PRINT 'Removing audit fields from dp_Page_Fields...';

DELETE FROM dp_Page_Fields
WHERE Page_ID = @PageID
    AND Field_Name IN ('Created_By_User_ID', 'Created_Date', 'Modified_By_User_ID', 'Modified_Date');

PRINT '  Removed 4 page fields';

-- 2. Drop the columns from the table
PRINT '';
PRINT 'Dropping audit columns from Project_Budget_Transactions table...';

-- Drop FK constraints first if they exist
DECLARE @ConstraintName NVARCHAR(255);

-- Check for Created_By_User_ID FK
SELECT @ConstraintName = fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id = OBJECT_ID('Project_Budget_Transactions')
    AND COL_NAME(fk.parent_object_id, fkc.parent_column_id) = 'Created_By_User_ID';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.Project_Budget_Transactions DROP CONSTRAINT ' + @ConstraintName);
    PRINT '  Dropped FK constraint: ' + @ConstraintName;
END

-- Check for Modified_By_User_ID FK
SET @ConstraintName = NULL;
SELECT @ConstraintName = fk.name
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
WHERE fk.parent_object_id = OBJECT_ID('Project_Budget_Transactions')
    AND COL_NAME(fk.parent_object_id, fkc.parent_column_id) = 'Modified_By_User_ID';

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE dbo.Project_Budget_Transactions DROP CONSTRAINT ' + @ConstraintName);
    PRINT '  Dropped FK constraint: ' + @ConstraintName;
END

-- Drop default constraints
DECLARE @DefaultConstraintName NVARCHAR(255);

DECLARE constraint_cursor CURSOR FOR
SELECT dc.name
FROM sys.default_constraints dc
INNER JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
WHERE dc.parent_object_id = OBJECT_ID('Project_Budget_Transactions')
    AND c.name IN ('Created_By_User_ID', 'Created_Date', 'Modified_By_User_ID', 'Modified_Date');

OPEN constraint_cursor;
FETCH NEXT FROM constraint_cursor INTO @DefaultConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
    EXEC('ALTER TABLE dbo.Project_Budget_Transactions DROP CONSTRAINT ' + @DefaultConstraintName);
    PRINT '  Dropped default constraint: ' + @DefaultConstraintName;
    FETCH NEXT FROM constraint_cursor INTO @DefaultConstraintName;
END

CLOSE constraint_cursor;
DEALLOCATE constraint_cursor;

-- Drop the columns
ALTER TABLE dbo.Project_Budget_Transactions DROP COLUMN Created_By_User_ID;
ALTER TABLE dbo.Project_Budget_Transactions DROP COLUMN Created_Date;
ALTER TABLE dbo.Project_Budget_Transactions DROP COLUMN Modified_By_User_ID;
ALTER TABLE dbo.Project_Budget_Transactions DROP COLUMN Modified_Date;

PRINT '  Dropped 4 audit columns from table';

PRINT '';
PRINT '================================================';
PRINT 'Audit fields removed successfully!';
PRINT 'MinistryPlatform will use built-in audit logging.';
PRINT '================================================';

COMMIT TRANSACTION;
PRINT 'Transaction committed successfully!';

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back.';
    PRINT ERROR_MESSAGE();
    THROW;
END CATCH

GO
