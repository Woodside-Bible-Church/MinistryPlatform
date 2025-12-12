# Phase 1: Indexed Views Performance Optimization

## Summary

Implemented SQL indexed views to eliminate ~76 correlated subqueries in the `api_Custom_GetProjectBudgetDetails_JSON` stored procedure. This is Phase 1 of the hybrid optimization approach (indexed views + denormalized fields with triggers).

**Expected Performance Improvement**: 20-30% (1358ms → ~950-1100ms)

## What Was Created

### 1. Indexed Views Migration (`20-create-indexed-views-for-performance.sql`)

Created four indexed views following the `vw_Custom_*` naming convention:

#### `vw_Custom_Project_Budget_Expense_LineItem_Actuals`
- **Purpose**: Pre-aggregates expense transaction amounts per line item
- **Replaces**: ~45 correlated subqueries (one per expense line item)
- **Indexes**:
  - Clustered on `Project_Budget_Expense_Line_Item_ID`
  - Non-clustered on `Project_ID`

#### `vw_Custom_Project_Budget_Income_LineItem_Actuals`
- **Purpose**: Pre-aggregates income transaction amounts per line item
- **Replaces**: ~6 correlated subqueries (one per income line item)
- **Indexes**:
  - Clustered on `Project_Budget_Income_Line_Item_ID`
  - Non-clustered on `Project_ID`

#### `vw_Custom_Project_Registration_Discounts`
- **Purpose**: Pre-aggregates registration discounts grouped by product option (discount type)
- **Replaces**: ~17 correlated subqueries (one per discount type)
- **Indexes**: Clustered on `(Project_ID, Product_Option_Price_ID)`

#### `vw_Custom_Project_Registration_Income`
- **Purpose**: Pre-aggregates registration income grouped by event
- **Replaces**: ~8 correlated subqueries (one per event)
- **Indexes**: Clustered on `(Project_ID, Event_ID)`

### 2. Optimized Stored Procedure (`api_Custom_GetProjectBudgetDetails_JSON_optimized.sql`)

Updated version of the stored procedure that:
- Uses `LEFT JOIN` to indexed views instead of correlated subqueries
- Eliminates ~76 aggregate calculations per request
- Maintains identical JSON output structure (no breaking changes)

## Key Optimizations Applied

### Before (Lines 111-115 of original)
```sql
(
    SELECT ISNULL(SUM(pbt.Amount), 0)
    FROM Project_Budget_Transactions pbt
    WHERE pbt.Project_Budget_Expense_Line_Item_ID = pbeli.Project_Budget_Expense_Line_Item_ID
) AS actual
```

### After (Lines 116-117 of optimized)
```sql
ISNULL(vw.Total_Actual, 0) AS actual  -- FROM INDEXED VIEW!
...
LEFT JOIN vw_Custom_Project_Budget_Expense_LineItem_Actuals vw
    ON pbeli.Project_Budget_Expense_Line_Item_ID = vw.Project_Budget_Expense_Line_Item_ID
```

## Deployment Steps

### Step 1: Deploy Indexed Views
Run the migration script on your MinistryPlatform database:

```bash
# Option 1: Using sqlcmd (Windows/macOS/Linux)
sqlcmd -S your-server -d MinistryPlatform -U your-user -P your-password \
  -i Database/Migrations/20-create-indexed-views-for-performance.sql

# Option 2: Using SQL Server Management Studio (SSMS)
# - Open the migration file
# - Connect to your database
# - Execute the script
```

**Expected Output**:
```
✓ Created indexed view: vw_Custom_Project_Budget_Expense_LineItem_Actuals
✓ Created indexed view: vw_Custom_Project_Budget_Income_LineItem_Actuals
✓ Created indexed view: vw_Custom_Project_Registration_Discounts
✓ Created indexed view: vw_Custom_Project_Registration_Income

======================================================================
Performance Optimization Phase 1 Complete
======================================================================
```

### Step 2: Deploy Optimized Stored Procedure
Replace the existing stored procedure with the optimized version:

```bash
# Option 1: Using sqlcmd
sqlcmd -S your-server -d MinistryPlatform -U your-user -P your-password \
  -i Database/StoredProcs/api_Custom_GetProjectBudgetDetails_JSON_optimized.sql

# Option 2: Using SSMS
# - Open api_Custom_GetProjectBudgetDetails_JSON_optimized.sql
# - Execute the script
```

**Note**: The script uses `CREATE OR ALTER`, so it will safely replace the existing procedure.

### Step 3: Verify Deployment
```sql
-- Verify indexed views exist
SELECT name, type_desc
FROM sys.views
WHERE name LIKE 'vw_Custom_Project_%'
ORDER BY name;

-- Check indexed view indexes
SELECT
    v.name AS view_name,
    i.name AS index_name,
    i.type_desc
FROM sys.views v
INNER JOIN sys.indexes i ON v.object_id = i.object_id
WHERE v.name LIKE 'vw_Custom_Project_%'
ORDER BY v.name, i.name;

-- Test the optimized stored procedure
EXEC api_Custom_GetProjectBudgetDetails_JSON @Slug = 'winter-retreat-2025';
```

### Step 4: Run Benchmarks
After deployment, run the benchmark script to measure actual performance:

```bash
cd Database
node benchmark-stored-procs.js
```

Compare the new results in `Database/benchmark-results/_benchmark_summary.json` to the previous run.

## Expected Results

| Metric | Before | Expected After | Improvement |
|--------|--------|----------------|-------------|
| `api_Custom_GetProjectBudgetDetails_JSON` | 1358ms | ~950-1100ms | 20-30% |
| Correlated subqueries executed | ~76 | 0 | 100% |
| Database I/O operations | High | Low | Significant |

## Files Modified

- ✅ `Database/Migrations/20-create-indexed-views-for-performance.sql` (NEW)
- ✅ `Database/StoredProcs/api_Custom_GetProjectBudgetDetails_JSON_optimized.sql` (NEW)

## Next Steps

### If Performance Meets Goals (< 500ms)
- ✅ **Done!** No Phase 2 needed
- Update `PERFORMANCE_ANALYSIS.md` with actual results
- Consider applying similar optimizations to other slow procedures

### If Performance Still Needs Improvement
**Proceed to Phase 2**: Denormalized fields with triggers
- Create computed/denormalized fields on Projects table
- Implement triggers to maintain field values
- Expected additional improvement: 50-60% (bringing total to ~70-80%)

## Technical Notes

### Why Indexed Views?
- **Materialized**: Data is physically stored and indexed
- **Auto-Updated**: SQL Server maintains views automatically on data changes
- **Query Optimizer**: May use views even when not explicitly referenced
- **Minimal Code Changes**: Just replace subqueries with JOINs

### Indexed View Requirements
All views use `WITH SCHEMABINDING` and meet SQL Server requirements:
- ✅ No `SELECT *`
- ✅ All columns are deterministic
- ✅ `COUNT_BIG(*)` for aggregate views
- ✅ Explicit schema names (`dbo.Table_Name`)
- ✅ Unique clustered index on each view

### Maintenance Considerations
- **Index Maintenance**: Indexed views require additional storage and update overhead
- **Performance Trade-off**: Slower writes for much faster reads (acceptable for this use case)
- **Statistics**: SQL Server automatically maintains statistics on indexed views

## Rollback Plan

If issues arise, revert to the original stored procedure:

```sql
-- The original is still in Database/StoredProcs/api_Custom_GetProjectBudgetDetails_JSON.sql
-- Just re-execute that file to restore the previous version
```

To remove the indexed views:

```sql
DROP VIEW IF EXISTS dbo.vw_Custom_Project_Budget_Expense_LineItem_Actuals;
DROP VIEW IF EXISTS dbo.vw_Custom_Project_Budget_Income_LineItem_Actuals;
DROP VIEW IF EXISTS dbo.vw_Custom_Project_Registration_Discounts;
DROP VIEW IF EXISTS dbo.vw_Custom_Project_Registration_Income;
```

---

**Status**: ✅ Ready for deployment and testing
**Created**: 2025-12-11
**Related**: `Database/PERFORMANCE_ANALYSIS.md`
