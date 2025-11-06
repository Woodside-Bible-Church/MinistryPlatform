# Project Budgets - Database Schema Proposal

## Overview
This document outlines the proposed database tables and fields for the Project Budgets application. All names follow MinistryPlatform conventions (PascalCase with underscores, ID suffix for primary keys).

---

## Table 1: `Project_Series`
**Purpose**: Groups recurring projects together (e.g., "Winter Retreat" series for year-over-year events)

| Field Name | Data Type | Nullable | Description | Example Value |
|------------|-----------|----------|-------------|---------------|
| Project_Series_ID | INT | No | Primary key (auto-increment) | 1 |
| Series_Name | NVARCHAR(255) | No | Series display name | "Winter Retreat" |
| Series_Description | NVARCHAR(MAX) | Yes | Detailed series description | "Annual youth winter retreat" |
| Default_Coordinator_Contact_ID | INT | Yes | FK to Contacts - default for new projects | 228155 |
| Is_Active | BIT | No | Can new projects be created in this series? | 1 |
| Domain_ID | INT | No | Standard MP field for multi-tenant | 1 |

**Notes:**
- Series allow easy year-over-year project creation
- Default coordinator is optional - can be overridden per project
- Inactive series are archived but projects remain accessible
- Audit log handled by dp_Audit_Log via API

---

## Table 2: `Projects`
**Purpose**: Core project information and metadata

| Field Name | Data Type | Nullable | Description | Example Value |
|------------|-----------|----------|-------------|---------------|
| Project_ID | INT | No | Primary key (auto-increment) | 1 |
| Project_Series_ID | INT | Yes | FK to Project_Series table | 1 |
| Project_Title | NVARCHAR(255) | No | Project display name | "Winter Retreat 2026" |
| Project_Year | INT | Yes | Year for recurring projects | 2026 |
| Project_Description | NVARCHAR(MAX) | Yes | Detailed project description | "Annual youth retreat featuring..." |
| Project_Status | NVARCHAR(50) | No | Current status | "draft", "pending", "approved", "in-progress", "completed", "closed" |
| Budget_Status | NVARCHAR(50) | No | Budget health indicator | "under", "on-track", "over" |
| Project_Coordinator_Contact_ID | INT | No | FK to Contacts table | 228155 |
| Start_Date | DATE | Yes | Project start date | "2026-02-18" |
| End_Date | DATE | Yes | Project end date | "2026-02-23" |
| Total_Estimated_Revenue | DECIMAL(18,2) | No | Sum of all revenue estimates | 231839.00 |
| Total_Estimated_Expenses | DECIMAL(18,2) | No | Sum of all expense estimates | 263400.00 |
| Total_Actual_Revenue | DECIMAL(18,2) | No | Sum of all actual revenue | 0.00 |
| Total_Actual_Expenses | DECIMAL(18,2) | No | Sum of all actual expenses | 204608.00 |
| Is_Template | BIT | No | Is this a template for copying? | 0 |
| Copied_From_Project_ID | INT | Yes | FK to Projects - which project was copied | 2 |
| Domain_ID | INT | No | Standard MP field for multi-tenant | 1 |

**Notes:**
- Total amounts are calculated fields that could be computed via stored procedures
- Project_Series_ID is optional - standalone projects don't need a series
- Project_Year helps with sorting and filtering year-over-year projects
- Is_Template projects don't show in main list, only used for copying
- Copied_From_Project_ID tracks project lineage for audit purposes
- Consider adding `Event_ID` if projects are always tied to events
- Consider adding `Program_ID` or `Ministry_ID` for organizational hierarchy
- Audit log handled by dp_Audit_Log via API

---

## Table 3: `Project_Budget_Categories`
**Purpose**: Expense and revenue categories within each project

| Field Name | Data Type | Nullable | Description | Example Value |
|------------|-----------|----------|-------------|---------------|
| Project_Budget_Category_ID | INT | No | Primary key (auto-increment) | 1 |
| Project_ID | INT | No | FK to Projects table | 1 |
| Category_Name | NVARCHAR(255) | No | Category display name | "Operational Costs" |
| Category_Type | NVARCHAR(50) | No | Either "expense" or "revenue" | "expense" |
| Display_Order | INT | Yes | Sort order for UI display | 1 |
| Total_Estimated | DECIMAL(18,2) | No | Sum of line item estimates | 203600.00 |
| Total_Actual | DECIMAL(18,2) | No | Sum of line item actuals | 182406.00 |
| Domain_ID | INT | No | Standard MP field | 1 |

**Notes:**
- Total amounts are calculated from line items
- Display_Order helps maintain consistent category ordering
- Audit log handled by dp_Audit_Log via API

---

## Table 4: `Project_Budget_Line_Items`
**Purpose**: Individual line items (budget lines) within categories

| Field Name | Data Type | Nullable | Description | Example Value |
|------------|-----------|----------|-------------|---------------|
| Project_Budget_Line_Item_ID | INT | No | Primary key (auto-increment) | 1 |
| Project_Budget_Category_ID | INT | No | FK to Project_Budget_Categories | 1 |
| Line_Item_Name | NVARCHAR(255) | No | Item display name | "Timberwolf" |
| Line_Item_Description | NVARCHAR(MAX) | Yes | Detailed description | "Venue rental for main sessions" |
| Estimated_Amount | DECIMAL(18,2) | No | Budgeted/estimated amount | 120000.00 |
| Actual_Amount | DECIMAL(18,2) | No | Actual amount spent/received | 120889.00 |
| Quantity | INT | Yes | Number of units (for revenue items) | 200 |
| Unit_Price | DECIMAL(18,2) | Yes | Price per unit (for revenue items) | 225.00 |
| Vendor_Name | NVARCHAR(255) | Yes | Vendor/supplier name | "Timberwolf Lodge" |
| Line_Item_Status | NVARCHAR(50) | No | Current status | "pending", "ordered", "received", "paid", "cancelled" |
| Display_Order | INT | Yes | Sort order within category | 1 |
| Domain_ID | INT | No | Standard MP field | 1 |

**Notes:**
- Quantity and Unit_Price are primarily used for revenue line items (registrations, admissions)
- Actual_Amount is calculated from transactions
- Consider adding `Vendor_Contact_ID` (FK to Contacts) instead of Vendor_Name for better data integrity
- Audit log handled by dp_Audit_Log via API

---

## Table 5: `Project_Budget_Transactions`
**Purpose**: Individual financial transactions (payments, receipts, adjustments)

| Field Name | Data Type | Nullable | Description | Example Value |
|------------|-----------|----------|-------------|---------------|
| Project_Budget_Transaction_ID | INT | No | Primary key (auto-increment) | 1 |
| Project_Budget_Line_Item_ID | INT | No | FK to Project_Budget_Line_Items | 1 |
| Transaction_Date | DATE | No | Date of transaction | "2026-03-15" |
| Transaction_Type | NVARCHAR(50) | No | Type of transaction | "expense", "income", "refund", "adjustment" |
| Transaction_Amount | DECIMAL(18,2) | No | Amount (positive for all types) | 120889.00 |
| Payment_Method | NVARCHAR(100) | No | How payment was made | "Check", "Credit Card", "Cash", "Wire", "ACH" |
| Reference_Number | NVARCHAR(100) | Yes | Check number, confirmation code | "8472" |
| Payee_Name | NVARCHAR(255) | No | Who was paid / who paid | "Timberwolf Lodge" |
| Transaction_Description | NVARCHAR(MAX) | Yes | Additional details | "Venue rental - deposit paid" |
| Receipt_URL | NVARCHAR(500) | Yes | Link to receipt/invoice document | "https://..." |
| Approved_By_Contact_ID | INT | Yes | FK to Contacts (who approved) | 228156 |
| Approved_Date | DATETIME | Yes | When transaction was approved | "2026-03-14" |
| Domain_ID | INT | No | Standard MP field | 1 |

**Notes:**
- All amounts stored as positive numbers; transaction type determines debit/credit
- Consider linking to MinistryPlatform's existing payment/donation tables if applicable
- Receipt_URL could store document in MP's file storage or external cloud storage
- Consider adding `GL_Account_Number` for general ledger integration
- Audit log handled by dp_Audit_Log via API

---

## Relationships Summary

```
Project_Series (1) ──────< (many) Projects
                                     │
                                     └──< (many) Project_Budget_Categories
                                                   │
                                                   └──< (many) Project_Budget_Line_Items
                                                                 │
                                                                 └──< (many) Project_Budget_Transactions
```

**Foreign Key Relationships:**
- `Projects.Project_Series_ID` → `Project_Series.Project_Series_ID` (optional)
- `Projects.Copied_From_Project_ID` → `Projects.Project_ID` (self-referencing, optional)
- `Project_Budget_Categories.Project_ID` → `Projects.Project_ID`
- `Project_Budget_Line_Items.Project_Budget_Category_ID` → `Project_Budget_Categories.Project_Budget_Category_ID`
- `Project_Budget_Transactions.Project_Budget_Line_Item_ID` → `Project_Budget_Line_Items.Project_Budget_Line_Item_ID`
- `Project_Series.Default_Coordinator_Contact_ID` → `Contacts.Contact_ID` (existing MP table, optional)
- `Projects.Project_Coordinator_Contact_ID` → `Contacts.Contact_ID` (existing MP table)
- `Project_Budget_Transactions.Approved_By_Contact_ID` → `Contacts.Contact_ID` (existing MP table, optional)

---

## Additional Considerations

### 1. Status/Type Values - Consider Domain Tables
Instead of hardcoding status values in NVARCHAR fields, consider creating lookup tables:

**`Project_Status_Types`**
- Project_Status_Type_ID
- Status_Name ("draft", "pending", "approved", etc.)
- Display_Order

**`Budget_Status_Types`**
- Budget_Status_Type_ID
- Status_Name ("under", "on-track", "over")
- Color_Code (for UI display: green, yellow, red)

**`Line_Item_Status_Types`**
- Line_Item_Status_Type_ID
- Status_Name ("pending", "ordered", "received", "paid", "cancelled")

**`Transaction_Type_Types`**
- Transaction_Type_Type_ID
- Type_Name ("expense", "income", "refund", "adjustment")

**`Payment_Method_Types`**
- Payment_Method_Type_ID
- Method_Name ("Check", "Credit Card", "Cash", "Wire", "ACH")

### 2. Calculated Fields
These fields are computed from related records and could be:
- Stored in the database and updated via triggers
- Calculated on-the-fly in stored procedures
- Calculated in the API layer

**Projects Table:**
- Total_Estimated_Revenue
- Total_Estimated_Expenses
- Total_Actual_Revenue
- Total_Actual_Expenses
- Budget_Status (based on utilization percentage)

**Project_Budget_Categories Table:**
- Total_Estimated
- Total_Actual

**Project_Budget_Line_Items Table:**
- Actual_Amount (sum of transactions)

### 3. Security & Permissions
Consider MinistryPlatform security features:
- **Page Security**: Who can view/edit projects?
- **Field Security**: Should some users only see estimated amounts, not actuals?
- **Record-level Security**: Should coordinators only see their own projects?

### 4. Integration Points
**Existing MP Tables to Link:**
- `Contacts` - Project coordinators, approvers, vendors
- `Events` - Projects may be tied to specific events
- `Programs` - Projects may belong to ministry programs
- `GL_Accounts` - For accounting system integration
- `Donations` - Link revenue transactions to existing donations

### 5. Audit Trail
All tables include:
- Domain_ID (multi-tenant support)
- Audit logging handled automatically by MinistryPlatform's dp_Audit_Log via API
  - Tracks all inserts, updates, deletes
  - Records user, timestamp, and field-level changes
  - No need for Created_Date, Created_By, Modified_Date, Modified_By fields

Consider adding:
- `__ExternalID` fields for importing from other systems
- `Notes` field for freeform comments

---

## Naming Convention Questions for Finance Team

Please review and confirm preferred terminology:

1. **"Project" vs "Initiative" vs "Event Budget"**
   - Current: `Projects`
   - Alternatives: `Budget_Projects`, `Project_Budgets`, `Financial_Projects`

2. **"Line Item" vs "Budget Line" vs "Expense Item"**
   - Current: `Project_Budget_Line_Items`
   - Alternatives: `Project_Budget_Lines`, `Project_Expenses_Revenue`

3. **"Transaction" vs "Payment" vs "Entry"**
   - Current: `Project_Budget_Transactions`
   - Alternatives: `Project_Payments`, `Project_Financial_Entries`

4. **"Category" vs "Category" vs "Account"**
   - Current: `Project_Budget_Categories`
   - Alternatives: `Project_Budget_Groups`, `Expense_Categories`

5. **Estimated/Actual vs Budgeted/Actual**
   - Current: `Estimated_Amount` / `Actual_Amount`
   - Alternatives: `Budgeted_Amount` / `Actual_Amount`

6. **Revenue vs Income**
   - Current: "revenue" in category type
   - Alternative: "income"

7. **Vendor Name as text vs Contact_ID**
   - Current: `Vendor_Name` (NVARCHAR)
   - Alternative: `Vendor_Contact_ID` (INT FK to Contacts)

---

## Next Steps

1. **Review with Finance Team**
   - Confirm all field names and terminology
   - Identify any missing data points
   - Clarify accounting workflow requirements

2. **Finalize Schema**
   - Create SQL table creation scripts
   - Add indexes for performance
   - Set up foreign key constraints

3. **Create Stored Procedures**
   - `api_Project_Budgets_Get_Projects` - List all projects
   - `api_Project_Budgets_Get_Project_Detail` - Single project with all nested data
   - `api_Project_Budgets_Create_Project` - Insert new project
   - `api_Project_Budgets_Update_Transaction` - Add/edit transactions
   - `api_Project_Budgets_Get_Reports` - Financial reports and analytics

4. **Page Setup in MP Admin**
   - Create pages for each table
   - Configure page security
   - Set up views and sub-pages

5. **API Integration**
   - Update Next.js services to call real API endpoints
   - Remove mock data
   - Add error handling and validation

---

## Sample Queries

### Get Project Budget Summary
```sql
SELECT
    p.Project_ID,
    p.Project_Title,
    p.Project_Status,
    p.Total_Estimated_Expenses - p.Total_Estimated_Revenue AS Estimated_Profit_Loss,
    p.Total_Actual_Expenses - p.Total_Actual_Revenue AS Actual_Profit_Loss,
    CASE
        WHEN p.Total_Estimated_Expenses = 0 THEN 0
        ELSE (p.Total_Actual_Expenses / p.Total_Estimated_Expenses) * 100
    END AS Budget_Utilization_Percent
FROM Projects p
WHERE p.Domain_ID = @DomainID
ORDER BY p.Start_Date DESC
```

### Get Project Detail with All Categories and Line Items
```sql
SELECT
    p.Project_Title,
    c.Category_Name,
    c.Category_Type,
    li.Line_Item_Name,
    li.Estimated_Amount,
    li.Actual_Amount,
    li.Line_Item_Status
FROM Projects p
LEFT JOIN Project_Budget_Categories c ON p.Project_ID = c.Project_ID
LEFT JOIN Project_Budget_Line_Items li ON c.Project_Budget_Category_ID = li.Project_Budget_Category_ID
WHERE p.Project_ID = @ProjectID
ORDER BY c.Display_Order, li.Display_Order
```

### Get All Transactions for a Line Item
```sql
SELECT
    t.Transaction_Date,
    t.Transaction_Type,
    t.Transaction_Amount,
    t.Payment_Method,
    t.Payee_Name,
    t.Transaction_Description,
    c.Display_Name AS Approved_By,
    t.Approved_Date
FROM Project_Budget_Transactions t
LEFT JOIN Contacts c ON t.Approved_By_Contact_ID = c.Contact_ID
WHERE t.Project_Budget_Line_Item_ID = @LineItemID
ORDER BY t.Transaction_Date DESC
```
