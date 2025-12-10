-- =============================================
-- Migration 19: Add Additional Project Category Types
-- Date: 2025-12-09
-- Description: Add Volunteer Appreciation, Communications, and Miscellaneous category types
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Adding new Project Category Types...';
PRINT '';

-- Check if category types already exist and insert if not
IF NOT EXISTS (SELECT 1 FROM Project_Category_Types WHERE Project_Category_Type = 'Volunteer Appreciation')
BEGIN
    INSERT INTO Project_Category_Types (Project_Category_Type, Is_Revenue, Discontinued, Sort_Order)
    VALUES ('Volunteer Appreciation', 0, 0, 50);
    PRINT '  Added Volunteer Appreciation category type';
END
ELSE
BEGIN
    PRINT '  Volunteer Appreciation category type already exists';
END

IF NOT EXISTS (SELECT 1 FROM Project_Category_Types WHERE Project_Category_Type = 'Communications')
BEGIN
    INSERT INTO Project_Category_Types (Project_Category_Type, Is_Revenue, Discontinued, Sort_Order)
    VALUES ('Communications', 0, 0, 60);
    PRINT '  Added Communications category type';
END
ELSE
BEGIN
    PRINT '  Communications category type already exists';
END

IF NOT EXISTS (SELECT 1 FROM Project_Category_Types WHERE Project_Category_Type = 'Miscellaneous')
BEGIN
    INSERT INTO Project_Category_Types (Project_Category_Type, Is_Revenue, Discontinued, Sort_Order)
    VALUES ('Miscellaneous', 0, 0, 70);
    PRINT '  Added Miscellaneous category type';
END
ELSE
BEGIN
    PRINT '  Miscellaneous category type already exists';
END

PRINT '';
PRINT '================================================';
PRINT 'New category types added successfully!';
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
