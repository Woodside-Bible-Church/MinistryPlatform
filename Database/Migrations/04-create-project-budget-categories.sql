-- =============================================
-- Create Project_Budget_Categories Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Tracks budget allocation by category (Venue, Transportation, etc.)
-- =============================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('dbo.Project_Budget_Categories', 'U') IS NULL
BEGIN
    PRINT 'Creating Project_Budget_Categories table...'

    CREATE TABLE dbo.Project_Budget_Categories (
        Project_Budget_Category_ID INT PRIMARY KEY IDENTITY(1,1),
        Project_ID INT NOT NULL,
        Project_Category_Type_ID INT NOT NULL,
        Budgeted_Amount MONEY NOT NULL DEFAULT 0,
        Sort_Order INT NULL,

        CONSTRAINT FK_ProjectBudgetCategories_Project
            FOREIGN KEY (Project_ID) REFERENCES dbo.Projects(Project_ID),
        CONSTRAINT FK_ProjectBudgetCategories_CategoryType
            FOREIGN KEY (Project_Category_Type_ID) REFERENCES dbo.Project_Category_Types(Project_Category_Type_ID)
    );

    -- Create index for performance
    CREATE INDEX IX_ProjectBudgetCategories_ProjectID ON dbo.Project_Budget_Categories(Project_ID);

    PRINT 'Project_Budget_Categories table created.'
END
ELSE
    PRINT 'Project_Budget_Categories table already exists, skipping.'

GO
