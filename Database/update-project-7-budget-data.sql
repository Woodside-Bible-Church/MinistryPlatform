-- =============================================
-- Update Project 7 Budget Data to Match Real Structure
-- Date: 2025-12-09
-- Description: Replace simple test data with realistic Winter Retreat budget structure
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Updating Project 7 budget data to match real structure...'
PRINT ''

-- First, delete existing test data
PRINT 'Deleting existing test data...';
DELETE FROM Project_Budget_Transactions WHERE Project_ID = 7;
DELETE FROM Project_Budget_Expense_Line_Items WHERE Project_Budget_Category_ID IN (
    SELECT Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7
);
DELETE FROM Project_Budget_Income_Line_Items WHERE Project_ID = 7;
DELETE FROM Project_Budget_Categories WHERE Project_ID = 7;

PRINT '  Deleted existing budget data';

-- Get Category Type IDs
DECLARE @OperationalCatID INT, @ActivityCatID INT, @SessionCatID INT, @FoodCatID INT;
SELECT @OperationalCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Operational Costs';
SELECT @ActivityCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Activity Costs';
SELECT @SessionCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Session Costs';
SELECT @FoodCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Food/Refreshments/Supplies';

PRINT '';
PRINT 'Creating budget categories...';

-- Create Budget Categories with actual totals
INSERT INTO Project_Budget_Categories (Project_ID, Project_Category_Type_ID, Budgeted_Amount, Sort_Order, Domain_ID)
VALUES
    (7, @OperationalCatID, 203600.00, 1, 1),  -- Operational Costs
    (7, @ActivityCatID, 3600.00, 2, 1),       -- Activities
    (7, @FoodCatID, 5700.00, 3, 1),           -- Retreat Meal Supplies/Food
    (7, @SessionCatID, 11200.00, 4, 1);       -- Session Costs

-- Note: Volunteer Appreciation, Communications, and Miscellaneous would need new category types
-- For now, we'll add them to Session Costs as a workaround

PRINT '  Added 4 budget categories';

-- Get the category IDs
DECLARE @OperationalBudgetID INT, @ActivityBudgetID INT, @FoodBudgetID INT, @SessionBudgetID INT;
SELECT @OperationalBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @OperationalCatID;
SELECT @ActivityBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @ActivityCatID;
SELECT @FoodBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @FoodCatID;
SELECT @SessionBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @SessionCatID;

PRINT '';
PRINT 'Creating expense line items...';

-- Operational Costs line items
INSERT INTO Project_Budget_Expense_Line_Items (Project_Budget_Category_ID, Item_Name, Vendor_Name, Estimated_Amount, Status, Sort_Order, Domain_ID)
VALUES
    (@OperationalBudgetID, 'Timberwolf', 'Camp Timberwolf', 120000.00, 'Approved', 1, 1),
    (@OperationalBudgetID, 'Staff/Band Coverage', NULL, 8850.00, 'Approved', 2, 1),
    (@OperationalBudgetID, 'Transportation', NULL, 60000.00, 'Approved', 3, 1),
    (@OperationalBudgetID, 'Gas', NULL, 5800.00, 'Approved', 4, 1),
    (@OperationalBudgetID, 'Medical Care', NULL, 1850.00, 'Approved', 5, 1),
    (@OperationalBudgetID, 'Staff Aid Discount', NULL, 2700.00, 'Approved', 6, 1),
    (@OperationalBudgetID, 'Sibling Discount', NULL, 4400.00, 'Approved', 7, 1),

    -- Activities line items
    (@ActivityBudgetID, 'Large Group Games/prizes', NULL, 1500.00, 'Approved', 1, 1),
    (@ActivityBudgetID, 'Free Time Activities', NULL, 700.00, 'Approved', 2, 1),
    (@ActivityBudgetID, 'Mealtime games/prizes', NULL, 400.00, 'Approved', 3, 1),
    (@ActivityBudgetID, 'Tournaments/prizes', NULL, 1000.00, 'Approved', 4, 1),

    -- Retreat Meal Supplies/Food line items
    (@FoodBudgetID, 'Paper Products', NULL, 2500.00, 'Approved', 1, 1),
    (@FoodBudgetID, 'Late Night Meals', NULL, 0.00, 'Approved', 2, 1),
    (@FoodBudgetID, 'Early Crew/staff meals', NULL, 3200.00, 'Approved', 3, 1),

    -- Session Costs line items
    (@SessionBudgetID, 'Audio Contract', NULL, 1000.00, 'Approved', 1, 1),
    (@SessionBudgetID, 'Stage Rentals', NULL, 8000.00, 'Approved', 2, 1),
    (@SessionBudgetID, 'Session supplies (non-band)', NULL, 200.00, 'Approved', 3, 1),
    (@SessionBudgetID, 'Band/Prod Supplies', NULL, 1500.00, 'Approved', 4, 1),
    (@SessionBudgetID, 'Setup/teardown supplies', NULL, 500.00, 'Approved', 5, 1),

    -- Volunteer Appreciation (using Session Costs category as workaround)
    (@SessionBudgetID, 'Leader Lounge', NULL, 2500.00, 'Approved', 10, 1),
    (@SessionBudgetID, 'Welcome Kits', NULL, 1000.00, 'Approved', 11, 1),
    (@SessionBudgetID, 'Band/Production Appreciation', NULL, 1000.00, 'Approved', 12, 1),
    (@SessionBudgetID, 'Timberwolf Coffee', NULL, 3500.00, 'Approved', 13, 1),
    (@SessionBudgetID, 'Work Crew Appreciation', NULL, 1500.00, 'Approved', 14, 1),

    -- Communications (using Session Costs category as workaround)
    (@SessionBudgetID, 'Promotions', NULL, 750.00, 'Approved', 20, 1),
    (@SessionBudgetID, 'Booklets', NULL, 1500.00, 'Approved', 21, 1),
    (@SessionBudgetID, 'Signage/Materials for Signs', NULL, 750.00, 'Approved', 22, 1),
    (@SessionBudgetID, 'Videographer/Photographer', NULL, 2600.00, 'Approved', 23, 1),

    -- Miscellaneous (using Session Costs category as workaround)
    (@SessionBudgetID, 'Admin/Staffing', NULL, 1000.00, 'Approved', 30, 1),
    (@SessionBudgetID, 'Merch for Student Staff', NULL, 1200.00, 'Approved', 31, 1),
    (@SessionBudgetID, 'Free Shirts', NULL, 10000.00, 'Approved', 32, 1),
    (@SessionBudgetID, 'Merch', NULL, 6000.00, 'Approved', 33, 1),
    (@SessionBudgetID, 'Credit Card Processing 3%', NULL, 6000.00, 'Approved', 34, 1);

PRINT '  Added 32 expense line items';

-- Now create actual transactions for items that have been paid
PRINT '';
PRINT 'Creating expense transactions for actual amounts...';

-- Get line item IDs (we'll use Description to store the relationship to line items for now)
INSERT INTO Project_Budget_Transactions (
    Project_ID, Transaction_Date, Transaction_Type,
    Project_Budget_Category_ID,
    Payee_Name, Description, Amount, Notes, Domain_ID
)
SELECT 7, '2025-01-15', 'Expense', @OperationalBudgetID, 'Camp Timberwolf', 'Timberwolf facility payment', 120889.00, 'Actual amount for Timberwolf', 1
UNION ALL SELECT 7, '2025-01-20', 'Expense', @OperationalBudgetID, 'Transportation Vendor', 'Transportation costs', 59547.00, 'Actual amount for Transportation', 1
UNION ALL SELECT 7, '2025-01-22', 'Expense', @OperationalBudgetID, 'Gas Station', 'Gas expenses', 1510.00, 'Actual amount for Gas', 1
UNION ALL SELECT 7, '2025-01-23', 'Expense', @OperationalBudgetID, 'Medical Provider', 'Medical care', 460.00, 'Actual amount for Medical Care', 1
UNION ALL SELECT 7, '2025-01-25', 'Expense', @ActivityBudgetID, 'Games Supplier', 'Large group games and prizes', 240.00, 'Actual amount for Large Group Games/prizes', 1
UNION ALL SELECT 7, '2025-01-25', 'Expense', @ActivityBudgetID, 'Activities Supplier', 'Free time activities', 675.00, 'Actual amount for Free Time Activities', 1
UNION ALL SELECT 7, '2025-01-25', 'Expense', @ActivityBudgetID, 'Games Supplier', 'Mealtime games and prizes', 36.00, 'Actual amount for Mealtime games/prizes', 1
UNION ALL SELECT 7, '2025-01-25', 'Expense', @ActivityBudgetID, 'Tournament Supplier', 'Tournament prizes', 735.00, 'Actual amount for Tournaments/prizes', 1
UNION ALL SELECT 7, '2025-01-28', 'Expense', @FoodBudgetID, 'Paper Supplier', 'Paper products for retreat', 1619.00, 'Actual amount for Paper Products', 1
UNION ALL SELECT 7, '2025-01-28', 'Expense', @FoodBudgetID, 'Food Vendor', 'Late night meals', 554.00, 'Actual amount for Late Night Meals', 1
UNION ALL SELECT 7, '2025-01-28', 'Expense', @FoodBudgetID, 'Food Vendor', 'Early crew and staff meals', 1545.00, 'Actual amount for Early Crew/staff meals', 1
UNION ALL SELECT 7, '2025-02-01', 'Expense', @SessionBudgetID, 'Audio Company', 'Audio contract', 1000.00, 'Actual amount for Audio Contract', 1
UNION ALL SELECT 7, '2025-02-01', 'Expense', @SessionBudgetID, 'Stage Rental Co', 'Stage rentals', 6748.00, 'Actual amount for Stage Rentals', 1
UNION ALL SELECT 7, '2025-02-01', 'Expense', @SessionBudgetID, 'Band Supplies', 'Band and production supplies', 230.00, 'Actual amount for Band/Prod Supplies', 1
UNION ALL SELECT 7, '2025-02-05', 'Expense', @SessionBudgetID, 'Leader Supplies', 'Leader lounge supplies', 588.00, 'Actual amount for Leader Lounge', 1
UNION ALL SELECT 7, '2025-02-05', 'Expense', @SessionBudgetID, 'Welcome Kits Co', 'Welcome kits for volunteers', 542.00, 'Actual amount for Welcome Kits', 1
UNION ALL SELECT 7, '2025-02-05', 'Expense', @SessionBudgetID, 'Appreciation Items', 'Band/production appreciation', 913.00, 'Actual amount for Band/Production Appreciation', 1
UNION ALL SELECT 7, '2025-02-05', 'Expense', @SessionBudgetID, 'Timberwolf', 'Coffee service', 3200.00, 'Actual amount for Timberwolf Coffee', 1
UNION ALL SELECT 7, '2025-02-08', 'Expense', @SessionBudgetID, 'Promotions Co', 'Promotional materials', 250.00, 'Actual amount for Promotions', 1
UNION ALL SELECT 7, '2025-02-08', 'Expense', @SessionBudgetID, 'Printing Co', 'Booklets', 575.00, 'Actual amount for Booklets', 1
UNION ALL SELECT 7, '2025-02-08', 'Expense', @SessionBudgetID, 'Videographer', 'Video and photo services', 2750.00, 'Actual amount for Videographer/Photographer', 1;

PRINT '  Added 21 expense transactions (Total: $204,608)';

PRINT '';
PRINT '================================================';
PRINT 'Budget data updated successfully!';
PRINT 'Total Estimated: $263,400';
PRINT 'Total Actual: $204,608';
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
