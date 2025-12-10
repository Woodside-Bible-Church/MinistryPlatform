-- =============================================
-- Create Project_Budget_Payment_Methods Table
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Lookup table for payment methods
-- =============================================

USE [MinistryPlatform]
GO

IF OBJECT_ID('dbo.Project_Budget_Payment_Methods', 'U') IS NULL
BEGIN
    PRINT 'Creating Project_Budget_Payment_Methods table...'

    CREATE TABLE dbo.Project_Budget_Payment_Methods (
        Payment_Method_ID INT PRIMARY KEY IDENTITY(1,1),
        Payment_Method_Name NVARCHAR(50) NOT NULL,
        Sort_Order INT NULL
    );

    PRINT 'Project_Budget_Payment_Methods table created.'

    -- Seed common payment methods
    PRINT 'Seeding payment methods...'
    INSERT INTO dbo.Project_Budget_Payment_Methods (Payment_Method_Name, Sort_Order) VALUES
    ('Check', 1),
    ('Credit Card', 2),
    ('Debit Card', 3),
    ('ACH/Bank Transfer', 4),
    ('Cash', 5),
    ('Wire Transfer', 6),
    ('Other', 99);

    PRINT 'Payment methods seeded.'
END
ELSE
    PRINT 'Project_Budget_Payment_Methods table already exists, skipping.'

GO
