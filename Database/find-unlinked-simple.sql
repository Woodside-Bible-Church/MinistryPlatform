-- Show unlinked transactions
SELECT
    pbt.Project_Budget_Transaction_ID,
    pbt.Description AS Transaction_Description,
    pct.Project_Category_Type
FROM Project_Budget_Transactions pbt
INNER JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbt.Project_ID = 7
    AND pbt.Project_Budget_Expense_Line_Item_ID IS NULL
ORDER BY pct.Project_Category_Type;

-- Show all line items for these categories
SELECT
    pct.Project_Category_Type,
    pbeli.Item_Name
FROM Project_Budget_Expense_Line_Items pbeli
INNER JOIN Project_Budget_Categories pbc ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbc.Project_ID = 7
    AND pct.Project_Category_Type IN (
        SELECT DISTINCT pct2.Project_Category_Type
        FROM Project_Budget_Transactions pbt2
        INNER JOIN Project_Budget_Categories pbc2 ON pbt2.Project_Budget_Category_ID = pbc2.Project_Budget_Category_ID
        INNER JOIN Project_Category_Types pct2 ON pbc2.Project_Category_Type_ID = pct2.Project_Category_Type_ID
        WHERE pbt2.Project_ID = 7 AND pbt2.Project_Budget_Expense_Line_Item_ID IS NULL
    )
ORDER BY pct.Project_Category_Type, pbeli.Item_Name;
