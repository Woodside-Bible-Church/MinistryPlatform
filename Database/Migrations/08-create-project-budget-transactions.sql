-- =============================================
-- Create Project_Budget_Transactions Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Manual expense and income transactions
--              (Registration income is calculated dynamically)
-- =============================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('dbo.Project_Budget_Transactions', 'U') IS NULL
BEGIN
    PRINT 'Creating Project_Budget_Transactions table...'

    CREATE TABLE dbo.Project_Budget_Transactions (
        Project_Budget_Transaction_ID INT PRIMARY KEY IDENTITY(1,1),
        Project_ID INT NOT NULL,
        Transaction_Date DATETIME NOT NULL,
        Transaction_Type NVARCHAR(20) NOT NULL,

        -- Optional links for categorization
        Project_Budget_Category_ID INT NULL,
        Project_Budget_Expense_Line_Item_ID INT NULL,
        Project_Budget_Income_Line_Item_ID INT NULL,

        -- Transaction details
        Payee_Name NVARCHAR(100) NULL,
        Description NVARCHAR(500) NULL,
        Amount MONEY NOT NULL,
        Payment_Method_ID INT NULL,
        Payment_Reference NVARCHAR(100) NULL,
        Notes NVARCHAR(1000) NULL,

        -- Audit fields
        Created_By_User_ID INT NOT NULL,
        Created_Date DATETIME NOT NULL DEFAULT GETDATE(),
        Modified_By_User_ID INT NULL,
        Modified_Date DATETIME NULL,

        CONSTRAINT FK_ProjectBudgetTransactions_Project
            FOREIGN KEY (Project_ID)
            REFERENCES dbo.Projects(Project_ID),
        CONSTRAINT FK_ProjectBudgetTransactions_Category
            FOREIGN KEY (Project_Budget_Category_ID)
            REFERENCES dbo.Project_Budget_Categories(Project_Budget_Category_ID),
        CONSTRAINT FK_ProjectBudgetTransactions_ExpenseLineItem
            FOREIGN KEY (Project_Budget_Expense_Line_Item_ID)
            REFERENCES dbo.Project_Budget_Expense_Line_Items(Project_Budget_Expense_Line_Item_ID),
        CONSTRAINT FK_ProjectBudgetTransactions_IncomeLineItem
            FOREIGN KEY (Project_Budget_Income_Line_Item_ID)
            REFERENCES dbo.Project_Budget_Income_Line_Items(Project_Budget_Income_Line_Item_ID),
        CONSTRAINT FK_ProjectBudgetTransactions_PaymentMethod
            FOREIGN KEY (Payment_Method_ID)
            REFERENCES dbo.Project_Budget_Payment_Methods(Payment_Method_ID)
    );

    -- Create indexes for performance
    CREATE INDEX IX_ProjectBudgetTransactions_ProjectID
        ON dbo.Project_Budget_Transactions(Project_ID);
    CREATE INDEX IX_ProjectBudgetTransactions_TransactionDate
        ON dbo.Project_Budget_Transactions(Transaction_Date);
    CREATE INDEX IX_ProjectBudgetTransactions_Type
        ON dbo.Project_Budget_Transactions(Transaction_Type);

    PRINT 'Project_Budget_Transactions table created.'
END
ELSE
    PRINT 'Project_Budget_Transactions table already exists, skipping.'

GO
