-- =============================================
-- Stored Procedure: api_Custom_GetPendingPurchaseRequestsForApproval_JSON
-- Description: Get pending purchase requests with line item budget context for quick approval
-- Returns: JSON with pending requests including budget impact calculations
-- Parameters: @ProjectID - Project ID to get requests for
-- =============================================

CREATE OR ALTER PROCEDURE [dbo].[api_Custom_GetPendingPurchaseRequestsForApproval_JSON]
    @ProjectID INT,
    @UserName NVARCHAR(75) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Build JSON result
    DECLARE @Result NVARCHAR(MAX);

    SELECT @Result = (
        SELECT
            @ProjectID AS projectId,
            p.Project_Title AS projectName,
            p.Slug AS projectSlug,

            -- Pending requests with budget context
            (
                SELECT
                    pr.Purchase_Request_ID AS purchaseRequestId,
                    pr.Requisition_GUID AS requisitionGuid,
                    pr.Amount AS amount,
                    pr.Description AS description,
                    pr.Vendor_Name AS vendorName,
                    pr.Requested_Date AS requestedDate,
                    pr.Approval_Status AS approvalStatus,

                    -- Requester info
                    reqC.Contact_ID AS requestedByContactId,
                    reqC.Display_Name AS requestedByName,
                    reqC.Email_Address AS requestedByEmail,

                    -- Line item info
                    pr.Project_Budget_Line_Item_ID AS lineItemId,
                    li.Line_Item_Name AS lineItemName,
                    pbc.Project_Budget_Category_ID AS categoryId,
                    pbc.Budget_Category_Name AS categoryName,

                    -- Line item budget details
                    li.Estimated_Amount AS lineItemBudgeted,

                    -- Calculate actual spent (sum of all transactions for this line item)
                    ISNULL((
                        SELECT SUM(t.Amount)
                        FROM Project_Budget_Transactions t
                        WHERE t.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                    ), 0) AS lineItemActualSpent,

                    -- Calculate remaining budget
                    li.Estimated_Amount - ISNULL((
                        SELECT SUM(t.Amount)
                        FROM Project_Budget_Transactions t
                        WHERE t.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                    ), 0) AS lineItemRemaining,

                    -- Total of all approved purchase requests for this line item
                    ISNULL((
                        SELECT SUM(pr2.Amount)
                        FROM Project_Budget_Purchase_Requests pr2
                        WHERE pr2.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                          AND pr2.Approval_Status = 'Approved'
                    ), 0) AS approvedPurchaseRequestsTotal,

                    -- Projected spent if this request is approved
                    ISNULL((
                        SELECT SUM(t.Amount)
                        FROM Project_Budget_Transactions t
                        WHERE t.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                    ), 0) + pr.Amount AS projectedSpentAfterApproval,

                    -- Would this approval put the line item over budget?
                    CASE
                        WHEN (ISNULL((
                            SELECT SUM(t.Amount)
                            FROM Project_Budget_Transactions t
                            WHERE t.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                        ), 0) + pr.Amount) > li.Estimated_Amount
                        THEN CAST(1 AS BIT)
                        ELSE CAST(0 AS BIT)
                    END AS wouldBeOverBudget,

                    -- Calculate how much over budget it would be (if applicable)
                    CASE
                        WHEN (ISNULL((
                            SELECT SUM(t.Amount)
                            FROM Project_Budget_Transactions t
                            WHERE t.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                        ), 0) + pr.Amount) > li.Estimated_Amount
                        THEN (ISNULL((
                            SELECT SUM(t.Amount)
                            FROM Project_Budget_Transactions t
                            WHERE t.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                        ), 0) + pr.Amount) - li.Estimated_Amount
                        ELSE 0
                    END AS overBudgetAmount

                FROM Project_Budget_Purchase_Requests pr
                INNER JOIN Project_Budget_Line_Items li
                    ON pr.Project_Budget_Line_Item_ID = li.Project_Budget_Line_Item_ID
                INNER JOIN Project_Budget_Categories pbc
                    ON li.Category_ID = pbc.Project_Budget_Category_ID
                INNER JOIN dp_Users reqU
                    ON pr.Requested_By_User_ID = reqU.User_ID
                INNER JOIN Contacts reqC
                    ON reqU.Contact_ID = reqC.Contact_ID
                WHERE pr.Project_ID = @ProjectID
                  AND pr.Approval_Status = 'Pending'
                ORDER BY pr.Requested_Date ASC
                FOR JSON PATH
            ) AS pendingRequests,

            -- Summary counts
            (
                SELECT COUNT(*)
                FROM Project_Budget_Purchase_Requests pr
                WHERE pr.Project_ID = @ProjectID
                  AND pr.Approval_Status = 'Pending'
            ) AS pendingCount

        FROM Projects p
        WHERE p.Project_ID = @ProjectID
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    -- Return the JSON as a single column
    SELECT ISNULL(@Result, '{}') AS JsonResult;

END
GO
