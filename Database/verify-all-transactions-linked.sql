-- Quick verification - count transactions with and without line items
SELECT
    'Transactions with line items' AS Status,
    COUNT(*) AS Count
FROM Project_Budget_Transactions
WHERE Project_ID = 7
    AND Project_Budget_Expense_Line_Item_ID IS NOT NULL

UNION ALL

SELECT
    'Transactions WITHOUT line items' AS Status,
    COUNT(*) AS Count
FROM Project_Budget_Transactions
WHERE Project_ID = 7
    AND Project_Budget_Expense_Line_Item_ID IS NULL;
