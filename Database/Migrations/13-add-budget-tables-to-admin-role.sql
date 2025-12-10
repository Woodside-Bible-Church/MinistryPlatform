-- =============================================
-- Add Budget Tables to Administrator Role
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Grant Administrator role full access to all budget tables for API access
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Adding budget table permissions to Administrator role (Role_ID = 2)...'

-- Get the Page_IDs for our budget tables
DECLARE @StatusesPageID INT, @PaymentMethodsPageID INT, @CategoriesPageID INT,
        @ExpenseLineItemsPageID INT, @IncomeLineItemsPageID INT, @TransactionsPageID INT;

SELECT @StatusesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Statuses';
SELECT @PaymentMethodsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Payment_Methods';
SELECT @CategoriesPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Categories';
SELECT @ExpenseLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Expense_Line_Items';
SELECT @IncomeLineItemsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Income_Line_Items';
SELECT @TransactionsPageID = Page_ID FROM dp_Pages WHERE Table_Name = 'Project_Budget_Transactions';

-- Project_Budget_Statuses
IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @StatusesPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @StatusesPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Added Project_Budget_Statuses to Administrator role.';
END
ELSE
    PRINT 'Project_Budget_Statuses already has Administrator role permissions.';

-- Project_Budget_Payment_Methods
IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @PaymentMethodsPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @PaymentMethodsPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Added Project_Budget_Payment_Methods to Administrator role.';
END
ELSE
    PRINT 'Project_Budget_Payment_Methods already has Administrator role permissions.';

-- Project_Budget_Categories
IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @CategoriesPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @CategoriesPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Added Project_Budget_Categories to Administrator role.';
END
ELSE
    PRINT 'Project_Budget_Categories already has Administrator role permissions.';

-- Project_Budget_Expense_Line_Items
IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @ExpenseLineItemsPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @ExpenseLineItemsPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Added Project_Budget_Expense_Line_Items to Administrator role.';
END
ELSE
    PRINT 'Project_Budget_Expense_Line_Items already has Administrator role permissions.';

-- Project_Budget_Income_Line_Items
IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @IncomeLineItemsPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @IncomeLineItemsPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Added Project_Budget_Income_Line_Items to Administrator role.';
END
ELSE
    PRINT 'Project_Budget_Income_Line_Items already has Administrator role permissions.';

-- Project_Budget_Transactions
IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @TransactionsPageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES (2, @TransactionsPageID, 3, 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Added Project_Budget_Transactions to Administrator role.';
END
ELSE
    PRINT 'Project_Budget_Transactions already has Administrator role permissions.';

PRINT 'Administrator role permissions for budget tables complete!';
GO
