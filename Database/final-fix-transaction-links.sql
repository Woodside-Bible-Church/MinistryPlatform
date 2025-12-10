-- Fix the 7 remaining unlinked transactions with correct line item names

-- Transaction 12: Large group games and prizes -> Large Group Games/prizes (ID 20)
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = 20
WHERE Project_Budget_Transaction_ID = 12;

-- Transaction 14: Mealtime games and prizes -> Mealtime games/prizes (ID 22)
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = 22
WHERE Project_Budget_Transaction_ID = 14;

-- Transaction 15: Tournament prizes -> Tournaments/prizes (ID 23)
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = 23
WHERE Project_Budget_Transaction_ID = 15;

-- Transaction 26: Promotional materials -> Promotions (ID 37)
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = 37
WHERE Project_Budget_Transaction_ID = 26;

-- Transaction 28: Video and photo services -> Videographer/Photographer (ID 40)
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = 40
WHERE Project_Budget_Transaction_ID = 28;

-- Transaction 21: Band and production supplies -> Band/Prod Supplies (ID 30)
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = 30
WHERE Project_Budget_Transaction_ID = 21;

-- Transaction 25: Coffee service -> Timberwolf Coffee (ID 35)
UPDATE Project_Budget_Transactions
SET Project_Budget_Expense_Line_Item_ID = 35
WHERE Project_Budget_Transaction_ID = 25;

-- Verify all are now linked
SELECT
    'ALL TRANSACTIONS LINKED' AS Status,
    COUNT(*) AS Total_Transactions,
    SUM(CASE WHEN Project_Budget_Expense_Line_Item_ID IS NOT NULL THEN 1 ELSE 0 END) AS Linked,
    SUM(CASE WHEN Project_Budget_Expense_Line_Item_ID IS NULL THEN 1 ELSE 0 END) AS Unlinked
FROM Project_Budget_Transactions
WHERE Project_ID = 7;
