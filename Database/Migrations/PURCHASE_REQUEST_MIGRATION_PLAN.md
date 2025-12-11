# Purchase Request Migration Plan

## Overview
Refactor the budget system to separate approval workflow (Purchase Requests) from actual transactions.

## Conceptual Changes

### Before:
- Transactions have an "Approved" field
- Both income and expense transactions have approval

### After:
- **Purchase Requests**: Expense-only records that require approval before purchase
- **Transactions**: Actual money movement (income or expense)
- Expense transactions link to approved purchase requests
- Income transactions link directly to income line items (no approval)

## Schema Changes

### 1. Create New Table: Project_Budget_Purchase_Requests

```sql
CREATE TABLE [dbo].[Project_Budget_Purchase_Requests] (
    [Purchase_Request_ID] INT IDENTITY(1,1) NOT NULL,
    [Requisition_GUID] UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    [Project_ID] INT NOT NULL,
    [Project_Budget_Expense_Line_Item_ID] INT NOT NULL,
    [Requested_By_Contact_ID] INT NOT NULL,
    [Requested_Date] DATETIME NOT NULL DEFAULT GETDATE(),
    [Amount] DECIMAL(18, 2) NOT NULL,
    [Description] NVARCHAR(500) NULL,
    [Vendor_Name] NVARCHAR(100) NULL,
    [Approval_Status] NVARCHAR(50) NOT NULL DEFAULT 'Pending', -- Pending/Approved/Rejected
    [Approved_By_Contact_ID] INT NULL,
    [Approved_Date] DATETIME NULL,
    [Rejection_Reason] NVARCHAR(500) NULL,
    [Domain_ID] INT NOT NULL DEFAULT 1,
    [__ExternalId] INT NULL,

    CONSTRAINT [PK_Project_Budget_Purchase_Requests] PRIMARY KEY CLUSTERED ([Purchase_Request_ID]),
    CONSTRAINT [FK_Purchase_Requests_Projects] FOREIGN KEY ([Project_ID])
        REFERENCES [dbo].[Projects]([Project_ID]),
    CONSTRAINT [FK_Purchase_Requests_Expense_Line_Items] FOREIGN KEY ([Project_Budget_Expense_Line_Item_ID])
        REFERENCES [dbo].[Project_Budget_Expense_Line_Items]([Project_Budget_Expense_Line_Item_ID]),
    CONSTRAINT [FK_Purchase_Requests_Requested_By] FOREIGN KEY ([Requested_By_Contact_ID])
        REFERENCES [dbo].[Contacts]([Contact_ID]),
    CONSTRAINT [FK_Purchase_Requests_Approved_By] FOREIGN KEY ([Approved_By_Contact_ID])
        REFERENCES [dbo].[Contacts]([Contact_ID])
);

-- Indexes
CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Project]
    ON [dbo].[Project_Budget_Purchase_Requests]([Project_ID]);
CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Requisition_GUID]
    ON [dbo].[Project_Budget_Purchase_Requests]([Requisition_GUID]);
CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Requested_By]
    ON [dbo].[Project_Budget_Purchase_Requests]([Requested_By_Contact_ID]);
CREATE NONCLUSTERED INDEX [IX_Purchase_Requests_Status]
    ON [dbo].[Project_Budget_Purchase_Requests]([Approval_Status]);
```

### 2. Modify Existing Table: Project_Budget_Transactions

```sql
-- Add FK to Purchase Requests (nullable - only for expense transactions)
ALTER TABLE [dbo].[Project_Budget_Transactions]
ADD [Purchase_Request_ID] INT NULL,
CONSTRAINT [FK_Transactions_Purchase_Requests] FOREIGN KEY ([Purchase_Request_ID])
    REFERENCES [dbo].[Project_Budget_Purchase_Requests]([Purchase_Request_ID]);

-- Add index
CREATE NONCLUSTERED INDEX [IX_Transactions_Purchase_Request]
    ON [dbo].[Project_Budget_Transactions]([Purchase_Request_ID]);

-- Remove Approved field (no longer needed - approval is on Purchase Request)
ALTER TABLE [dbo].[Project_Budget_Transactions]
DROP COLUMN [Approved];
```

### 3. Data Migration Strategy

```sql
-- For existing EXPENSE transactions that were approved:
-- 1. Create a Purchase Request for each
-- 2. Link the transaction to that Purchase Request
-- 3. Set Purchase Request as Approved with historical data

-- For existing INCOME transactions:
-- 1. Keep as-is (they never needed approval)
-- 2. No Purchase Request needed
```

## New Workflows

### Purchase Request Workflow (Expenses):

1. **Create Purchase Request**
   - User identifies need for purchase
   - Creates request with: line item, amount, vendor, description
   - System assigns GUID for external tracking
   - Status: Pending
   - Requested By: Current user

2. **Approve/Reject Purchase Request**
   - Coordinator reviews request
   - Approves or rejects with optional reason
   - System records approver and approval date

3. **Add Actual Transaction(s)**
   - After purchase is made
   - Create transaction(s) linked to the approved request
   - Can have multiple transactions per request (e.g., deposits, final payment)
   - Transaction date reflects when money actually moved

### Income Transaction Workflow:

1. **Add Income Transaction**
   - Select income line item
   - Enter amount, date, description
   - No approval needed
   - Transaction created immediately

## UI Changes Needed

### Purchase Requests Tab (New):
- List of all purchase requests
- Filter: "My Requests" by default
- Columns: Requisition GUID, Requested By, Line Item, Vendor, Amount, Status, Actions
- Actions: Approve/Reject (if coordinator), Add Transaction (if approved), View Details

### Transactions Tab (Modified):
- Now shows actual transactions only
- Columns: Date, Type, Line Item, Amount, Purchase Request (if expense), Payment Method
- Filter: Income/Expense
- For expenses: Show linked Purchase Request
- For income: Direct add

### Budget Details Page:
- Quick action: "Create Purchase Request" on expense line items
- Quick action: "Add Income" on income line items
- Show purchase request status in line item details

## API Routes Needed

### Purchase Requests:
- `POST /api/projects/[id]/purchase-requests` - Create new request
- `GET /api/projects/[id]/purchase-requests` - List requests (with filters)
- `PATCH /api/projects/[id]/purchase-requests/[requestId]` - Update status
- `DELETE /api/projects/[id]/purchase-requests/[requestId]` - Delete request

### Transactions:
- Modify existing endpoints to handle Purchase Request linking
- `POST /api/projects/[id]/purchase-requests/[requestId]/transactions` - Add transaction to request

## Stored Procedures Needed

- `api_Custom_GetProjectPurchaseRequests_JSON` - Get all requests for a project
- `api_Custom_GetPurchaseRequestDetails_JSON` - Get single request with transactions
- `api_Custom_GetMyPurchaseRequests_JSON` - Get requests created by current user
- Modify existing transaction procs to include purchase request info

## Migration Steps

1. Create Purchase Requests table
2. Add FK column to Transactions table
3. Migrate existing data (create purchase requests from approved expense transactions)
4. Update stored procedures
5. Create new API routes
6. Update UI components
7. Test workflows
8. Deploy

## Permission Model

- **Create Purchase Request**: Anyone working on project
- **Approve/Reject**: Project coordinator only
- **Add Transaction to Request**: Requester or coordinator (after approval)
- **Add Income Transaction**: Anyone working on project
- **View All Requests**: Coordinator
- **View My Requests**: Request creator
