-- =============================================
-- Organize Budget Pages under Projects Section
-- Date: 2025-12-09
-- Description:
--   1. Add all 6 budget pages to the Projects Page_Section (folder)
--   2. Add budget tabs to the Projects detail page via Sub Pages
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Organizing budget pages under Projects section...'
PRINT ''

-- =============================================
-- 1. Add Budget Pages to Projects Page_Section
-- =============================================

DECLARE @ProjectsSectionID INT = 73; -- Projects Page_Section
DECLARE @UserID INT;
SELECT TOP 1 @UserID = User_ID FROM dp_Users WHERE User_Name = 'administrator';

-- Get Page IDs for budget tables
DECLARE @StatusesPageID INT, @PaymentMethodsPageID INT, @CategoriesPageID INT;
DECLARE @ExpenseLineItemsPageID INT, @IncomeLineItemsPageID INT, @TransactionsPageID INT;

SELECT @StatusesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Statuses';
SELECT @PaymentMethodsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Payment_Methods';
SELECT @CategoriesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories';
SELECT @ExpenseLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Expense_Line_Items';
SELECT @IncomeLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Income_Line_Items';
SELECT @TransactionsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Transactions';

PRINT 'Adding budget pages to Projects Page_Section...';

-- Add to Page_Section_Pages (this puts them in the folder)
IF NOT EXISTS (SELECT 1 FROM dp_Page_Section_Pages WHERE Page_ID = @StatusesPageID AND Page_Section_ID = @ProjectsSectionID)
    INSERT INTO dp_Page_Section_Pages (Page_ID, Page_Section_ID, User_ID) VALUES (@StatusesPageID, @ProjectsSectionID, @UserID);

IF NOT EXISTS (SELECT 1 FROM dp_Page_Section_Pages WHERE Page_ID = @PaymentMethodsPageID AND Page_Section_ID = @ProjectsSectionID)
    INSERT INTO dp_Page_Section_Pages (Page_ID, Page_Section_ID, User_ID) VALUES (@PaymentMethodsPageID, @ProjectsSectionID, @UserID);

IF NOT EXISTS (SELECT 1 FROM dp_Page_Section_Pages WHERE Page_ID = @CategoriesPageID AND Page_Section_ID = @ProjectsSectionID)
    INSERT INTO dp_Page_Section_Pages (Page_ID, Page_Section_ID, User_ID) VALUES (@CategoriesPageID, @ProjectsSectionID, @UserID);

IF NOT EXISTS (SELECT 1 FROM dp_Page_Section_Pages WHERE Page_ID = @ExpenseLineItemsPageID AND Page_Section_ID = @ProjectsSectionID)
    INSERT INTO dp_Page_Section_Pages (Page_ID, Page_Section_ID, User_ID) VALUES (@ExpenseLineItemsPageID, @ProjectsSectionID, @UserID);

IF NOT EXISTS (SELECT 1 FROM dp_Page_Section_Pages WHERE Page_ID = @IncomeLineItemsPageID AND Page_Section_ID = @ProjectsSectionID)
    INSERT INTO dp_Page_Section_Pages (Page_ID, Page_Section_ID, User_ID) VALUES (@IncomeLineItemsPageID, @ProjectsSectionID, @UserID);

IF NOT EXISTS (SELECT 1 FROM dp_Page_Section_Pages WHERE Page_ID = @TransactionsPageID AND Page_Section_ID = @ProjectsSectionID)
    INSERT INTO dp_Page_Section_Pages (Page_ID, Page_Section_ID, User_ID) VALUES (@TransactionsPageID, @ProjectsSectionID, @UserID);

PRINT '  Added 6 budget pages to Projects section';

-- =============================================
-- 2. Add Sub Pages (Tabs) to Projects Page
-- =============================================

DECLARE @ProjectsPageID INT;
SELECT @ProjectsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Projects';

PRINT '';
PRINT 'Adding budget tabs to Projects detail page...';

-- Note: dp_Sub_Pages creates tabs on the detail view
-- Parent_Page_ID = the parent page (Projects)
-- Target_Page_ID = the related page (Budget tables)
-- Parent_Filter_Key = field on parent to filter by
-- Target_Filter_Key = field on target to filter by

-- Budget Categories tab
IF NOT EXISTS (SELECT 1 FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @CategoriesPageID)
    INSERT INTO dp_Sub_Pages (
        Display_Name, View_Order, Parent_Record_Information, Parent_Page_ID, Parent_Filter_Key,
        Target_Page_Information, Target_Page_ID, Target_Filter_Key, Default_Field_List
    )
    VALUES (
        'Budget Categories', 10, 0, @ProjectsPageID, 'Project_ID',
        1, @CategoriesPageID, 'Project_ID',
        'Project_Budget_Categories.Project_Budget_Category_ID, Project_Category_Types.Project_Category_Type, Project_Budget_Categories.Budgeted_Amount'
    );

-- Expense Line Items tab
IF NOT EXISTS (SELECT 1 FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @ExpenseLineItemsPageID)
    INSERT INTO dp_Sub_Pages (
        Display_Name, View_Order, Parent_Record_Information, Parent_Page_ID, Parent_Filter_Key,
        Target_Page_Information, Target_Page_ID, Target_Filter_Key, Default_Field_List
    )
    VALUES (
        'Expense Line Items', 11, 0, @ProjectsPageID, 'Project_ID',
        1, @ExpenseLineItemsPageID, 'Project_Budget_Category_ID.Project_ID',
        'Project_Budget_Expense_Line_Items.Item_Name, Project_Budget_Expense_Line_Items.Vendor_Name, Project_Budget_Expense_Line_Items.Estimated_Amount, Project_Budget_Expense_Line_Items.Status'
    );

-- Income Line Items tab
IF NOT EXISTS (SELECT 1 FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @IncomeLineItemsPageID)
    INSERT INTO dp_Sub_Pages (
        Display_Name, View_Order, Parent_Record_Information, Parent_Page_ID, Parent_Filter_Key,
        Target_Page_Information, Target_Page_ID, Target_Filter_Key, Default_Field_List
    )
    VALUES (
        'Income Line Items', 12, 0, @ProjectsPageID, 'Project_ID',
        1, @IncomeLineItemsPageID, 'Project_ID',
        'Project_Budget_Income_Line_Items.Income_Source_Name, Project_Budget_Income_Line_Items.Expected_Amount'
    );

-- Transactions tab
IF NOT EXISTS (SELECT 1 FROM dp_Sub_Pages WHERE Parent_Page_ID = @ProjectsPageID AND Target_Page_ID = @TransactionsPageID)
    INSERT INTO dp_Sub_Pages (
        Display_Name, View_Order, Parent_Record_Information, Parent_Page_ID, Parent_Filter_Key,
        Target_Page_Information, Target_Page_ID, Target_Filter_Key, Default_Field_List
    )
    VALUES (
        'Budget Transactions', 13, 0, @ProjectsPageID, 'Project_ID',
        1, @TransactionsPageID, 'Project_ID',
        'Project_Budget_Transactions.Transaction_Date, Project_Budget_Transactions.Transaction_Type, Project_Budget_Transactions.Payee_Name, Project_Budget_Transactions.Amount'
    );

PRINT '  Added 4 budget tabs to Projects page';

PRINT '';
PRINT '================================================';
PRINT 'Budget pages organized successfully!';
PRINT '  - 6 budget pages added to Projects folder';
PRINT '  - 4 budget tabs added to Projects detail page';
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
