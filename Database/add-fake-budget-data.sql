-- =============================================
-- Add Fake Budget Data for Project ID 7 (Winter Retreat 2025)
-- Author: Claude Code
-- Date: 2025-12-09
-- Description: Adds realistic test data to all budget tables
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Adding fake budget data for Project ID 7 (Winter Retreat 2025)...'
PRINT ''

-- Get Category Type IDs for reference (using actual category names from DB)
DECLARE @FoodCatID INT, @OperationalCatID INT, @ActivityCatID INT, @SessionCatID INT;

SELECT @FoodCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Food/Refreshments/Supplies';
SELECT @OperationalCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Operational Costs';
SELECT @ActivityCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Activity Costs';
SELECT @SessionCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Session Costs';

-- Get Payment Method IDs
DECLARE @CheckID INT, @CardID INT, @CashID INT;
SELECT @CheckID = Payment_Method_ID FROM Project_Budget_Payment_Methods WHERE Payment_Method_Name = 'Check';
SELECT @CardID = Payment_Method_ID FROM Project_Budget_Payment_Methods WHERE Payment_Method_Name = 'Credit Card';
SELECT @CashID = Payment_Method_ID FROM Project_Budget_Payment_Methods WHERE Payment_Method_Name = 'Cash';

-- =============================================
-- 1. Add Budget Categories (expense categories with budgeted amounts)
-- =============================================
PRINT 'Adding budget categories...'

IF NOT EXISTS (SELECT 1 FROM Project_Budget_Categories WHERE Project_ID = 7)
BEGIN
    INSERT INTO Project_Budget_Categories (Project_ID, Project_Category_Type_ID, Budgeted_Amount, Sort_Order, Domain_ID)
    VALUES
        (7, @FoodCatID, 15000.00, 1, 1),  -- Food/Refreshments/Supplies: $15,000
        (7, @OperationalCatID, 25000.00, 2, 1),  -- Operational Costs (lodging, transport): $25,000
        (7, @ActivityCatID, 8000.00, 3, 1),  -- Activity Costs: $8,000
        (7, @SessionCatID, 2000.00, 4, 1);  -- Session Costs (materials, worship): $2,000

    PRINT '  Added 4 budget categories (Total Budget: $50,000)'
END
ELSE
    PRINT '  Budget categories already exist'

-- Get the category IDs we just created
DECLARE @FoodBudgetID INT, @OperationalBudgetID INT, @ActivityBudgetID INT, @SessionBudgetID INT;

SELECT @FoodBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @FoodCatID;
SELECT @OperationalBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @OperationalCatID;
SELECT @ActivityBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @ActivityCatID;
SELECT @SessionBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @SessionCatID;

-- =============================================
-- 2. Add Expense Line Items (planned expenses within categories)
-- =============================================
PRINT 'Adding expense line items...'

IF NOT EXISTS (SELECT 1 FROM Project_Budget_Expense_Line_Items WHERE Project_Budget_Category_ID IN (@FoodBudgetID, @OperationalBudgetID, @ActivityBudgetID, @SessionBudgetID))
BEGIN
    INSERT INTO Project_Budget_Expense_Line_Items (Project_Budget_Category_ID, Item_Name, Item_Description, Vendor_Name, Estimated_Amount, Status, Sort_Order, Domain_ID)
    VALUES
        -- Food category
        (@FoodBudgetID, 'Friday Dinner', 'Catered dinner for 150 students', 'Chipotle Catering', 3500.00, 'Approved', 1, 1),
        (@FoodBudgetID, 'Saturday Breakfast', 'Continental breakfast', 'Panera Bread', 2000.00, 'Approved', 2, 1),
        (@FoodBudgetID, 'Saturday Lunch', 'Box lunches for activities', 'Jimmy Johns', 3000.00, 'Approved', 3, 1),
        (@FoodBudgetID, 'Saturday Dinner', 'BBQ dinner', 'Famous Daves', 4000.00, 'Approved', 4, 1),
        (@FoodBudgetID, 'Sunday Breakfast', 'Pancake breakfast', 'Local Caterer', 2500.00, 'Pending', 5, 1),

        -- Operational Costs category (lodging, facilities)
        (@OperationalBudgetID, 'Camp Facility Rental', '2-night rental for 150 students', 'Camp Michindoh', 20000.00, 'Approved', 1, 1),
        (@OperationalBudgetID, 'Staff Lodging', 'Hotel rooms for 10 leaders', 'Hampton Inn', 5000.00, 'Approved', 2, 1),

        -- Activity Costs category (transportation)
        (@ActivityBudgetID, 'Charter Buses', '3 buses for weekend transport', 'Indian Trails', 6000.00, 'Approved', 1, 1),
        (@ActivityBudgetID, 'Van Rental', 'Equipment transport', 'Enterprise', 2000.00, 'Approved', 2, 1),

        -- Session Costs category (materials, worship)
        (@SessionBudgetID, 'T-Shirts', 'Retreat t-shirts for all participants', 'CustomInk', 1500.00, 'Approved', 1, 1),
        (@SessionBudgetID, 'Worship Materials', 'Supplies for worship sessions', 'Lifeway', 500.00, 'Pending', 2, 1);

    PRINT '  Added 11 expense line items across all categories'
END
ELSE
    PRINT '  Expense line items already exist'

-- =============================================
-- 3. Add Income Line Items (non-registration revenue sources)
-- =============================================
PRINT 'Adding income line items...'

IF NOT EXISTS (SELECT 1 FROM Project_Budget_Income_Line_Items WHERE Project_ID = 7)
BEGIN
    INSERT INTO Project_Budget_Income_Line_Items (Project_ID, Income_Source_Name, Description, Expected_Amount, Sort_Order, Domain_ID)
    VALUES
        (7, 'Scholarship Fund', 'Church scholarship fund for students', 5000.00, 1, 1),
        (7, 'Parent Donations', 'Additional donations from parents', 3000.00, 2, 1),
        (7, 'Fundraising Events', 'Car wash and bake sale proceeds', 2000.00, 3, 1);

    PRINT '  Added 3 income line items (Total Expected: $10,000)'
END
ELSE
    PRINT '  Income line items already exist'

-- =============================================
-- 4. Add Actual Expense Transactions (money already spent)
-- =============================================
PRINT 'Adding expense transactions...'

IF NOT EXISTS (SELECT 1 FROM Project_Budget_Transactions WHERE Project_ID = 7)
BEGIN
    INSERT INTO Project_Budget_Transactions (
        Project_ID, Transaction_Date, Transaction_Type,
        Project_Budget_Category_ID, Project_Budget_Expense_Line_Item_ID,
        Payee_Name, Description, Amount, Payment_Method_ID, Payment_Reference, Notes, Domain_ID
    )
    VALUES
        -- Camp deposit (Operational Costs)
        (7, '2024-09-15', 'Expense', @OperationalBudgetID, NULL, 'Camp Michindoh', 'Deposit for facility rental', 5000.00, @CheckID, 'CHK-1001', 'Initial deposit to secure dates', 1),

        -- Bus deposit (Activity Costs)
        (7, '2024-10-01', 'Expense', @ActivityBudgetID, NULL, 'Indian Trails', 'Deposit for charter buses', 2000.00, @CardID, 'VISA-****4532', 'Secured 3 buses for weekend', 1),

        -- T-shirt order (Session Costs)
        (7, '2024-10-15', 'Expense', @SessionBudgetID, NULL, 'CustomInk', 'T-shirt order for 150 students', 1500.00, @CardID, 'VISA-****4532', 'Order #WR2025-001', 1),

        -- Friday dinner payment (Food)
        (7, '2024-11-01', 'Expense', @FoodBudgetID, NULL, 'Chipotle Catering', 'Deposit for Friday night dinner', 1000.00, @CheckID, 'CHK-1002', '30% deposit', 1);

    PRINT '  Added 4 expense transactions (Total Expenses: $9,500)'
END
ELSE
    PRINT '  Expense transactions already exist'

-- =============================================
-- 5. Add Actual Income Transactions (money already received)
-- =============================================
PRINT 'Adding income transactions...'

-- Get an income line item ID
DECLARE @ScholarshipIncomeID INT;
SELECT @ScholarshipIncomeID = Project_Budget_Income_Line_Item_ID
FROM Project_Budget_Income_Line_Items
WHERE Project_ID = 7 AND Income_Source_Name = 'Scholarship Fund';

IF NOT EXISTS (SELECT 1 FROM Project_Budget_Transactions WHERE Project_ID = 7 AND Transaction_Type = 'Income')
BEGIN
    INSERT INTO Project_Budget_Transactions (
        Project_ID, Transaction_Date, Transaction_Type,
        Project_Budget_Income_Line_Item_ID,
        Payee_Name, Description, Amount, Payment_Method_ID, Payment_Reference, Notes, Domain_ID
    )
    VALUES
        -- Scholarship fund donation
        (7, '2024-10-01', 'Income', @ScholarshipIncomeID, 'Church Scholarship Fund', 'First quarter scholarship allocation', 2500.00, @CheckID, 'CHK-SF-001', 'Q1 allocation for retreat', 1),

        -- Parent donation
        (7, '2024-10-15', 'Income', NULL, 'Parent Donation - Smith Family', 'Additional support for retreat costs', 500.00, @CheckID, 'CHK-1050', 'Generous donation from the Smiths', 1),

        -- Fundraising proceeds
        (7, '2024-11-10', 'Income', NULL, 'Car Wash Fundraiser', 'Youth group car wash proceeds', 800.00, @CashID, 'CASH-2024-11', 'Saturday car wash at church', 1);

    PRINT '  Added 3 income transactions (Total Income: $3,800)'
END
ELSE
    PRINT '  Income transactions already exist'

PRINT ''
PRINT '================================================'
PRINT 'Fake Budget Data Summary for Winter Retreat 2025'
PRINT '================================================'
PRINT 'Total Budgeted: $50,000'
PRINT 'Total Expenses to Date: $9,500'
PRINT 'Total Income to Date: $3,800'
PRINT 'Expected Registration Revenue: $1,234,567 (set in Project record)'
PRINT '================================================'

COMMIT TRANSACTION;
PRINT 'Transaction committed successfully!'

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT 'Error occurred, transaction rolled back.'
    PRINT ERROR_MESSAGE();
    THROW;
END CATCH

GO
