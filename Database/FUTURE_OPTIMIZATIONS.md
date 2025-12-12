# Future Optimization Opportunities

## Current Performance Status

✅ **Phase 1 Complete**: 78% improvement (1358ms → 299ms API response)

Current performance is **excellent** for production use. The optimizations below are **optional** and only needed if sub-200ms response times are required.

---

## Phase 2: Denormalized Fields with Triggers (Optional)

**Expected Additional Gain**: 30-40% (299ms → ~180-210ms)

### Implementation

Add pre-calculated fields to the `Projects` table:

```sql
ALTER TABLE Projects ADD
    _Total_Actual_Expenses MONEY NULL,
    _Total_Actual_Income MONEY NULL,
    _Total_Expected_Income MONEY NULL,
    _Last_Budget_Calculation_Date DATETIME NULL;
```

**Note**: Fields prefixed with `_` are hidden from MinistryPlatform UI.

### Triggers Needed

1. **Update on Expense Transactions**
```sql
CREATE TRIGGER trg_UpdateProjectExpenseTotals
ON Project_Budget_Transactions
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    UPDATE p
    SET
        p._Total_Actual_Expenses = (
            SELECT ISNULL(SUM(Amount), 0)
            FROM Project_Budget_Transactions
            WHERE Project_ID = p.Project_ID
                AND Transaction_Type = 'Expense'
        ),
        p._Last_Budget_Calculation_Date = GETDATE()
    FROM Projects p
    WHERE p.Project_ID IN (
        SELECT DISTINCT Project_ID FROM inserted
        UNION
        SELECT DISTINCT Project_ID FROM deleted
    );
END;
```

2. **Update on Income Transactions** (similar pattern)
3. **Update on Registration Income** (when Invoice_Detail changes)

### Pros
- Fastest possible read performance
- No aggregate calculations at query time
- Simple SELECT statements in stored procedures

### Cons
- Additional storage (minimal - a few KB per project)
- Triggers add overhead to write operations
- More complex to maintain
- Data can become out of sync if triggers fail

### When to Implement
- When API response time needs to be < 200ms
- When read operations far outnumber writes (100:1 ratio or higher)
- When indexed view maintenance overhead becomes noticeable

---

## Phase 3: Caching Strategy (Low Effort, High Impact)

**Expected Gain**: Varies (first load still ~299ms, cached loads < 10ms)

### Implementation Options

#### Option A: React Query (Frontend Caching)
Already implemented in the Apps! Just configure appropriate stale times:

```typescript
const { data } = useQuery({
  queryKey: ['projectBudget', projectId],
  queryFn: () => fetchProjectBudget(projectId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
});
```

**Pros**: No server changes, instant subsequent loads
**Cons**: Cache per user, not shared across users

#### Option B: API-Level Caching (Redis/Memory Cache)
Add caching layer in Next.js API routes:

```typescript
// pages/api/projects/[id]/budget.ts
import { cache } from '@/lib/cache';

export default async function handler(req, res) {
  const cacheKey = `project:${req.query.id}:budget`;

  let data = await cache.get(cacheKey);
  if (!data) {
    data = await fetchFromMP();
    await cache.set(cacheKey, data, { ttl: 300 }); // 5 min TTL
  }

  res.json(data);
}
```

**Pros**: Shared cache across all users, reduces MP API calls
**Cons**: Requires Redis/cache infrastructure, cache invalidation complexity

#### Option C: HTTP Cache Headers
Let browsers cache responses:

```typescript
res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
```

**Pros**: Zero infrastructure, works with CDN
**Cons**: Per-user cache, not suitable for frequently changing data

### Recommended Approach
Use **Option A (React Query)** - it's already in the codebase and provides the best balance of simplicity and performance.

---

## Phase 4: Database Indexing Review

**Expected Gain**: 5-10% (if missing indices found)

### Indices to Verify

```sql
-- Check if these indices exist and are used
SELECT
    i.name AS index_name,
    OBJECT_NAME(i.object_id) AS table_name,
    COL_NAME(ic.object_id, ic.column_id) AS column_name,
    i.type_desc
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
WHERE OBJECT_NAME(i.object_id) IN (
    'Project_Budget_Transactions',
    'Project_Budget_Expense_Line_Items',
    'Project_Budget_Income_Line_Items',
    'Invoice_Detail',
    'Event_Participants'
)
ORDER BY table_name, index_name;
```

### Recommended Indices

1. **Project_Budget_Transactions**
   - ✅ Already covered by indexed views

2. **Invoice_Detail**
   - Check: `(Event_Participant_ID, Line_Total)` for registration income
   - Check: `(Product_Option_Price_ID, Line_Total)` for discounts

3. **Event_Participants**
   - Check: `(Event_ID, Event_Participant_ID)` covering index

### How to Check
Run the query above and compare with indexed view definitions to ensure no missing indices.

---

## Phase 5: Stored Procedure Refactoring

**Expected Gain**: 10-15% (marginal improvements)

### Potential Improvements

1. **Reduce FOR JSON nesting depth**
   - Currently: 4-5 levels deep
   - Consider: Flatter structure with client-side normalization

2. **Separate registration data into own endpoint**
   - Split `registrationDiscountsCategory` and `registrationIncomeCategory`
   - Load in parallel on frontend
   - Reduces single-query complexity

3. **Pagination for large line item lists**
   - If projects have > 100 line items
   - Load first 20, lazy-load rest
   - Reduces initial payload

### Example: Split Registration Data

```typescript
// Instead of one large query:
const budget = await fetchProjectBudget(id);

// Split into parallel requests:
const [budget, registrationData] = await Promise.all([
  fetchProjectBudget(id),
  fetchProjectRegistrations(id)
]);
```

---

## Phase 6: SQL Server Query Plan Analysis

**Expected Gain**: Diagnostic tool, not guaranteed improvement

### How to Analyze

```sql
-- Enable query statistics
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

-- Run the procedure
EXEC api_Custom_GetProjectBudgetDetails_JSON @Slug = 'winter-retreat-2025';

-- Analyze execution plan in SSMS
```

### What to Look For
- Table scans (should be index seeks)
- High logical reads
- Expensive operators (> 10% of query cost)
- Missing index suggestions

### Tools
- SQL Server Management Studio (SSMS) execution plan viewer
- `sys.dm_exec_query_stats` for historical performance
- SQL Server Profiler for detailed tracing

---

## Monitoring Recommendations

### Track These Metrics

1. **API Response Time**
   - Monitor: 95th percentile response time
   - Alert if: > 500ms
   - Current: ~299ms average

2. **Indexed View Maintenance Overhead**
   - Monitor: Write operation duration
   - Alert if: Inserts/updates take > 200ms
   - Check: `sys.dm_db_index_usage_stats`

3. **Cache Hit Rate** (if implementing caching)
   - Target: > 80% hit rate
   - Monitor: Cache misses vs. hits

4. **User-Perceived Performance**
   - Monitor: Time to Interactive (TTI) on budget pages
   - Target: < 1 second for full page render
   - Current: Likely ~400-600ms (300ms API + 100-300ms frontend)

### Monitoring Query

```sql
-- Check indexed view usage
SELECT
    OBJECT_NAME(s.object_id) AS view_name,
    i.name AS index_name,
    s.user_seeks,
    s.user_scans,
    s.user_lookups,
    s.user_updates,
    s.last_user_seek,
    s.last_user_update
FROM sys.dm_db_index_usage_stats s
INNER JOIN sys.indexes i ON s.object_id = i.object_id AND s.index_id = i.index_id
WHERE OBJECT_NAME(s.object_id) LIKE 'vw_Custom_Project_%'
ORDER BY OBJECT_NAME(s.object_id);
```

---

## Decision Matrix: When to Implement Each Phase

| Phase | Implement When | Effort | Expected Gain |
|-------|---------------|--------|---------------|
| **Phase 2: Denormalized Fields** | API response > 300ms consistently | High (1-2 days) | 30-40% |
| **Phase 3: Caching** | Multiple users viewing same data | Low (2-4 hours) | 90%+ (cached) |
| **Phase 4: Index Review** | Query plan shows table scans | Medium (4-8 hours) | 5-10% |
| **Phase 5: Refactoring** | Budget data structure too complex | High (2-3 days) | 10-15% |
| **Phase 6: Query Analysis** | Performance unexpectedly degrades | Low (1-2 hours) | Diagnostic |

---

## Current Recommendation

**✅ No further optimization needed at this time.**

Current performance (299ms average) is excellent for production use. Monitor for 30 days and only implement additional phases if:

1. **User complaints** about slow budget pages
2. **Monitoring shows** > 500ms response times regularly
3. **Scale increases** significantly (10x more projects/transactions)

---

## Notes

- All optimization phases are **optional** and incremental
- Phase 1 (indexed views) already delivered **78% improvement**
- Further optimizations provide **diminishing returns**
- Always measure before and after any changes
- User experience is already excellent with current performance

---

**Last Updated**: 2025-12-12
**Current Performance**: 299ms avg (78% improvement from baseline)
**Status**: ✅ Production-ready, no immediate action needed
