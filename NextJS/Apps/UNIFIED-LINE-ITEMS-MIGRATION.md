# Unified Line Items Migration Guide

## Overview
This migration consolidates the separate `Project_Budget_Expense_Line_Items` and `Project_Budget_Income_Line_Items` tables into a single unified `Project_Budget_Line_Items` table. This simplifies the codebase and aligns with the database schema proposal.

## Why This Migration?
- **Simpler Code**: One table means less conditional logic based on transaction type
- **Better Schema**: Follows normalized database design principles
- **Easier Maintenance**: Fewer tables to manage and maintain
- **Consistent API**: Unified line item IDs across all transactions

## What's Changed

### Database Schema
| Old Structure | New Structure |
|--------------|---------------|
| `Project_Budget_Expense_Line_Items` | `Project_Budget_Line_Items` (unified) |
| `Project_Budget_Income_Line_Items` | *(deleted)* |
| `Project_Budget_Transactions.Project_Budget_Expense_Line_Item_ID` | `Project_Budget_Transactions.Project_Budget_Line_Item_ID` |
| `Project_Budget_Transactions.Project_Budget_Income_Line_Item_ID` | *(deleted)* |

### Code Changes
✅ **Completed:**
- Transaction API routes (POST, PATCH, DELETE)
- Line items API route (DELETE transaction check)
- TypeScript interfaces
- Frontend transaction page
- Optimistic UI updates
- All FK references removed from code

⏳ **You Need To Do:**
- Run SQL migration script
- Update stored procedure `api_Custom_GetProjectBudgetDetails_JSON`
- Delete old tables in MP Admin (after testing)

## Migration Steps

### Prerequisites
1. **Backup your database** - This is critical!
2. **Test in non-production environment first**
3. **Verify all users are logged out** (or at least not using budgets app)
4. **Have rollback script ready** (provided)

### Step 1: Run SQL Migration
```sql
-- File: database-migration-unified-line-items.sql
-- Run this in MinistryPlatform SQL Server
```

The migration script will:
1. Add new `Project_Budget_Line_Item_ID` column
2. Migrate existing data from old columns
3. Verify data migration succeeded
4. Add FK constraint to unified table
5. Drop old FK constraints
6. Drop old columns

**Expected Duration:** 1-5 minutes depending on data volume

### Step 2: Verify Migration
Run these verification queries:

```sql
-- Check new column is populated
SELECT COUNT(*) AS MigratedCount
FROM Project_Budget_Transactions
WHERE Project_Budget_Line_Item_ID IS NOT NULL

-- Check old columns are gone
SELECT name
FROM sys.columns
WHERE object_id = OBJECT_ID('Project_Budget_Transactions')
ORDER BY name

-- Verify FK constraint exists
SELECT name, is_disabled
FROM sys.foreign_keys
WHERE name = 'FK_Project_Budget_Transactions_Line_Items'
```

### Step 3: Update Stored Procedure
See `stored-procedure-update-guide.md` for detailed instructions.

Key changes needed:
- Query from `Project_Budget_Line_Items` instead of separate tables
- Filter by `Category_Type` to separate expense vs revenue
- Update transaction joins to use new column name

### Step 4: Test the Application
1. **Navigate to budgets app** - Does it load?
2. **View transactions list** - Do line items display correctly?
3. **Create expense transaction** - Does it save and link to line item?
4. **Create income transaction** - Does it save and link to line item?
5. **Edit transaction** - Can you change the line item?
6. **Delete transaction** - Does it delete successfully?
7. **View budget details** - Do expense and income categories show line items?

### Step 5: Clean Up Old Tables (After Testing)
**⚠️ ONLY AFTER THOROUGH TESTING:**

In MinistryPlatform Admin:
1. Delete `Project_Budget_Expense_Line_Items` page
2. Delete `Project_Budget_Income_Line_Items` page
3. Delete `Project_Budget_Expense_Line_Items` table
4. Delete `Project_Budget_Income_Line_Items` table

**Note:** MP will prevent you from deleting tables that have FK constraints, so the migration script must complete first.

## Rollback Procedure
If something goes wrong, run the rollback script:

```sql
-- File: database-migration-rollback.sql
-- This restores the old columns and data
```

Then:
1. Revert code changes (git revert)
2. Restart application
3. Restore stored procedure from backup

## Files Included

### SQL Scripts
- `database-migration-unified-line-items.sql` - Main migration script
- `database-migration-rollback.sql` - Rollback if needed

### Documentation
- `stored-procedure-update-guide.md` - How to update the SP
- `UNIFIED-LINE-ITEMS-MIGRATION.md` - This file

### Code Changes
All code changes are already committed:
- `/src/app/api/projects/[id]/transactions/route.ts`
- `/src/app/api/projects/[id]/categories/[categoryId]/line-items/route.ts`
- `/src/app/(app)/budgets/[slug]/transactions/page.tsx`

## Data Integrity

### Migration Safety Features
- ✅ Checks if columns exist before adding
- ✅ Verifies data migration succeeded before dropping columns
- ✅ Handles NULL values correctly
- ✅ Preserves all existing transaction-line item relationships
- ✅ Prints progress messages during migration
- ✅ Uses transactions where possible

### What Data Is Migrated
- All expense transaction → line item links
- All income transaction → line item links
- NULL values remain NULL (transactions without line items)

### What Data Is NOT Affected
- Transaction amounts
- Transaction dates
- Transaction descriptions
- Payment methods
- Any other transaction fields
- Project data
- Category data
- Line item data

## Troubleshooting

### Issue: Migration fails with FK constraint error
**Cause:** Old FK constraints still exist
**Fix:** Manually drop FK constraints first, then re-run migration

### Issue: Data migration verification fails
**Cause:** Transactions exist with line item IDs that don't match the unified table
**Fix:** Check for orphaned records:
```sql
SELECT *
FROM Project_Budget_Transactions
WHERE Project_Budget_Expense_Line_Item_ID IS NOT NULL
  AND Project_Budget_Expense_Line_Item_ID NOT IN (
      SELECT Project_Budget_Line_Item_ID FROM Project_Budget_Line_Items
  )
```

### Issue: Stored procedure returns empty line items
**Cause:** SP not updated to query unified table or wrong filter
**Fix:** See `stored-procedure-update-guide.md`

### Issue: Frontend shows "Income" dropdown is empty
**Cause:** Stored procedure not returning income line items, or `incomeLineItemsCategories` is undefined
**Fix:** Verify SP returns correct JSON structure with both expense and income categories

## Success Criteria

✅ All existing transactions maintain their line item links
✅ New expense transactions can be created and linked
✅ New income transactions can be created and linked
✅ Transactions can be edited and line items changed
✅ Budget details page shows all categories and line items
✅ No errors in browser console or server logs
✅ Old tables can be safely deleted from MP Admin

## Support
If you encounter issues:
1. Check the troubleshooting section above
2. Review the verification queries
3. Check browser console and server logs
4. Run the rollback script if needed

## Questions to Consider
- Are there any other tables or stored procedures that reference the old line item tables?
- Do any reports or dashboards query the old tables directly?
- Are there any scheduled jobs or integrations that might be affected?

Check with:
```sql
-- Find all references to old tables
SELECT
    OBJECT_NAME(referencing_id) AS ReferencingObject,
    o.type_desc AS ObjectType
FROM sys.sql_expression_dependencies sed
INNER JOIN sys.objects o ON sed.referencing_id = o.object_id
WHERE referenced_entity_name IN (
    'Project_Budget_Expense_Line_Items',
    'Project_Budget_Income_Line_Items'
)
ORDER BY o.type_desc, OBJECT_NAME(referencing_id)
```
