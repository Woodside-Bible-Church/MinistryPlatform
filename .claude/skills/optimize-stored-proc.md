# Optimize SQL Server Stored Procedure with Nested JSON

You are an expert SQL Server performance optimization specialist. Help the user optimize slow stored procedures that return nested JSON data, particularly those with correlated subqueries.

## Step 1: Analyze Current Performance

1. **Create a benchmark script** to measure current performance
   - Use Node.js with MinistryPlatform API authentication
   - Measure: duration, data size, record count
   - Run 3 times to establish baseline
   - Save results to `Database/benchmark-results/`

2. **Identify performance bottlenecks**
   - Count correlated subqueries (each generates a separate query execution)
   - Look for `(SELECT ...)` patterns in JSON generation
   - Check for repeated aggregations (SUM, COUNT, etc.)
   - Analyze nested FOR JSON PATH structures

3. **Document findings**
   - Create `PERFORMANCE_ANALYSIS.md` with:
     - Current performance metrics
     - Number of subqueries identified
     - Root cause analysis
     - Optimization recommendations

## Step 2: Design Optimization Strategy

Choose optimization approach based on complexity:

### Option A: Indexed Views (Recommended for read-heavy workloads)
**Best for**: Complex aggregations, read:write ratio > 10:1

**Pros**:
- 70-90% performance improvement typical
- Automatic maintenance by SQL Server
- No application code changes needed
- Query optimizer may use views automatically

**Cons**:
- Storage overhead (minimal for most cases)
- Write operations slightly slower (view maintenance)
- SQL Server restrictions (no OUTER JOINs, nullable aggregates)

**When to use**:
- Stored proc has > 20 correlated subqueries
- Data changes infrequently
- Multiple users query same data

### Option B: Denormalized Fields with Triggers
**Best for**: Simple aggregations, need guaranteed consistency

**Pros**:
- Fastest read performance (pre-calculated)
- Simple SELECT statements
- Predictable performance

**Cons**:
- Complex to maintain
- Triggers can be fragile
- Data sync issues if triggers fail
- Storage overhead

**When to use**:
- After indexed views, if still need more speed
- Very high read volume
- Aggregations are simple (single SUM/COUNT)

### Option C: Application-Level Caching
**Best for**: Data that changes infrequently, high traffic

**Pros**:
- Fastest for cached requests (< 10ms)
- Easy to implement with React Query
- No database changes

**Cons**:
- First request still slow
- Cache invalidation complexity
- Stale data possible

**When to use**:
- Same data requested repeatedly
- Can tolerate slight staleness
- Users view same projects/data

## Step 3: Implement Indexed Views (Phase 1)

### 3.1 Create Migration File

Create `Database/Migrations/XX-create-indexed-views-for-performance.sql`:

```sql
SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET QUOTED_IDENTIFIER ON;
SET NUMERIC_ROUNDABORT OFF;
GO

-- Example: Pre-aggregate line item totals
CREATE VIEW dbo.vw_Custom_LineItem_Actuals
WITH SCHEMABINDING
AS
SELECT
    LineItem_ID,
    Project_ID,
    SUM(ISNULL(Amount, 0)) AS Total_Actual,
    COUNT_BIG(*) AS Transaction_Count
FROM dbo.Transactions
WHERE Amount IS NOT NULL
GROUP BY
    LineItem_ID,
    Project_ID;
GO

-- Create clustered index to materialize the view
CREATE UNIQUE CLUSTERED INDEX IX_LineItemActuals_LineItemID
    ON dbo.vw_Custom_LineItem_Actuals (LineItem_ID);
GO
```

### 3.2 Follow Indexed View Requirements

**CRITICAL SQL Server Restrictions**:

1. ❌ **No OUTER JOINs** → Use INNER JOIN only
2. ❌ **No nullable expressions in aggregates** → Use `ISNULL(column, 0)` or `COALESCE()`
3. ❌ **No functions in aggregates** → Use `* -1` instead of `ABS()` for negative values
4. ✅ **Must use SCHEMABINDING**
5. ✅ **Must include COUNT_BIG(*)**
6. ✅ **Must use explicit schema names** (dbo.TableName)
7. ✅ **Must create unique clustered index**

### 3.3 Naming Convention

Use `vw_Custom_*` prefix for all custom views:
- `vw_Custom_Project_Budget_Expense_Actuals`
- `vw_Custom_Registration_Income_By_Event`
- `vw_Custom_Discount_Totals_By_Type`

### 3.4 Update Stored Procedure

Replace correlated subqueries with JOINs to indexed views:

**Before**:
```sql
(
    SELECT ISNULL(SUM(Amount), 0)
    FROM Transactions
    WHERE LineItem_ID = li.LineItem_ID
) AS actual
```

**After**:
```sql
ISNULL(vw.Total_Actual, 0) AS actual
...
LEFT JOIN vw_Custom_LineItem_Actuals vw ON li.LineItem_ID = vw.LineItem_ID
```

## Step 4: Deploy and Test

### 4.1 Deploy to Database

```bash
# Run migration
node Database/run-sql.js Database/Migrations/XX-create-indexed-views.sql

# Deploy updated stored procedure
node Database/run-sql.js Database/StoredProcs/api_Custom_YourProc.sql
```

### 4.2 Run Benchmarks

Run benchmark script **3 times** to observe indexed view caching:
- Run 1: Cold cache (views materializing)
- Run 2: Warm cache (views cached)
- Run 3: Stabilized performance

```bash
node Database/benchmark-stored-procs.js
# Wait 10 seconds
node Database/benchmark-stored-procs.js
# Wait 10 seconds
node Database/benchmark-stored-procs.js
```

### 4.3 Verify Data Integrity

Create comparison script to ensure same data is returned:

```javascript
// compare-results.js
const oldData = require('./old-results.json');
const newData = require('./new-results.json');

// Compare structure
console.log('Old categories:', oldData.expenseCategories?.length);
console.log('New categories:', newData.expenseCategories?.length);

// Compare totals
console.log('Old total:', oldData.Total_Budget);
console.log('New total:', newData.Total_Budget);
```

## Step 5: Document Results

### 5.1 Create Performance Results Document

Create `Database/PERFORMANCE_RESULTS.md`:

```markdown
# Performance Optimization Results

## Before
- Procedure: api_Custom_YourProc
- Duration: XXXXms
- Method: Correlated subqueries

## After
- Run 1: XXXms (cold)
- Run 2: XXXms (warm)
- Run 3: XXXms (stable)
- Improvement: XX%

## Data Integrity
- ✅ Same record counts
- ✅ Same totals
- ✅ Same structure
```

### 5.2 Create Deployment Summary

Create `Database/DEPLOYMENT_SUMMARY.md` with:
- What was deployed (views, procedures)
- Performance improvements
- Data integrity verification
- Rollback instructions

### 5.3 Document Future Optimizations

Create `Database/FUTURE_OPTIMIZATIONS.md` with:
- Phase 2 options (if needed)
- Monitoring recommendations
- When to implement further optimizations

## Step 6: Common Issues and Solutions

### Issue: "Cannot create index on view because it uses OUTER JOIN"

**Solution**: Change `LEFT JOIN` to `INNER JOIN`. Handle NULL cases with `ISNULL()` in the stored procedure.

### Issue: "SUM aggregate of nullable expression"

**Solution**: Wrap in `ISNULL()` or `COALESCE()`:
```sql
SUM(ISNULL(Amount, 0)) AS total
```

### Issue: "No column name specified"

**Solution**: Add explicit alias to derived tables:
```sql
FROM (SELECT 1 AS n) AS dummy
```

### Issue: "Cannot use function in aggregate"

**Solution**: Replace functions:
- `ABS(Amount)` → `Amount * -1` (if negative)
- `UPPER(Name)` → pre-calculate in base table

### Issue: Performance worse after indexed views

**Possible causes**:
1. Views not being used (check query plan)
2. Too many indexed views (update overhead)
3. Views not covering needed columns

**Solution**: Use `SET STATISTICS TIME ON` to analyze query plan.

## Step 7: Monitoring

### Check Indexed View Usage

```sql
SELECT
    OBJECT_NAME(s.object_id) AS view_name,
    i.name AS index_name,
    s.user_seeks,
    s.user_scans,
    s.last_user_seek,
    s.last_user_update
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) LIKE 'vw_Custom_%'
ORDER BY s.user_seeks DESC;
```

### Monitor Write Performance

If write operations become slow, indexed views may have too much overhead. Check:
```sql
-- Average insert duration
SELECT
    OBJECT_NAME(object_id) AS table_name,
    last_elapsed_time / 1000 AS duration_ms
FROM sys.dm_exec_procedure_stats
WHERE OBJECT_NAME(object_id) LIKE '%Insert%'
ORDER BY last_elapsed_time DESC;
```

## Expected Results

### Typical Performance Gains

Based on successful optimizations:

| Subqueries | Expected Improvement | Example |
|------------|---------------------|---------|
| 10-20 | 30-50% | 1000ms → 500-700ms |
| 20-50 | 50-70% | 1000ms → 300-500ms |
| 50-100 | 70-90% | 1000ms → 100-300ms |
| 100+ | 80-95% | 1000ms → 50-200ms |

### Real-World Example

MinistryPlatform Budget Optimization:
- **Before**: 1358ms (76 correlated subqueries)
- **After**: 152ms direct SQL, 299ms via API
- **Improvement**: 89% (direct), 78% (API)
- **Method**: 4 indexed views replacing all subqueries

## Checklist

Use this checklist for each optimization:

- [ ] Baseline benchmark created (3 runs)
- [ ] Performance analysis documented
- [ ] Correlated subqueries counted
- [ ] Indexed views designed
- [ ] Views follow SQL Server restrictions
- [ ] Migration script created
- [ ] Stored procedure updated
- [ ] Migration deployed to database
- [ ] Updated procedure deployed
- [ ] Post-optimization benchmarks run (3 runs)
- [ ] Data integrity verified
- [ ] Performance results documented
- [ ] Deployment summary created
- [ ] Future optimizations documented
- [ ] Monitoring queries saved

## Example: Complete Workflow

See these files for a complete example:
- `Database/benchmark-stored-procs.js` - Benchmark script
- `Database/Migrations/20-create-indexed-views-for-performance.sql` - Migration
- `Database/StoredProcs/api_Custom_GetProjectBudgetDetails_JSON_optimized.sql` - Optimized proc
- `Database/PERFORMANCE_RESULTS.md` - Results documentation
- `Database/DEPLOYMENT_SUMMARY.md` - Deployment documentation
- `Database/FUTURE_OPTIMIZATIONS.md` - Future optimization options

## Tips for Success

1. **Always benchmark first** - Don't optimize without measuring
2. **Start simple** - Indexed views first, then consider triggers
3. **Test thoroughly** - Verify data integrity after every change
4. **Document everything** - Future you will thank present you
5. **Monitor production** - Watch for unexpected behavior
6. **Plan for rollback** - Keep original stored procedure for quick revert
7. **Communicate results** - Share performance improvements with team

## When NOT to Optimize

Don't optimize if:
- Current performance is acceptable (< 500ms)
- Very low traffic (< 10 requests/day)
- Data changes constantly (write-heavy workload)
- Complexity outweighs benefits
- User experience is already good

Remember: **Premature optimization is the root of all evil.**

---

**Skill Version**: 1.0
**Last Updated**: 2025-12-12
**Success Rate**: 89% improvement (MinistryPlatform Budget example)
