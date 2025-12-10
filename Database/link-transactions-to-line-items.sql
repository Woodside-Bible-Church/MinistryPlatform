-- Link existing transactions to their corresponding line items
-- This fixes the issue where transactions show at category level but not line item level

-- Operational Costs
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Timberwolf' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 8; -- Timberwolf facility payment

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Transportation' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 9; -- Transportation costs

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Gas' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 10; -- Gas expenses

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Medical Care' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 11; -- Medical care

-- Activity Costs
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Large Group Games' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 12; -- Large group games and prizes

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Free Time Activities' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 13; -- Free time activities

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Meal Time Games' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 14; -- Mealtime games and prizes

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Tournament Prizes' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 15; -- Tournament prizes

-- Food/Refreshments/Supplies
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Paper Products' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 16; -- Paper products for retreat

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Late Night Meals' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 17; -- Late night meals

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Early Crew/staff meals' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 18; -- Early crew and staff meals

-- Session Costs
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Audio Contract' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 19; -- Audio contract

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Stage Rentals' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 20; -- Stage rentals

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Band/Production Supplies' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 21; -- Band and production supplies

-- Volunteer Appreciation
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Leader Lounge' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 22; -- Leader lounge supplies

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Welcome Kits' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 23; -- Welcome kits for volunteers

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Band/Production Appreciation' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 24; -- Band/production appreciation

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Coffee Service' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 25; -- Coffee service

-- Communications
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Promotional Materials' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 26; -- Promotional materials

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Booklets' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 27; -- Booklets

UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = (
    SELECT Project_Budget_Expense_Line_Item_ID
    FROM Project_Budget_Expense_Line_Items
    WHERE Item_Name = 'Video/Photo' AND Project_ID = 7
)
WHERE Project_Budget_Transaction_ID = 28; -- Video and photo services

-- Show results
SELECT 'Updated transactions:' AS Message;
SELECT
    pbt.Project_Budget_Transaction_ID,
    pbt.Amount,
    pbt.Description,
    pbeli.Item_Name AS Line_Item_Name,
    pct.Project_Category_Type AS Category_Name
FROM Project_Budget_Transactions pbt
LEFT JOIN Project_Budget_Expense_Line_Items pbeli ON pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
LEFT JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
LEFT JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbt.Project_ID = 7
ORDER BY pct.Project_Category_Type, pbeli.Item_Name;
