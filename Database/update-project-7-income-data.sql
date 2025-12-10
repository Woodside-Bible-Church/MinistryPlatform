-- =============================================
-- Update Project 7 Income Data to Match Real Structure
-- Date: 2025-12-09
-- Description: Update Expected_Registration_Revenue and add realistic Income Line Items
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Updating Project 7 income data to match real structure...';
PRINT '';

-- First, delete existing income line items
PRINT 'Deleting existing income line items...';
DELETE FROM Project_Budget_Income_Line_Items WHERE Project_ID = 7;
PRINT '  Deleted existing income line items';

PRINT '';
PRINT 'Updating Expected_Registration_Revenue...';

-- Update Expected_Registration_Revenue to match Admissions total
UPDATE Projects
SET Expected_Registration_Revenue = 226689.00  -- Total from Admissions section
WHERE Project_ID = 7;

PRINT '  Updated Expected_Registration_Revenue to $226,689.00';

PRINT '';
PRINT 'Creating income line items...';

-- Create Income Line Items for non-registration income
INSERT INTO Project_Budget_Income_Line_Items (
    Project_ID, Income_Source_Name, Description, Expected_Amount, Sort_Order, Domain_ID
)
VALUES
    -- Ads in program
    (7, 'Merch Weekend #1', 'Program advertising revenue - Weekend 1', 2000.00, 1, 1),
    (7, 'Merch Weekend #2', 'Program advertising revenue - Weekend 2', 2000.00, 2, 1),
    (7, 'Merch Weekend #3', 'Program advertising revenue - Weekend 3', 2000.00, 3, 1),

    -- Band/Production
    (7, 'Band Week 1', 'Band/Production contribution - Week 1', 250.00, 4, 1),
    (7, 'Band Week 2', 'Band/Production contribution - Week 2', 250.00, 5, 1),
    (7, 'Band Week 3', 'Band/Production contribution - Week 3', 250.00, 6, 1);

PRINT '  Added 6 income line items';
PRINT '    - Ads in program: $6,000.00';
PRINT '    - Band/Production: $750.00';

PRINT '';
PRINT '================================================';
PRINT 'Income data updated successfully!';
PRINT 'Expected Income Breakdown:';
PRINT '  - Admissions (Registration Revenue): $226,689.00';
PRINT '  - Ads in program: $6,000.00';
PRINT '  - Band/Production: $750.00';
PRINT '  TOTAL EXPECTED INCOME: $233,439.00';
PRINT '';
PRINT 'Total Expenses Budget: $263,400.00';
PRINT 'Total Expenses Actual: $204,608.00';
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
