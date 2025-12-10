-- Check income categories and their line items structure for Project 7

-- First, check if income categories exist
SELECT
    pbc.Project_Budget_Category_ID,
    pct.Project_Category_Type AS Category_Name,
    pct.Project_Category_Type_ID
FROM Project_Budget_Categories pbc
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbc.Project_ID = 7
    AND pct.Project_Category_Type IN ('Income', 'Registration Income')
ORDER BY pct.Project_Category_Type;

-- Check line items for income categories
SELECT
    pct.Project_Category_Type AS Category_Name,
    pbeli.Item_Name,
    pbeli.Estimated_Amount,
    pbeli.Actual_Amount,
    pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Expense_Line_Items pbeli
INNER JOIN Project_Budget_Categories pbc ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbc.Project_ID = 7
    AND pct.Project_Category_Type IN ('Income', 'Registration Income')
ORDER BY pct.Project_Category_Type, pbeli.Item_Name;
