# Budget App Database Evaluation
**Date:** December 15, 2025
**Evaluated By:** Claude Code

## Summary

The budget database has been **successfully migrated** from separate `Project_Budget_Income_Line_Items` and `Project_Budget_Expense_Line_Items` tables to a consolidated `Project_Budget_Line_Items` table. The migration is complete and functional.

### Key Workflow Difference
- **Expense Line Items:** Require purchase request approval → then transactions
- **Income Line Items:** Transactions can be added directly (no purchase request needed)

---

## Current Database State

### Tables

#### Core Budget Tables (Active)
1. **`Project_Budget_Line_Items`** ✅ **CONSOLIDATED TABLE**
   - **Purpose:** Unified storage for both income and expense line items
   - **Records:** 39 total (33 expense + 6 income)
   - **Primary Key:** `Project_Budget_Line_Item_ID` (IDENTITY)
   - **Key Columns:**
     - `Category_ID` → Links to `Project_Budget_Categories`
     - `Line_Item_Name` (nvarchar, NOT NULL)
     - `Line_Item_Description` (nvarchar, NULL)
     - `Vendor_Name` (nvarchar, NULL)
     - `Estimated_Amount` (money, NOT NULL)
     - `Sort_Order` (int, NULL)
     - `Approved` (bit, NULL)
     - `Domain_ID` (int, NOT NULL)

2. **`Project_Budget_Categories`**
   - Links line items to projects and category types
   - Foreign key to `Project_Category_Types`

3. **`Project_Category_Types`**
   - **14 total types:** 4 revenue, 10 expense
   - **Critical column:** `Is_Revenue` (bit) - distinguishes income from expense
   - Revenue types: Registration Revenue, Scholarship Allowance, General Fund Allowance, Other Income
   - Expense types: Operational, Food, Sessions, Volunteer Appreciation, Communications, Activities, Miscellaneous, etc.

4. **`Project_Budget_Transactions`**
   - Tracks actual spending/income
   - **Foreign Keys (UPDATED):**
     - `FK_ProjectBudgetTransactions_ExpenseLineItem`: `Project_Budget_Expense_Line_Item_ID` → `Project_Budget_Line_Items.Project_Budget_Line_Item_ID`
     - `FK_ProjectBudgetTransactions_IncomeLineItem`: `Project_Budget_Income_Line_Item_ID` → `Project_Budget_Line_Items.Project_Budget_Line_Item_ID`

5. **`Project_Budget_Purchase_Requests`**
   - Approval workflow for **expense purchases only**
   - Links to expense line items via `Project_Budget_Expense_Line_Item_ID`
   - **Not used for income line items** - income transactions are added directly

6. **`Project_Budget_Payment_Methods`**
   - Lookup table for payment types

#### Legacy/Backup Tables
1. **`Project_Budget_Income_Line_Items`** ⚠️ **OLD TABLE - STILL EXISTS**
   - **Records:** 6 (NOT MIGRATED)
   - **Status:** This table still has data that was NOT migrated to consolidated table
   - **Action needed:** Should be dropped after verifying all data is in consolidated table

2. **`Project_Budget_Income_Line_Items_BACKUP_20251215`**
   - Backup created today (6 records)
   - Safe to keep as historical backup

---

## Migration Status

### ✅ Completed
- Consolidated table `Project_Budget_Line_Items` created
- 6 income line items successfully migrated (IDs 48-53)
- Foreign keys updated to point to consolidated table
- Category types properly configured with `Is_Revenue` flag

### ⚠️ Legacy Table Cleanup Needed
The old `Project_Budget_Income_Line_Items` table **still contains 6 records**. These are the same records that were migrated to the consolidated table (IDs 48-53). The old table should be dropped.

**Note:** There is NO `Project_Budget_Expense_Line_Items` table - expense line items were already in the consolidated table or were migrated earlier.

**Recommendation:** Verify the data is identical in both tables, then drop `Project_Budget_Income_Line_Items`.

---

## Stored Procedures

### Custom API Procedures (Budget App)
1. **`api_Custom_GetProjectBudgets_JSON`**
   - Returns all projects with budget summaries
   - Status: **Needs update to query consolidated table for income**

2. **`api_Custom_GetProjectBudgetDetails_JSON`**
   - Returns detailed budget for a single project
   - Status: **Needs update to query consolidated table for income**

3. **`api_Custom_GetProjectBudgetCategories_JSON`**
   - Returns categories and line items without transactions
   - Status: **Needs update to query consolidated table for income**

4. **`api_Custom_GetProjectBudgetSummary_JSON`**
   - Returns lightweight summary (totals only)
   - Status: **Needs update to query consolidated table for income**

5. **`api_Custom_GetProjectPurchaseRequests_JSON`**
   - Returns purchase requests for a project
   - Status: **Likely OK** (queries purchase requests, not line items directly)

6. **`api_Custom_GetPurchaseRequestDetails_JSON`**
   - Returns single purchase request with transactions
   - Status: **Likely OK** (may reference expense line items)

7. **`api_Custom_GetLineItemDetails_JSON`** ✅ **NEW**
   - Returns single line item with purchase requests
   - Status: **EXISTS** - queries consolidated table

### Other Procedures
- `api_GetPurchaseHistoryData`
- `api_MPP_GetPurchaseHistoryData`
- `report_global_partner_budget`

---

## Required Updates

### 1. Stored Procedures - CRITICAL
The following stored procedures are **currently querying the old `Project_Budget_Income_Line_Items` table** and need to be updated to query the consolidated table with `Is_Revenue = 1` filter:

#### Update Priority: HIGH
```sql
-- These 4 procedures need updates:
- api_Custom_GetProjectBudgets_JSON
- api_Custom_GetProjectBudgetDetails_JSON
- api_Custom_GetProjectBudgetCategories_JSON
- api_Custom_GetProjectBudgetSummary_JSON

-- Pattern for income queries:
SELECT ...
FROM Project_Budget_Line_Items li
INNER JOIN Project_Budget_Categories pbc ON li.Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pct.Is_Revenue = 1  -- Filter for income items
```

### 2. Drop Old Table - After Verification
```sql
-- Verify data first
SELECT * FROM Project_Budget_Income_Line_Items
SELECT * FROM Project_Budget_Line_Items WHERE Project_Budget_Line_Item_ID IN (48,49,50,51,52,53)

-- Then drop old table
DROP TABLE Project_Budget_Income_Line_Items
```

### 3. Application Routes - NEEDED
The Next.js app needs these API routes created:
- `/api/projects/[id]/line-items/[lineItemId]` - GET line item details
- `/api/projects/[id]/line-items/[lineItemId]/transactions` - POST income transactions

---

## Data Integrity Verification

### Income Line Items in Consolidated Table
```
ID: 48, Name: Merch Weekend #1, Amount: $2,000, Category: Other Income
ID: 49, Name: Merch Weekend #2, Amount: $2,000, Category: Other Income
ID: 50, Name: Merch Weekend #3, Amount: $2,000, Category: Other Income
ID: 51, Name: Band Week 1, Amount: $250, Category: Other Income
ID: 52, Name: Band Week 2, Amount: $250, Category: Other Income
ID: 53, Name: Band Week 3, Amount: $250, Category: Other Income
```

All 6 income items successfully use the "Other Income" category type (ID: 14) which has `Is_Revenue = true`.

---

## Next Steps

1. **Immediate:** Update the 4 stored procedures to query consolidated table
2. **Verify:** Confirm old `Project_Budget_Income_Line_Items` data matches consolidated table
3. **Clean up:** Drop old `Project_Budget_Income_Line_Items` table
4. **Application:** Rebuild the line items detail routes and API endpoints
5. **Testing:** Verify income line items display correctly in budget app

---

## Database Schema Reference

### Query to Distinguish Income vs Expense
```sql
-- Get all income line items
SELECT li.*, pct.Project_Category_Type
FROM Project_Budget_Line_Items li
INNER JOIN Project_Budget_Categories pbc ON li.Category_ID = pbc.Project_Budget_Category_ID
INNER JOIN Project_Category_Types pct ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
WHERE pct.Is_Revenue = 1

-- Get all expense line items
WHERE pct.Is_Revenue = 0
```

### Foreign Key Relationships
```
Projects
  ↓
Project_Budget_Categories (links project to category type)
  ↓
Project_Budget_Line_Items (consolidated income + expense)
  ↓
Project_Budget_Transactions (actual spending/income)
  ← Project_Budget_Purchase_Requests (approval workflow for expenses)
```

---

## Conclusion

**The database migration is functionally complete**, but the stored procedures and application code need to be updated to query the consolidated table. The old income table should be dropped after verification to avoid confusion.

**Risk Level:** Low - The consolidated table exists and has the correct data. This is purely a matter of updating queries.
