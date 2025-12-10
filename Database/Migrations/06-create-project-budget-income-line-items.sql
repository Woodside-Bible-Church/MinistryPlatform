-- =============================================
-- Create Project_Budget_Income_Line_Items Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Expected income from non-registration sources
-- =============================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('dbo.Project_Budget_Income_Line_Items', 'U') IS NULL
BEGIN
    PRINT 'Creating Project_Budget_Income_Line_Items table...'

    CREATE TABLE dbo.Project_Budget_Income_Line_Items (
        Project_Budget_Income_Line_Item_ID INT PRIMARY KEY IDENTITY(1,1),
        Project_ID INT NOT NULL,
        Income_Source_Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500) NULL,
        Expected_Amount MONEY NOT NULL DEFAULT 0,
        Sort_Order INT NULL,

        CONSTRAINT FK_ProjectBudgetIncomeLineItems_Project
            FOREIGN KEY (Project_ID)
            REFERENCES dbo.Projects(Project_ID)
            ON DELETE CASCADE
    );

    -- Create index for performance
    CREATE INDEX IX_ProjectBudgetIncomeLineItems_ProjectID
        ON dbo.Project_Budget_Income_Line_Items(Project_ID);

    PRINT 'Project_Budget_Income_Line_Items table created.'
END
ELSE
    PRINT 'Project_Budget_Income_Line_Items table already exists, skipping.'

GO
