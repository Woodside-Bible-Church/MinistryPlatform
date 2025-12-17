# Stored Procedure Update Guide
## Unified Line Items Migration

## Overview
After migrating the database to use the unified `Project_Budget_Line_Items` table, you need to update the stored procedure `api_Custom_GetProjectBudgetDetails_JSON` to query from the new unified table instead of the old separate tables.

## Current Structure (Old)
The stored procedure likely queries from:
- `Project_Budget_Expense_Line_Items` for expense line items
- `Project_Budget_Income_Line_Items` for income line items

## New Structure (Required)
The stored procedure should query from:
- `Project_Budget_Line_Items` (unified table)
- Filter by the category's `Category_Type` field to separate expense vs revenue

## Key Changes Needed

### 1. Query Expense Line Items
**OLD:**
```sql
SELECT
    pbeli.Project_Budget_Expense_Line_Item_ID AS lineItemId,
    pbeli.Line_Item_Name AS name,
    -- ... other fields
FROM Project_Budget_Expense_Line_Items pbeli
WHERE pbeli.Project_Budget_Category_ID = @CategoryID
```

**NEW:**
```sql
SELECT
    pbli.Project_Budget_Line_Item_ID AS lineItemId,
    pbli.Line_Item_Name AS name,
    -- ... other fields
FROM Project_Budget_Line_Items pbli
INNER JOIN Project_Budget_Categories pbc
    ON pbli.Category_ID = pbc.Project_Budget_Category_ID
WHERE pbli.Category_ID = @CategoryID
    AND pbc.Category_Type = 'expense'
```

### 2. Query Income Line Items
**OLD:**
```sql
SELECT
    pbili.Project_Budget_Income_Line_Item_ID AS lineItemId,
    pbili.Line_Item_Name AS name,
    -- ... other fields
FROM Project_Budget_Income_Line_Items pbili
WHERE pbili.Project_Budget_Category_ID = @CategoryID
```

**NEW:**
```sql
SELECT
    pbli.Project_Budget_Line_Item_ID AS lineItemId,
    pbli.Line_Item_Name AS name,
    -- ... other fields
FROM Project_Budget_Line_Items pbli
INNER JOIN Project_Budget_Categories pbc
    ON pbli.Category_ID = pbc.Project_Budget_Category_ID
WHERE pbli.Category_ID = @CategoryID
    AND pbc.Category_Type = 'revenue'
```

### 3. Transaction Queries
Update any transaction queries that reference the old columns:

**OLD:**
```sql
LEFT JOIN Project_Budget_Expense_Line_Items pbeli
    ON pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
LEFT JOIN Project_Budget_Income_Line_Items pbili
    ON pbt.Project_Budget_Income_Line_Item_ID = pbili.Project_Budget_Income_Line_Item_ID
```

**NEW:**
```sql
LEFT JOIN Project_Budget_Line_Items pbli
    ON pbt.Project_Budget_Line_Item_ID = pbli.Project_Budget_Line_Item_ID
```

## Testing Checklist

After updating the stored procedure:

- [ ] Test expense category line items display correctly
- [ ] Test income category line items display correctly
- [ ] Test transactions link to correct line items
- [ ] Verify JSON structure matches what frontend expects
- [ ] Check `expenseCategories` array populates
- [ ] Check `incomeLineItemsCategories` array populates
- [ ] Test with projects that have both expense and income items
- [ ] Test with projects that have no line items

## Expected JSON Structure

The stored procedure should continue to return:

```json
{
  "Project_ID": 123,
  "expenseCategories": [
    {
      "categoryId": "1",
      "name": "Operational Costs",
      "type": "expense",
      "lineItems": [
        {
          "lineItemId": "456",
          "name": "Venue Rental",
          "estimated": 5000.00,
          "actual": 5200.00
        }
      ]
    }
  ],
  "incomeLineItemsCategories": [
    {
      "categoryId": "2",
      "name": "Registration Income",
      "type": "revenue",
      "lineItems": [
        {
          "lineItemId": "789",
          "name": "Early Bird Registration",
          "estimated": 10000.00,
          "actual": 9500.00
        }
      ]
    }
  ]
}
```

## Common Issues

### Issue: Line items not appearing
**Cause:** Missing join to `Project_Budget_Categories` table or wrong `Category_Type` filter
**Fix:** Ensure you're joining to categories and filtering by the correct type

### Issue: Wrong line item IDs
**Cause:** Using old column names in SELECT
**Fix:** Use `Project_Budget_Line_Item_ID` instead of the old ID columns

### Issue: Transactions not linking
**Cause:** Transaction query still references old FK columns
**Fix:** Update transaction queries to use `Project_Budget_Line_Item_ID`

## Verification Query

Run this to verify the stored procedure returns correct data:

```sql
EXEC api_Custom_GetProjectBudgetDetails_JSON @Slug = 'your-test-project-slug'
```

Check that:
1. Both expense and income categories are present
2. Line items have the correct `lineItemId` values
3. Line item counts match what's in the database
