-- Check all transactions for Winter Retreat (Project 7)
SELECT
    pbt.Project_Budget_Transaction_ID,
    pbt.Transaction_Date,
    pbt.Amount,
    pbt.Transaction_Type,
    pbt.Description,
    pbc.Project_Budget_Category_ID,
    pct.Project_Category_Type AS Category_Name,
    pbeli.Project_Budget_Expense_Line_Item_ID,
    pbeli.Item_Name AS Line_Item_Name
FROM Project_Budget_Transactions pbt
LEFT JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
LEFT JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
LEFT JOIN Project_Budget_Expense_Line_Items pbeli ON pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
WHERE pbt.Project_ID = 7
ORDER BY pct.Project_Category_Type, pbeli.Item_Name, pbt.Transaction_Date;
