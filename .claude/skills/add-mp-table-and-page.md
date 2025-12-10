# Add MinistryPlatform Table and Page Registration

You are a specialized assistant for registering database tables as pages in MinistryPlatform and granting API access.

## Your Task

When the user provides a table name and details, you will:

1. **Add Domain_ID column** to the table (if not present)
2. **Create dp_Pages record** to register the table in MinistryPlatform
3. **Grant Administrator role permissions** via `dp_Role_Pages` for API access
4. **Execute the SQL** using the Database run-sql.js script

## Default Values

- **Default Role ID**: 2 (Administrators)
- **Default Domain ID**: 1
- **Database script path**: `/Users/coltonwirgau/MinistryPlatform/Database`
- **Administrator Access Level**: 3 (Full access - read/write/delete)
- **Standard Permissions**:
  - Scope_All: 0
  - Approver: 0
  - File_Attacher: 1
  - Data_Importer: 0
  - Data_Exporter: 1
  - Secure_Records: 0
  - Allow_Comments: 0
  - Quick_Add: 0

## User Input Required

Ask the user for:

1. **Table name** (e.g., "Project_Budget_Categories")
2. **Display name** (plural, e.g., "Project Budget Categories")
3. **Singular name** (e.g., "Project Budget Category")
4. **Primary key column name** (usually `{Table_Name_Singular}_ID`)
5. **View order** (1-999 for main tables, 700+ for lookup tables)
6. **Default field list** - comma-separated list of fields to display, use `Table_ID_Table.Field` for foreign keys
7. **Selected record expression** - how to display a selected record (usually the name/title field)

## SQL Template

```sql
-- =============================================
-- Add Table [TABLE_NAME] to MinistryPlatform
-- Date: [DATE]
-- Description: Register [TABLE_NAME] as a page and grant API access
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Registering [TABLE_NAME] in MinistryPlatform...'

-- Step 1: Add Domain_ID if not present
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[TABLE_NAME]') AND name = 'Domain_ID')
BEGIN
    PRINT 'Adding Domain_ID to [TABLE_NAME]...'
    ALTER TABLE dbo.[TABLE_NAME] ADD Domain_ID INT NOT NULL DEFAULT 1;

    ALTER TABLE dbo.[TABLE_NAME] ADD CONSTRAINT FK_[TABLE_NAME]_Domain
        FOREIGN KEY (Domain_ID) REFERENCES dbo.dp_Domains(Domain_ID);

    PRINT 'Domain_ID added to [TABLE_NAME].'
END
ELSE
    PRINT 'Domain_ID already exists in [TABLE_NAME].'

-- Step 2: Create dp_Pages record
IF NOT EXISTS (SELECT 1 FROM dp_Pages WHERE Table_Name = '[TABLE_NAME]')
BEGIN
    PRINT 'Creating dp_Pages record for [TABLE_NAME]...'
    INSERT INTO dp_Pages (
        Display_Name,
        Singular_Name,
        View_Order,
        Table_Name,
        Primary_Key,
        Default_Field_List,
        Selected_Record_Expression,
        Suppress_New_Button,
        Display_Copy
    ) VALUES (
        '[DISPLAY_NAME]',
        '[SINGULAR_NAME]',
        [VIEW_ORDER],
        '[TABLE_NAME]',
        '[PRIMARY_KEY]',
        '[DEFAULT_FIELD_LIST]',
        '[SELECTED_RECORD_EXPRESSION]',
        0,
        1
    );
    PRINT 'dp_Pages record created for [TABLE_NAME].'
END
ELSE
    PRINT 'dp_Pages record already exists for [TABLE_NAME].'

-- Step 3: Grant Administrator role permissions
DECLARE @PageID INT;
SELECT @PageID = Page_ID FROM dp_Pages WHERE Table_Name = '[TABLE_NAME]';

IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = 2 AND Page_ID = @PageID)
BEGIN
    PRINT 'Adding [TABLE_NAME] to Administrator role...'
    INSERT INTO dp_Role_Pages (
        Role_ID,
        Page_ID,
        Access_Level,
        Scope_All,
        Approver,
        File_Attacher,
        Data_Importer,
        Data_Exporter,
        Secure_Records,
        Allow_Comments,
        Quick_Add
    ) VALUES (
        2,
        @PageID,
        3,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0
    );
    PRINT '[TABLE_NAME] added to Administrator role.'
END
ELSE
    PRINT '[TABLE_NAME] already has Administrator role permissions.'

-- Step 4: Verify registration
PRINT ''
PRINT 'Verification:'
SELECT
    p.Page_ID,
    p.Display_Name,
    p.Table_Name,
    rp.Access_Level,
    r.Role_Name
FROM dp_Pages p
LEFT JOIN dp_Role_Pages rp ON p.Page_ID = rp.Page_ID
LEFT JOIN dp_Roles r ON rp.Role_ID = r.Role_ID
WHERE p.Table_Name = '[TABLE_NAME]';

PRINT ''
PRINT '[TABLE_NAME] registration complete!'
GO
```

## Execution Steps

1. **Generate SQL file** at `/Users/coltonwirgau/MinistryPlatform/Database/add-table-[safe-table-name].sql`
   - Use lowercase, replace underscores with hyphens for filename

2. **Execute using run-sql.js**:
   ```bash
   cd /Users/coltonwirgau/MinistryPlatform/Database
   node run-sql.js add-table-[safe-table-name].sql
   ```

3. **Report results** to user:
   - Show verification query output
   - Provide the API endpoint URL: `https://my.woodsidebible.org/ministryplatformapi/tables/[TABLE_NAME]`
   - Inform that the table is now accessible via MinistryPlatform API

## Important Notes

- **Domain_ID is required** for all custom tables to work with MinistryPlatform's multi-tenancy
- **Access Level values**:
  - 0 = No access
  - 1 = Read only
  - 2 = Read and Create
  - 3 = Full access (Read, Create, Update, Delete)
- **View Order conventions**:
  - 1-999: Main tables
  - 700+: Lookup tables
  - Lower numbers appear first in UI
- **Default Field List tips**:
  - Use comma-separated list: `Field1, Field2, Field3`
  - Reference FK tables: `FK_Table_ID_Table.Field_Name AS [Display Name]`
  - Example: `Project_ID_Table.Project_Title, Category_Name, Budgeted_Amount`
- **Selected Record Expression**:
  - Used for displaying a selected record (usually the name/title field)
  - Example: `Project_Budget_Categories.Category_Name`
  - Can use FK: `Project_ID_Table.Project_Title`

## Default Field List Examples

**For a table with foreign keys:**
```
Project_ID_Table.Project_Title,
Category_Type_ID_Table.Category_Type,
Project_Budget_Categories.Budgeted_Amount,
Project_Budget_Categories.Sort_Order
```

**For a lookup table:**
```
Project_Budget_Statuses.Status_Name,
Project_Budget_Statuses.Description,
Project_Budget_Statuses.Sort_Order,
Project_Budget_Statuses.Display_Color
```

**For a transaction table:**
```
Project_ID_Table.Project_Title,
Project_Budget_Transactions.Transaction_Date,
Project_Budget_Transactions.Transaction_Type,
Project_Budget_Transactions.Payee_Name,
Project_Budget_Transactions.Amount,
Payment_Method_ID_Table.Payment_Method_Name
```

## Example Workflow

User: "Add my Project_Budget_Categories table to MP"

You should:
1. Ask for display name, singular name, view order, etc.
2. Generate and save SQL file
3. Execute the SQL
4. Report success with API endpoint URL

## Additional Role Permissions (Optional)

If the user wants to grant access to additional roles beyond Administrators:

```sql
-- Grant permissions to additional role
IF NOT EXISTS (SELECT 1 FROM dp_Role_Pages WHERE Role_ID = [ROLE_ID] AND Page_ID = @PageID)
BEGIN
    INSERT INTO dp_Role_Pages (Role_ID, Page_ID, Access_Level, Scope_All, Approver, File_Attacher, Data_Importer, Data_Exporter, Secure_Records, Allow_Comments, Quick_Add)
    VALUES ([ROLE_ID], @PageID, [ACCESS_LEVEL], 0, 0, 1, 0, 1, 0, 0, 0);
    PRINT 'Permission granted to role [ROLE_ID]';
END
```

Common role IDs:
- 2 = Administrators (full access)
- 17 = Users (typically read-only or limited)
- 18 = Group Leaders (typically read-only or limited)
