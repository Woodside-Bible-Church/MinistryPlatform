-- Fix the remaining transactions that couldn't find matching line items

-- Activity Costs - Large Group Games
UPDATE pbt
SET pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_Budget_Transaction_ID = 12
    AND pbeli.Item_Name = 'Large Group Games';

-- Activity Costs - Meal Time Games
UPDATE pbt
SET pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_Budget_Transaction_ID = 14
    AND pbeli.Item_Name = 'Meal Time Games';

-- Activity Costs - Tournament Prizes
UPDATE pbt
SET pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_Budget_Transaction_ID = 15
    AND pbeli.Item_Name = 'Tournament Prizes';

-- Communications - Promotional Materials
UPDATE pbt
SET pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_Budget_Transaction_ID = 26
    AND pbeli.Item_Name = 'Promotional Materials';

-- Communications - Video/Photo
UPDATE pbt
SET pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_Budget_Transaction_ID = 28
    AND pbeli.Item_Name = 'Video/Photo';

-- Session Costs - Band/Production Supplies
UPDATE pbt
SET pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_Budget_Transaction_ID = 21
    AND pbeli.Item_Name = 'Band/Production Supplies';

-- Volunteer Appreciation - Coffee Service
UPDATE pbt
SET pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_Budget_Transaction_ID = 25
    AND pbeli.Item_Name = 'Coffee Service';

-- Verify all transactions are now linked
SELECT 'Final verification - all should have line items:' AS Message;
SELECT
    pbt.Project_Budget_Transaction_ID,
    pbt.Amount,
    pbt.Description,
    pbeli.Item_Name AS Line_Item_Name,
    CASE WHEN pbt.Project_Budget_Expense_Line_Item_ID IS NULL THEN 'MISSING' ELSE 'OK' END AS Status
FROM Project_Budget_Transactions pbt
LEFT JOIN Project_Budget_Expense_Line_Items pbeli ON pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
WHERE pbt.Project_ID = 7
ORDER BY Status DESC, pbeli.Item_Name;
