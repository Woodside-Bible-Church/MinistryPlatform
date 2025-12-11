-- =============================================
-- Stored Procedure: api_Custom_GetPurchaseRequestDetails_JSON
-- Description: Get detailed information about a single purchase request including transactions
-- Returns: JSON with purchase request details and associated transactions
-- Parameters: @PurchaseRequestID - Purchase Request ID
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetPurchaseRequestDetails_JSON]
    @PurchaseRequestID INT,
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Build JSON result
    DECLARE @Result NVARCHAR(MAX);

    SELECT @Result = (
        SELECT
            pr.Purchase_Request_ID AS purchaseRequestId,
            pr.Requisition_GUID AS requisitionGuid,
            pr.Project_ID AS projectId,
            pr.Project_Budget_Expense_Line_Item_ID AS lineItemId,

            -- Line item info
            eli.Item_Name AS lineItemName,
            pbc.Project_Budget_Category_ID AS categoryId,
            pct.Project_Category_Type AS categoryName,

            -- Request details
            pr.Amount AS amount,
            pr.Description AS description,
            pr.Vendor_Name AS vendorName,
            pr.Requested_Date AS requestedDate,
            pr.Approval_Status AS approvalStatus,
            pr.Approved_Date AS approvedDate,
            pr.Rejection_Reason AS rejectionReason,

            -- Requester info
            reqC.Contact_ID AS requestedByContactId,
            reqC.Display_Name AS requestedByName,
            reqC.Email_Address AS requestedByEmail,

            -- Approver info
            appC.Contact_ID AS approvedByContactId,
            appC.Display_Name AS approvedByName,

            -- Transactions associated with this purchase request
            (
                SELECT
                    t.Project_Budget_Transaction_ID AS transactionId,
                    t.Transaction_Date AS transactionDate,
                    t.Amount AS amount,
                    t.Description AS description,
                    t.Vendor_Name AS vendorName,
                    pm.Payment_Method AS paymentMethod,
                    pm.Payment_Method_ID AS paymentMethodId
                FROM Project_Budget_Transactions t
                LEFT JOIN Project_Budget_Payment_Methods pm
                    ON t.Payment_Method_ID = pm.Payment_Method_ID
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
                ORDER BY t.Transaction_Date DESC
                FOR JSON PATH
            ) AS transactions,

            -- Transaction summary
            (
                SELECT COUNT(*)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS transactionCount,
            (
                SELECT ISNULL(SUM(t.Amount), 0)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS transactionTotal,

            -- Remaining amount (requested - actually spent)
            pr.Amount - (
                SELECT ISNULL(SUM(t.Amount), 0)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS remainingAmount

        FROM Project_Budget_Purchase_Requests pr
        INNER JOIN Project_Budget_Expense_Line_Items eli
            ON pr.Project_Budget_Expense_Line_Item_ID = eli.Project_Budget_Expense_Line_Item_ID
        INNER JOIN Project_Budget_Categories pbc
            ON eli.Project_Budget_Category_ID = pbc.Project_Budget_Category_ID
        INNER JOIN Project_Category_Types pct
            ON pbc.Project_Category_Type_ID = pct.Project_Category_Type_ID
        INNER JOIN Contacts reqC
            ON pr.Requested_By_Contact_ID = reqC.Contact_ID
        LEFT JOIN Contacts appC
            ON pr.Approved_By_Contact_ID = appC.Contact_ID
        WHERE pr.Purchase_Request_ID = @PurchaseRequestID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- Return the JSON as a single column
    SELECT ISNULL(@Result, '{}') AS JsonResult;

END
GO
