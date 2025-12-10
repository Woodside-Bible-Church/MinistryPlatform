-- =============================================
-- Fix Budget Categories Default_Field_List
-- Date: 2025-12-09
-- Description: Use correct ThinkSQL notation for FK field traversal
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Fixing Budget Categories sub page field list...'
PRINT ''

-- Get the Projects page ID
DECLARE @ProjectsPageID INT;
SELECT @ProjectsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Projects';

-- Get Budget Categories page ID
DECLARE @CategoriesPageID INT;
SELECT @CategoriesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories';

-- Try using just the simple fields without FK traversal for now
UPDATE dp_Sub_Pages
SET Default_Field_List = 'Project_Budget_Categories.Budgeted_Amount'
WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @CategoriesPageID;

PRINT '  Updated Budget Categories sub page to use simple field list';
PRINT '  Note: Category Type will need to be configured via Page Views in MP UI';

PRINT '';
PRINT '================================================';
PRINT 'Sub page field list updated successfully!';
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
