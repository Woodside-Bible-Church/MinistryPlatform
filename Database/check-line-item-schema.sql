-- Check the schema for line items
SELECT TOP 5
    pbeli.*
FROM Project_Budget_Expense_Line_Items pbeli
INNER JOIN Project_Budget_Categories pbc ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
WHERE pbc.Project_ID = 7;
