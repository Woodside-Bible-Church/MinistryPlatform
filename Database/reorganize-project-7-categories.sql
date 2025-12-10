-- =============================================
-- Reorganize Project 7 Budget Categories
-- Date: 2025-12-09
-- Description: Move line items to proper category types (Volunteer Appreciation, Communications, Miscellaneous)
-- =============================================

USE [MinistryPlatform]
GO

BEGIN TRANSACTION;

BEGIN TRY

PRINT 'Reorganizing Project 7 budget categories...';
PRINT '';

-- Get Category Type IDs
DECLARE @VolunteerAppreciationCatID INT, @CommunicationsCatID INT, @MiscellaneousCatID INT;
DECLARE @SessionCatID INT, @OperationalCatID INT, @ActivityCatID INT, @FoodCatID INT;

SELECT @VolunteerAppreciationCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Volunteer Appreciation';
SELECT @CommunicationsCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Communications';
SELECT @MiscellaneousCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Miscellaneous';
SELECT @SessionCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Session Costs';
SELECT @OperationalCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Operational Costs';
SELECT @ActivityCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Activity Costs';
SELECT @FoodCatID = Project_Category_Type_ID FROM Project_Category_Types WHERE Project_Category_Type = 'Food/Refreshments/Supplies';

PRINT 'Creating new budget categories...';

-- Add new budget categories
INSERT INTO Project_Budget_Categories (Project_ID, Project_Category_Type_ID, Budgeted_Amount, Sort_Order, Domain_ID)
VALUES
    (7, @VolunteerAppreciationCatID, 9500.00, 5, 1),   -- Volunteer Appreciation
    (7, @CommunicationsCatID, 5600.00, 6, 1),          -- Communications
    (7, @MiscellaneousCatID, 24200.00, 7, 1);          -- Miscellaneous

PRINT '  Added 3 new budget categories';

-- Get the new category budget IDs
DECLARE @VolunteerBudgetID INT, @CommunicationsBudgetID INT, @MiscellaneousBudgetID INT;
DECLARE @SessionBudgetID INT;

SELECT @VolunteerBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @VolunteerAppreciationCatID;
SELECT @CommunicationsBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @CommunicationsCatID;
SELECT @MiscellaneousBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @MiscellaneousCatID;
SELECT @SessionBudgetID = Project_Budget_Category_ID FROM Project_Budget_Categories WHERE Project_ID = 7 AND Project_Category_Type_ID = @SessionCatID;

PRINT '';
PRINT 'Moving expense line items to proper categories...';

-- Move Volunteer Appreciation line items (sort_order 10-14)
UPDATE Project_Budget_Expense_Line_Items
SET Project_Budget_Category_ID = @VolunteerBudgetID,
    Sort_Order = Sort_Order - 9  -- Reset sort order to 1-5
WHERE Project_Budget_Category_ID = @SessionBudgetID
    AND Sort_Order BETWEEN 10 AND 14;

PRINT '  Moved Volunteer Appreciation line items (5 items)';

-- Move Communications line items (sort_order 20-23)
UPDATE Project_Budget_Expense_Line_Items
SET Project_Budget_Category_ID = @CommunicationsBudgetID,
    Sort_Order = Sort_Order - 19  -- Reset sort order to 1-4
WHERE Project_Budget_Category_ID = @SessionBudgetID
    AND Sort_Order BETWEEN 20 AND 23;

PRINT '  Moved Communications line items (4 items)';

-- Move Miscellaneous line items (sort_order 30-34)
UPDATE Project_Budget_Expense_Line_Items
SET Project_Budget_Category_ID = @MiscellaneousBudgetID,
    Sort_Order = Sort_Order - 29  -- Reset sort order to 1-5
WHERE Project_Budget_Category_ID = @SessionBudgetID
    AND Sort_Order BETWEEN 30 AND 34;

PRINT '  Moved Miscellaneous line items (5 items)';

PRINT '';
PRINT 'Updating budget category totals...';

-- Update Session Costs budget to reflect removed items
UPDATE Project_Budget_Categories
SET Budgeted_Amount = 11200.00  -- Original amount for actual session costs only
WHERE Project_Budget_Category_ID = @SessionBudgetID;

PRINT '  Updated Session Costs budget amount';

PRINT '';
PRINT 'Moving transactions to proper categories...';

-- Move Volunteer Appreciation transactions
UPDATE Project_Budget_Transactions
SET Project_Budget_Category_ID = @VolunteerBudgetID
WHERE Project_ID = 7
    AND Description IN (
        'Leader lounge supplies',
        'Welcome kits for volunteers',
        'Band/production appreciation',
        'Coffee service'
    );

PRINT '  Moved Volunteer Appreciation transactions (4 items)';

-- Move Communications transactions
UPDATE Project_Budget_Transactions
SET Project_Budget_Category_ID = @CommunicationsBudgetID
WHERE Project_ID = 7
    AND Description IN (
        'Promotional materials',
        'Booklets',
        'Video and photo services'
    );

PRINT '  Moved Communications transactions (3 items)';

-- Note: Miscellaneous items have no transactions yet (all $0 actual)

PRINT '';
PRINT '================================================';
PRINT 'Budget categories reorganized successfully!';
PRINT 'New structure:';
PRINT '  - Operational Costs: $203,600';
PRINT '  - Activities: $3,600';
PRINT '  - Retreat Meal Supplies/Food: $5,700';
PRINT '  - Session Costs: $11,200 (cleaned up)';
PRINT '  - Volunteer Appreciation: $9,500';
PRINT '  - Communications: $5,600';
PRINT '  - Miscellaneous: $24,200';
PRINT 'Total Budget: $263,400';
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
