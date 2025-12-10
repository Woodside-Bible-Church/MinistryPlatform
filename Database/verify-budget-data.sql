-- Verify fake budget data for Project ID 7

USE MinistryPlatform;
GO

PRINT 'Budget Categories for Project 7:';
SELECT
    pbc.Project_Budget_Category_ID,
    pct.Project_Category_Type,
    pbc.Budgeted_Amount,
    pbc.Sort_Order
FROM Project_Budget_Categories pbc
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbc.Project_ID = 7
ORDER BY pbc.Sort_Order;

PRINT '';
PRINT 'Expense Line Items for Project 7:';
SELECT
    pbeli.Project_Budget_Expense_Line_Item_ID,
    pct.Project_Category_Type,
    pbeli.Item_Name,
    pbeli.Vendor_Name,
    pbeli.Estimated_Amount,
    pbeli.Status
FROM Project_Budget_Expense_Line_Items pbeli
INNER JOIN Project_Budget_Categories pbc ON pbeli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbc.Project_ID = 7
ORDER BY pbc.Sort_Order, pbeli.Sort_Order;

PRINT '';
PRINT 'Income Line Items for Project 7:';
SELECT
    Project_Budget_Income_Line_Item_ID,
    Income_Source_Name,
    Expected_Amount
FROM Project_Budget_Income_Line_Items
WHERE Project_ID = 7
ORDER BY Sort_Order;

PRINT '';
PRINT 'Expense Transactions for Project 7:';
SELECT
    pbt.Transaction_Date,
    pct.Project_Category_Type,
    pbt.Payee_Name,
    pbt.Description,
    pbt.Amount,
    pbt.Payment_Reference
FROM Project_Budget_Transactions pbt
LEFT JOIN Project_Budget_Categories pbc ON pbt.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
LEFT JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pbt.Project_ID = 7 AND pbt.Transaction_Type = 'Expense'
ORDER BY pbt.Transaction_Date;

PRINT '';
PRINT 'Income Transactions for Project 7:';
SELECT
    Transaction_Date,
    Payee_Name,
    Description,
    Amount,
    Payment_Reference
FROM Project_Budget_Transactions
WHERE Project_ID = 7 AND Transaction_Type = 'Income'
ORDER BY Transaction_Date;

PRINT '';
PRINT 'Budget Summary:';
SELECT
    (SELECT ISNULL(SUM(Budgeted_Amount), 0) FROM Project_Budget_Categories WHERE Project_ID = 7) AS Total_Budget,
    (SELECT ISNULL(SUM(Amount), 0) FROM Project_Budget_Transactions WHERE Project_ID = 7 AND Transaction_Type = 'Expense') AS Total_Expenses,
    (SELECT ISNULL(SUM(Amount), 0) FROM Project_Budget_Transactions WHERE Project_ID = 7 AND Transaction_Type = 'Income') AS Total_Income;

GO
