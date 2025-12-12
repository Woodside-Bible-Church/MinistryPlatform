# Budget System Performance Analysis

## Executive Summary

Performance benchmarking of budget-related stored procedures reveals a significant bottleneck in the `api_Custom_GetProjectBudgetDetails_JSON` procedure, which takes **1.7 seconds** to load a single project's budget page. This is causing slow page loads throughout the budget system.

## Benchmark Results

| Procedure | Duration | Data Size | Records | Description |
|-----------|----------|-----------|---------|-------------|
| **api_Custom_GetProjectBudgetDetails_JSON** | **1690ms** ⚠️  | 14.44 KB | 1 | Budget details with nested categories/line items |
| api_Custom_GetProjectPurchaseRequests_JSON (filtered) | 345ms | 13.41 KB | 1 | Purchase requests filtered by contact |
| api_Custom_GetProjectBudgets_JSON (single) | 297ms | 0.82 KB | 1 | Single project summary |
| api_Custom_GetProjectPurchaseRequests_JSON (all) | 270ms | 17.26 KB | 1 | All purchase requests for project |
| api_Custom_GetProjectBudgets_JSON (all) | 264ms | 1.60 KB | 1 | All projects with budgets enabled |

## Key Findings

### 1. Critical Performance Issue: GetProjectBudgetDetails

**Problem**: The `api_Custom_GetProjectBudgetDetails_JSON` stored procedure is **6x slower** than other procedures.

**Root Cause**: Deeply nested JSON generation with multiple subqueries:
- Main project data
- Expense categories (7 categories)
  - Each category has multiple line items (45 line items total)
  - Each line item calculates actual amounts with subqueries
- Registration discounts broken down by discount type (17 different discount types)
- Income line items with their own subqueries (6 income sources)
- Registration income broken down by event (8 events)

**Impact**:
- Initial page load for budget details page: ~1.7 seconds
- User-perceived slowness across the entire budget system
- Poor user experience, especially on slower connections

### 2. Data Structure Analysis

The JSON returned has this structure:
```
Project (root level)
  ├── expenseCategories[] (7 categories)
  │     └── lineItems[] (avg 6 items per category)
  │           └── Subquery: SUM transactions per line item
  ├── registrationDiscountsCategory
  │     └── lineItems[] (17 discount types)
  │           └── Grouped from Invoice_Detail
  ├── incomeLineItemsCategories[] (6 income sources)
  │     └── lineItems[] (1 per income source)
  │           └── Subquery: SUM transactions per income item
  └── registrationIncomeCategory
        └── lineItems[] (8 events)
              └── Subquery: SUM per event from Invoice_Detail
```

This creates **dozens of correlated subqueries**, each scanning the transactions tables.

## Optimization Recommendations

### Option 1: Split into Multiple Faster Endpoints ⭐ **RECOMMENDED**

**Strategy**: Break the single slow endpoint into multiple fast parallel requests

**Implementation**:
1. Keep `GetProjectBudgets` for basic project info (297ms - already fast)
2. Create `GetProjectBudgetCategories` for expense categories only
3. Create separate endpoints for:
   - Registration discounts
   - Income line items
   - Registration income

**Frontend Changes**:
- Load project summary first (fast)
- Load categories, discounts, and income in parallel
- Use React Query or SWR for automatic caching
- Show loading skeletons for each section

**Expected Result**:
- Initial page render: <300ms (just project summary)
- Full page loaded: ~500-700ms (parallel requests)
- **60% improvement** in perceived performance

**Pros**:
- Immediate improvement without complex SQL optimization
- Better caching granularity
- Progressive loading for better UX
- Easy to implement

**Cons**:
- More HTTP requests
- Slightly more complex frontend code

### Option 2: Optimize Existing Stored Procedure

**Strategy**: Reduce subquery count through temp tables and joins

**Implementation**:
```sql
-- Pre-aggregate transactions once
;WITH TransactionTotals AS (
  SELECT
    Project_Budget_Expense_Line_Item_ID,
    SUM(Amount) as TotalAmount
  FROM Project_Budget_Transactions
  WHERE Project_ID = @ProjectID
    AND Transaction_Type = 'Expense'
  GROUP BY Project_Budget_Expense_Line_Item_ID
)
-- Then join to this CTE instead of subquerying for each line item
SELECT ...
FROM Project_Budget_Expense_Line_Items pbeli
LEFT JOIN TransactionTotals tt ON pbeli.Project_Budget_Expense_Line_Item_ID = tt.Project_Budget_Expense_Line_Item_ID
```

**Expected Result**: 30-50% improvement (still ~850-1200ms)

**Pros**:
- Fewer code changes needed
- Single endpoint maintained

**Cons**:
- Still slower than Option 1
- More complex SQL to maintain
- Limited improvement potential

### Option 3: Add Database Indices

**Strategy**: Ensure proper indices exist for common query patterns

**Analysis Needed**:
- Check for index on `Project_Budget_Transactions(Project_ID, Transaction_Type, Project_Budget_Expense_Line_Item_ID)`
- Check for index on `Invoice_Detail(Event_Participant_ID)`
- Check for index on `Event_Participants(Event_ID)`

**Expected Result**: 10-20% improvement

**Pros**:
- No code changes
- Benefits all queries

**Cons**:
- Limited improvement alone
- May already be optimized

## Recommended Implementation Plan

### Phase 1: Quick Win (1-2 hours)
1. Implement Option 1 - split into multiple endpoints
2. Update frontend to load data in parallel
3. Add loading states for better perceived performance

### Phase 2: Further Optimization (2-3 hours)
1. Analyze execution plans for new smaller procedures
2. Add any missing database indices (Option 3)
3. Consider computed columns for frequently calculated values

### Phase 3: Caching Strategy (1 hour)
1. Implement React Query for client-side caching
2. Set appropriate stale times for different data types
3. Add cache invalidation on data updates

## Expected Results

| Metric | Before | After Phase 1 | After Phase 2 |
|--------|--------|---------------|---------------|
| Initial page render | 1690ms | 300ms | 250ms |
| Full page loaded | 1690ms | 600ms | 400ms |
| Perceived performance | Poor | Good | Excellent |

## Files to Review

- Benchmark results: `Database/benchmark-results/`
- Slow procedure: `Database/StoredProcs/api_Custom_GetProjectBudgetDetails_JSON.sql`
- Related procedures: `Database/StoredProcs/api_Custom_GetProjectBudgets_JSON.sql`

## Next Steps

1. Review and approve optimization strategy
2. Create new API endpoints for split approach
3. Update frontend to use parallel data loading
4. Test and measure improvements
5. Apply similar optimizations to other slow pages

---

*Generated: 2025-12-11*
*Tool: Database/benchmark-stored-procs.js*
