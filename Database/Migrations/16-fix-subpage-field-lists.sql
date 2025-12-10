-- =============================================
-- Fix Default_Field_List for Budget Sub Pages
-- Date: 2025-12-09
-- Description: Fix FK field references to use correct MinistryPlatform syntax
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Fixing Default_Field_List for budget sub pages...'
PRINT ''

-- Get the Projects page ID
DECLARE @ProjectsPageID INT;
SELECT @ProjectsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Projects';

-- Get the target page IDs
DECLARE @CategoriesPageID INT, @ExpenseLineItemsPageID INT, @IncomeLineItemsPageID INT, @TransactionsPageID INT;
SELECT @CategoriesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories';
SELECT @ExpenseLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Expense_Line_Items';
SELECT @IncomeLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Income_Line_Items';
SELECT @TransactionsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Transactions';

-- Fix Budget Categories sub page
-- Use Project_Category_Type_ID.Field_Name syntax to reference FK relationship
UPDATE dp_Sub_Pages
SET Default_Field_List = 'Project_Budget_Categories.Project_Budget_Category_ID, Project_Budget_Categories.Project_Category_Type_ID_Table.Project_Category_Type, Project_Budget_Categories.Budgeted_Amount'
WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @CategoriesPageID;

PRINT '  Fixed Budget Categories field list';

-- Remove Expense Line Items sub page from Projects (indirect relationship)
-- It will be accessible as a sub page of Budget Categories instead
DELETE FROM dp_Role_Sub_Pages
WHERE Sub_Page_ID IN (
    SELECT Sub_Page_ID FROM dp_Sub_Pages
    WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @ExpenseLineItemsPageID
);

DELETE FROM dp_Sub_Pages
WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @ExpenseLineItemsPageID;

PRINT '  Removed Expense Line Items sub page (indirect relationship)';

-- Fix Income Line Items sub page
UPDATE dp_Sub_Pages
SET Default_Field_List = 'Project_Budget_Income_Line_Items.Income_Source_Name, Project_Budget_Income_Line_Items.Expected_Amount'
WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @IncomeLineItemsPageID;

PRINT '  Fixed Income Line Items field list';

-- Fix Transactions sub page
UPDATE dp_Sub_Pages
SET Default_Field_List = 'Project_Budget_Transactions.Transaction_Date, Project_Budget_Transactions.Transaction_Type, Project_Budget_Transactions.Payee_Name, Project_Budget_Transactions.Amount'
WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @TransactionsPageID;

PRINT '  Fixed Budget Transactions field list';

-- =============================================
-- Add Expense Line Items as sub page of Budget Categories
-- =============================================

PRINT '';
PRINT 'Adding Expense Line Items as sub page of Budget Categories...';

-- Add sub page relationship
IF NOT EXISTS (SELECT 1 FROM dp_Sub_Pages WHERE Parent_Page_ID = @CategoriesPageID AND Target_Page_ID = @ExpenseLineItemsPageID)
    INSERT INTO dp_Sub_Pages (
        Display_Name, View_Order, Parent_Record_Information, Parent_Page_ID, Parent_Filter_Key,
        Target_Page_Information, Target_Page_ID, Target_Filter_Key, Default_Field_List
    )
    VALUES (
        'Expense Line Items', 1, 0, @CategoriesPageID, 'Project_Budget_Category_ID',
        1, @ExpenseLineItemsPageID, 'Project_Budget_Category_ID',
        'Project_Budget_Expense_Line_Items.Item_Name, Project_Budget_Expense_Line_Items.Vendor_Name, Project_Budget_Expense_Line_Items.Estimated_Amount, Project_Budget_Expense_Line_Items.Status'
    );

-- Grant Administrator role access to this new sub page
DECLARE @ExpenseLineItemsCategorySubPageID INT;
SELECT @ExpenseLineItemsCategorySubPageID = Sub_Page_ID
FROM dp_Sub_Pages
WHERE Parent_Page_ID = @CategoriesPageID AND Target_Page_ID = @ExpenseLineItemsPageID;

IF @ExpenseLineItemsCategorySubPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Sub_Pages WHERE Role_ID = 2 AND Sub_Page_ID = @ExpenseLineItemsCategorySubPageID)
    INSERT INTO dp_Role_Sub_Pages (Role_ID, Sub_Page_ID, Access_Level)
    VALUES (2, @ExpenseLineItemsCategorySubPageID, 3);

PRINT '  Added Expense Line Items as sub page of Budget Categories';

PRINT '';
PRINT '================================================';
PRINT 'Sub page field lists fixed successfully!';
PRINT 'Projects now has 3 budget tabs:';
PRINT '  - Budget Categories (with Expense Line Items as nested tab)';
PRINT '  - Income Line Items';
PRINT '  - Budget Transactions';
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
