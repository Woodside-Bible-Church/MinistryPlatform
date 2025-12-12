-- =============================================
-- Migrate Existing Expense Transactions to Purchase Requests
-- Author: Claude Code
-- Date: 2025-12-11
-- Description: Create purchase requests for existing expense transactions
-- =============================================

USE [MinistryPlatform]
GO

PRINT 'Starting migration of existing expense transactions to purchase requests...'
PRINT ''

-- Create purchase requests for each existing expense transaction
INSERT INTO [dbo].[Project_Budget_Purchase_Requests] (
    [Project_ID],
    [Project_Budget_Expense_Line_Item_ID],
    [Requested_By_Contact_ID],
    [Requested_Date],
    [Amount],
    [Description],
    [Vendor_Name],
    [Approval_Status],
    [Approved_By_Contact_ID],
    [Approved_Date],
    [Domain_ID]
)
SELECT
    t.Project_ID,
    t.Project_Budget_Expense_Line_Item_ID,
    -- Use project coordinator as requester if valid, otherwise default to Contact_ID 1
    CASE
        WHEN coord.Contact_ID IS NOT NULL THEN p.Project_Coordinator
        ELSE 1
    END AS Requested_By_Contact_ID,
    t.Transaction_Date AS Requested_Date,
    t.Amount,
    t.Description,
    t.Payee_Name AS Vendor_Name,  -- Map Payee_Name to Vendor_Name
    'Approved' AS Approval_Status,
    -- Use project coordinator as approver if valid, otherwise default to Contact_ID 1
    CASE
        WHEN coord.Contact_ID IS NOT NULL THEN p.Project_Coordinator
        ELSE 1
    END AS Approved_By_Contact_ID,
    t.Transaction_Date AS Approved_Date,
    t.Domain_ID
FROM [dbo].[Project_Budget_Transactions] t
INNER JOIN [dbo].[Projects] p ON t.Project_ID = p.Project_ID
LEFT JOIN [dbo].[Contacts] coord ON p.Project_Coordinator = coord.Contact_ID
WHERE t.Transaction_Type = 'Expense'
  AND t.Project_Budget_Expense_Line_Item_ID IS NOT NULL
  AND NOT EXISTS (
      -- Don't create duplicates if this migration has already run
      SELECT 1
      FROM [dbo].[Project_Budget_Purchase_Requests] pr
      WHERE pr.Project_ID = t.Project_ID
        AND pr.Project_Budget_Expense_Line_Item_ID = t.Project_Budget_Expense_Line_Item_ID
        AND pr.Amount = t.Amount
        AND pr.Approved_Date = t.Transaction_Date
  );

DECLARE @RowCount INT = @@ROWCOUNT;
PRINT CAST(@RowCount AS VARCHAR(10)) + ' purchase requests created from existing transactions.'
PRINT ''

-- Link transactions to their newly created purchase requests
-- Match based on: Project, Line Item, Amount, and Date
UPDATE t
SET t.Purchase_Request_ID = pr.Purchase_Request_ID
FROM [dbo].[Project_Budget_Transactions] t
INNER JOIN [dbo].[Project_Budget_Purchase_Requests] pr
    ON t.Project_ID = pr.Project_ID
    AND t.Project_Budget_Expense_Line_Item_ID = pr.Project_Budget_Expense_Line_Item_ID
    AND t.Amount = pr.Amount
    AND t.Transaction_Date = pr.Approved_Date
WHERE t.Transaction_Type = 'Expense'
  AND t.Project_Budget_Expense_Line_Item_ID IS NOT NULL
  AND t.Purchase_Request_ID IS NULL;

SET @RowCount = @@ROWCOUNT;
PRINT CAST(@RowCount AS VARCHAR(10)) + ' transactions linked to purchase requests.'
PRINT ''

-- Show summary
PRINT 'Migration Summary:'
PRINT '==================='
SELECT
    COUNT(*) AS TotalPurchaseRequests,
    SUM(CASE WHEN Approval_Status = 'Approved' THEN 1 ELSE 0 END) AS ApprovedRequests,
    COUNT(DISTINCT Project_ID) AS AffectedProjects,
    COUNT(DISTINCT Requested_By_Contact_ID) AS UniqueRequesters
FROM [dbo].[Project_Budget_Purchase_Requests];

PRINT ''
SELECT
    COUNT(*) AS TotalExpenseTransactions,
    SUM(CASE WHEN Purchase_Request_ID IS NOT NULL THEN 1 ELSE 0 END) AS LinkedTransactions,
    SUM(CASE WHEN Purchase_Request_ID IS NULL THEN 1 ELSE 0 END) AS UnlinkedTransactions
FROM [dbo].[Project_Budget_Transactions]
WHERE Transaction_Type = 'Expense';

PRINT ''
PRINT 'Migration completed successfully.'
GO
