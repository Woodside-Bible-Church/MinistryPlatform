-- =============================================
-- Add Budget Sub Pages to Administrator Role
-- Date: 2025-12-09
-- Description: Grant Administrator role access to budget sub pages (tabs)
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Adding budget sub pages to Administrator role...'
PRINT ''

DECLARE @AdminRoleID INT = 2; -- Administrator role

-- Get Sub Page IDs
DECLARE @BudgetCategoriesSubPageID INT, @ExpenseLineItemsSubPageID INT;
DECLARE @IncomeLineItemsSubPageID INT, @TransactionsSubPageID INT;

-- Get the Projects page ID
DECLARE @ProjectsPageID INT;
SELECT @ProjectsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Projects';

-- Get the target page IDs
DECLARE @CategoriesPageID INT, @ExpenseLineItemsPageID INT, @IncomeLineItemsPageID INT, @TransactionsPageID INT;
SELECT @CategoriesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories';
SELECT @ExpenseLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Expense_Line_Items';
SELECT @IncomeLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Income_Line_Items';
SELECT @TransactionsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Transactions';

-- Get Sub Page IDs
SELECT @BudgetCategoriesSubPageID = Sub_Page_ID FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @CategoriesPageID;
SELECT @ExpenseLineItemsSubPageID = Sub_Page_ID FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @ExpenseLineItemsPageID;
SELECT @IncomeLineItemsSubPageID = Sub_Page_ID FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @IncomeLineItemsPageID;
SELECT @TransactionsSubPageID = Sub_Page_ID FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @TransactionsPageID;

-- Add to dp_Role_Sub_Pages (grants role access to sub pages)
-- Access_Level: 1=View, 2=Edit, 3=Full

IF @BudgetCategoriesSubPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Sub_Pages WHERE Role_ID = @AdminRoleID AND Sub_Page_ID = @BudgetCategoriesSubPageID)
    INSERT INTO dp_Role_Sub_Pages (Role_ID, Sub_Page_ID, Access_Level)
    VALUES (@AdminRoleID, @BudgetCategoriesSubPageID, 3);

IF @ExpenseLineItemsSubPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Sub_Pages WHERE Role_ID = @AdminRoleID AND Sub_Page_ID = @ExpenseLineItemsSubPageID)
    INSERT INTO dp_Role_Sub_Pages (Role_ID, Sub_Page_ID, Access_Level)
    VALUES (@AdminRoleID, @ExpenseLineItemsSubPageID, 3);

IF @IncomeLineItemsSubPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Sub_Pages WHERE Role_ID = @AdminRoleID AND Sub_Page_ID = @IncomeLineItemsSubPageID)
    INSERT INTO dp_Role_Sub_Pages (Role_ID, Sub_Page_ID, Access_Level)
    VALUES (@AdminRoleID, @IncomeLineItemsSubPageID, 3);

IF @TransactionsSubPageID IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dp_Role_Sub_Pages WHERE Role_ID = @AdminRoleID AND Sub_Page_ID = @TransactionsSubPageID)
    INSERT INTO dp_Role_Sub_Pages (Role_ID, Sub_Page_ID, Access_Level)
    VALUES (@AdminRoleID, @TransactionsSubPageID, 3);

PRINT '  Granted Administrator role full access to 4 budget sub pages';

PRINT '';
PRINT '================================================';
PRINT 'Budget sub pages added to Administrator role!';
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
