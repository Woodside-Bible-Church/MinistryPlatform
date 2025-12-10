# Budget Data Diagnosis

## API Response (what stored proc returns):
```json
{
  "Test Project": {
    "Total_Budget_Expense": 100,
    "Total_Budget_Revenue": 136
  },
  "Hope365 2025": {
    "Total_Budget_Expense": 5000,
    "Total_Budget_Revenue": 95000
  },
  "Christmas Services 2025": {
    "Total_Budget_Expense": 0,
    "Total_Budget_Revenue": 0
  },
  "Winter Retreat 2026": {
    "Total_Budget_Expense": 0,
    "Total_Budget_Revenue": 0
  }
}
```

## UI Display (what's shown on cards):
- Shows `totalEstimated` = `Total_Budget_Expense`
- Shows `totalActual` = 0 (not implemented yet)
- Does NOT show revenue budgets

## Questions to investigate:
1. Should the cards show BOTH expense AND revenue budgets?
2. Are there `Project_Budgets` records that aren't being counted?
3. Should we query `Project_Expenses` table for actual spending?

## SQL to check raw data:
```sql
-- See all budget records
SELECT
  p.Project_Title,
  pb.Budget_Amount,
  pct.Project_Category_Type,
  pct.Is_Revenue,
  pct.Discontinued
FROM Projects p
INNER JOIN Project_Budgets pb ON p.Project_ID = pb.Project_ID
INNER JOIN Project_Category_Types pct ON pb.Project_Category_Type_ID = pct.Project_Category_Type_ID
ORDER BY p.Project_ID, pct.Is_Revenue;

-- See all expense records
SELECT
  p.Project_Title,
  pe.Expense_Amount,
  pe.Expense_Date
FROM Projects p
INNER JOIN Project_Expenses pe ON p.Project_ID = pe.Project_ID
ORDER BY p.Project_ID, pe.Expense_Date;
```
