-- Check existing transactions to see the structure
SELECT TOP 5
    Project_Budget_Transaction_ID,
    Transaction_Date,
    Transaction_Type,
    Payee_Name,
    Description,
    Amount,
    Payment_Method_ID,
    Payment_Reference
FROM Project_Budget_Transactions
WHERE Project_ID = 7
ORDER BY Transaction_Date DESC;
