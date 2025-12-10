-- Show all line items for Activity Costs, Communications, Session Costs, Volunteer Appreciation
SELECT
    pct.Project_Category_Type,
    pbeli.Item_Name,
    pbeli.Project_Budget_Expense_Line_Item_ID
FROM Project_Budget_Expense_Line_Items pbeli
INNER JOIN Project_Budget_Categories pbc ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbc.Project_ID = 7
    AND pct.Project_Category_Type IN ('Activity Costs', 'Communications', 'Session Costs', 'Volunteer Appreciation')
ORDER BY pct.Project_Category_Type, pbeli.Item_Name;
