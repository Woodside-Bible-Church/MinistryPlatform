-- =============================================
-- Create Project_Budget_Expense_Line_Items Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Individual expense items within budget categories
-- =============================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('dbo.Project_Budget_Expense_Line_Items', 'U') IS NULL
BEGIN
    PRINT 'Creating Project_Budget_Expense_Line_Items table...'

    CREATE TABLE dbo.Project_Budget_Expense_Line_Items (
        Project_Budget_Expense_Line_Item_ID INT PRIMARY KEY IDENTITY(1,1),
        Project_Budget_Category_ID INT NOT NULL,
        Item_Name NVARCHAR(100) NOT NULL,
        Item_Description NVARCHAR(500) NULL,
        Vendor_Name NVARCHAR(100) NULL,
        Estimated_Amount MONEY NOT NULL DEFAULT 0,
        Status NVARCHAR(50) NULL,
        Sort_Order INT NULL,

        CONSTRAINT FK_ProjectBudgetExpenseLineItems_Category
            FOREIGN KEY (Project_Budget_Category_ID)
            REFERENCES dbo.Project_Budget_Categories(Project_Budget_Category_ID)
            ON DELETE CASCADE
    );

    -- Create index for performance
    CREATE INDEX IX_ProjectBudgetExpenseLineItems_CategoryID
        ON dbo.Project_Budget_Expense_Line_Items(Project_Budget_Category_ID);

    PRINT 'Project_Budget_Expense_Line_Items table created.'
END
ELSE
    PRINT 'Project_Budget_Expense_Line_Items table already exists, skipping.'

GO
