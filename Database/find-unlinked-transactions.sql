-- Show the 7 unlinked transactions and available line items in their categories
SELECT
    pbt.Project_Budget_Transaction_ID,
    pbt.Description,
    pct.Project_Category_Type,
    'Available line items:' AS Separator,
    STRING_AGG(pbeli.Item_Name, ', ') AS Available_Line_Items
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
LEFT JOIN Project_Budget_Expense_Line_Items pbeli ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbt.Project_ID = 7
    AND pbt.Project_Budget_Expense_Line_Item_ID IS NULL
GROUP BY pbt.Project_Budget_Transaction_ID, pbt.Description, pct.Project_Category_Type;
