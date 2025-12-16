-- =============================================
-- Stored Procedure: api_Custom_GetProjectPurchaseRequests_JSON
-- Description: Get all purchase requests for a project
-- Returns: JSON array of purchase requests with requester info and transaction count
-- Parameters: @ProjectID - Project ID, @RequestedByContactID (optional) - Filter by requester
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetProjectPurchaseRequests_JSON]
    @ProjectID INT,
    @RequestedByContactID INT = NULL,
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
            li.Line_Item_Name AS lineItemName,
            pbc.Project_Budget_Category_ID AS categoryId,
            pbc.Budget_Category_Name AS categoryName,

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

            -- Transaction count and total
            (
                SELECT COUNT(*)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS transactionCount,
            (
                SELECT ISNULL(SUM(t.Amount), 0)
                FROM Project_Budget_Transactions t
                WHERE t.Purchase_Request_ID = pr.Purchase_Request_ID
            ) AS transactionTotal

        FROM Project_Budget_Purchase_Requests pr
        INNER JOIN Project_Budget_Line_Items li
            ON pr.Project_Budget_Expense_Line_Item_ID = li.Project_Budget_Line_Item_ID
        INNER JOIN Project_Budget_Categories pbc
            ON li.Category_ID = pbc.Project_Budget_Category_ID
        INNER JOIN dp_Users reqU
            ON pr.Requested_By_User_ID = reqU.User_ID
        INNER JOIN Contacts reqC
            ON reqU.Contact_ID = reqC.Contact_ID
        LEFT JOIN dp_Users appU
            ON pr.Approved_By_User_ID = appU.User_ID
        LEFT JOIN Contacts appC
            ON appU.Contact_ID = appC.Contact_ID
        WHERE pr.Project_ID = @ProjectID
          AND (@RequestedByContactID IS NULL OR reqC.Contact_ID = @RequestedByContactID)
        ORDER BY
            CASE pr.Approval_Status
                WHEN 'Pending' THEN 1
                WHEN 'Approved' THEN 2
                WHEN 'Rejected' THEN 3
                ELSE 4
            END,
            pr.Requested_Date DESC
        FOR JSON PATH
    );

    -- Return the JSON as a single column
    SELECT ISNULL(@Result, '[]') AS JsonResult;

END
GO
